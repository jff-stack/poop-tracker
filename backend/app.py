from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db, init_db
from nutrition_api import fetch_nutrition_data
import json
import sqlite3
import joblib
import numpy as np
from datetime import datetime, timedelta

# ═════════════════════════════════════════════════════════════════
# SETUP
# ═════════════════════════════════════════════════════════════════

app = Flask(__name__)
CORS(app)

# Create tables on startup
init_db()

# ═════════════════════════════════════════════════════════════════
# LOAD ML MODEL
# ═════════════════════════════════════════════════════════════════

try:
    model = joblib.load('poop_predictor_model.pkl')
    scaler = joblib.load('scaler.pkl')
    MODEL_LOADED = True
except Exception as e:
    MODEL_LOADED = False
    print(f"Model not trained yet. Train with 20+ samples first. Error: {e}")

# ═════════════════════════════════════════════════════════════════
# USER ENDPOINTS
# ═════════════════════════════════════════════════════════════════

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Username required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO users (username) VALUES (?)', (username,))
        conn.commit()
        user_id = cursor.lastrowid
        return jsonify({'id': user_id, 'username': username}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 400
    finally:
        conn.close()


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify(dict(user)), 200
    return jsonify({'error': 'User not found'}), 404

# ═════════════════════════════════════════════════════════════════
# FOOD LOGGING ENDPOINTS
# ═════════════════════════════════════════════════════════════════

@app.route('/api/foods', methods=['POST'])
def log_food():
    """
    Log food with simplified input
    User only enters: food_name, quantity, quantity_unit
    Backend looks up nutrition from USDA automatically
    """
    data = request.get_json()
    
    required_fields = ['user_id', 'food_name', 'quantity', 'quantity_unit']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Fetch nutrition data from USDA API
    nutrition = fetch_nutrition_data(
        data['food_name'],
        data['quantity'],
        data['quantity_unit']
    )
    
    if nutrition is None:
        return jsonify({
            'error': f"Couldn't find nutrition data for {data['food_name']}",
            'suggestion': "Try a different spelling (e.g., 'chicken breast' instead of 'chicken')"
        }), 404

    # Convert nutrition dict to JSON string for storage
    nutrition_json = json.dumps(nutrition)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO foods_eaten 
        (user_id, food_name, quantity, quantity_unit, nutrition_data)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['user_id'],
        data['food_name'],
        data['quantity'],
        data['quantity_unit'],
        nutrition_json
    ))
    
    conn.commit()
    food_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        'id': food_id,
        'message': 'Food logged successfully!',
        'nutrition': nutrition,
        'food_matched': nutrition.get('food_description')
    }), 201


@app.route('/api/foods/<int:user_id>', methods=['GET'])
def get_foods(user_id):
    """Get all foods for a user"""
    date = request.args.get('date')
    
    conn = get_db()
    cursor = conn.cursor()
    
    if date:
        cursor.execute('''
            SELECT * FROM foods_eaten 
            WHERE user_id = ? AND DATE(eaten_at) = ?
            ORDER BY eaten_at DESC
        ''', (user_id, date))
    else:
        cursor.execute('''
            SELECT * FROM foods_eaten 
            WHERE user_id = ?
            ORDER BY eaten_at DESC
            LIMIT 50
        ''', (user_id,))
    
    foods = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(foods), 200

# ═════════════════════════════════════════════════════════════════
# POOP LOGGING ENDPOINTS
# ═════════════════════════════════════════════════════════════════

@app.route('/api/poops', methods=['POST'])
def log_poop():
    """Log a poop entry"""
    data = request.get_json()
    
    required_fields = ['user_id', 'bristol_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    bristol_type = data['bristol_type']
    if bristol_type not in range(1, 8):
        return jsonify({'error': 'Bristol type must be 1-7'}), 400
    
    urgency = data.get('urgency', 3)
    if urgency and urgency not in range(1, 6):
        return jsonify({'error': 'Urgency must be 1-5'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO poop_logs 
        (user_id, bristol_type, bleeding, urgency, notes)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['user_id'],
        bristol_type,
        1 if data.get('bleeding') else 0,
        urgency,
        data.get('notes', '')
    ))
    
    conn.commit()
    poop_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        'id': poop_id,
        'message': 'Poop logged successfully! 💩'
    }), 201


@app.route('/api/poops/<int:user_id>', methods=['GET'])
def get_poops(user_id):
    """Get all poop logs for a user"""
    date = request.args.get('date')
    
    conn = get_db()
    cursor = conn.cursor()
    
    if date:
        cursor.execute('''
            SELECT * FROM poop_logs 
            WHERE user_id = ? AND DATE(logged_at) = ?
            ORDER BY logged_at DESC
        ''', (user_id, date))
    else:
        cursor.execute('''
            SELECT * FROM poop_logs 
            WHERE user_id = ?
            ORDER BY logged_at DESC
            LIMIT 50
        ''', (user_id,))
    
    poops = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(poops), 200

# ═════════════════════════════════════════════════════════════════
# ML PREDICTION ENDPOINT
# ═════════════════════════════════════════════════════════════════

@app.route('/api/predict', methods=['POST'])
def predict_poop():
    """Predict poop characteristics based on recent food intake"""
    if not MODEL_LOADED:
        return jsonify({
            'error': 'ML model not trained yet',
            'message': 'Log at least 20 meals and poops, then run train_model.py'
        }), 503
    
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            GROUP_CONCAT(nutrition_data, '||') as all_nutrition,
            COUNT(*) as meal_count
        FROM foods_eaten
        WHERE user_id = ?
        AND eaten_at >= datetime('now', '-24 hours')
    ''', (user_id,))
    
    food_data = cursor.fetchone()
    conn.close()
    
    if not food_data or food_data['meal_count'] == 0:
        return jsonify({
            'error': 'No food data from last 24 hours',
            'message': 'Log some foods first to get predictions'
        }), 404
    
    try:
        total_calories = 0
        total_fiber = 0
        total_fat = 0
        total_protein = 0
        
        nutrition_strings = food_data['all_nutrition'].split('||')
        
        for nutrition_str in nutrition_strings:
            nutrition = json.loads(nutrition_str)
            total_calories += nutrition.get('calories', 0)
            total_fiber += nutrition.get('fiber', 0)
            total_fat += nutrition.get('fat', 0)
            total_protein += nutrition.get('protein', 0)
    
    except Exception as e:
        return jsonify({
            'error': 'Error parsing nutrition data',
            'details': str(e)
        }), 500
    
    features = np.array([[
        total_calories,
        total_protein,
        total_fiber,
        total_fat,
        food_data['meal_count']
    ]])
    
    features_scaled = scaler.transform(features)
    prediction = model.predict(features_scaled)[0]
    
    bristol_descriptions = {
        1: "Separate hard lumps (constipated)",
        2: "Lumpy and sausage-like",
        3: "Sausage with cracks",
        4: "Smooth and soft sausage (ideal!)",
        5: "Soft blobs with clear edges",
        6: "Mushy consistency",
        7: "Liquid (diarrhea)"
    }
    
    return jsonify({
        'predicted_bristol_type': int(prediction),
        'description': bristol_descriptions.get(int(prediction), 'Unknown'),
        'food_summary': {
            'calories': round(total_calories, 1),
            'fiber': round(total_fiber, 1),
            'fat': round(total_fat, 1),
            'protein': round(total_protein, 1),
            'meals': food_data['meal_count']
        }
    }), 200

# ═════════════════════════════════════════════════════════════════
# ANALYTICS ENDPOINT
# ═════════════════════════════════════════════════════════════════

@app.route('/api/analytics/<int:user_id>', methods=['GET'])
def get_analytics(user_id):
    """Get user analytics and patterns"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            DATE(logged_at) as date,
            COUNT(*) as count
        FROM poop_logs
        WHERE user_id = ?
        AND logged_at >= datetime('now', '-30 days')
        GROUP BY DATE(logged_at)
        ORDER BY date DESC
    ''', (user_id,))
    
    frequency_data = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('''
        SELECT AVG(bristol_type) as avg_bristol
        FROM poop_logs
        WHERE user_id = ?
        AND logged_at >= datetime('now', '-30 days')
    ''', (user_id,))
    
    avg_bristol_row = cursor.fetchone()
    avg_bristol = avg_bristol_row['avg_bristol'] if avg_bristol_row else None
    
    conn.close()
    
    return jsonify({
        'frequency_data': frequency_data,
        'average_bristol_score': round(avg_bristol, 1) if avg_bristol else None,
        'total_logs': len(frequency_data)
    }), 200

# ═════════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ═════════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# ═════════════════════════════════════════════════════════════════
# START SERVER
# ═════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)