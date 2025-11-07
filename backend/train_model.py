import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import json
from database import get_db

def prepare_training_data():
    """
    Creates training data by correlating food intake with poop outcomes
    
    Example:
    User ate: 1 banana, 1 yogurt, 1 apple (high fiber)
    6-24 hours later: Poop type 4 (ideal)
    
    We learn: high fiber foods → better poops
    """
    conn = get_db()
    
    # Query: for each poop, get all foods eaten 6-24 hours before it
    query = '''
        SELECT 
            pl.id as poop_id,
            pl.bristol_type,
            pl.urgency,
            pl.bleeding,
            pl.logged_at as poop_time,
            COUNT(fe.id) as meal_count,
            GROUP_CONCAT(fe.nutrition_data, '||') as all_nutrition
        FROM poop_logs pl
        LEFT JOIN foods_eaten fe ON pl.user_id = fe.user_id
            AND fe.eaten_at BETWEEN datetime(pl.logged_at, '-24 hours')
                AND datetime(pl.logged_at, '-6 hours')
        GROUP BY pl.id
        HAVING meal_count > 0
    '''
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    return df

def extract_nutrition_features(nutrition_json_str):
    """
    Takes stored nutrition JSON and extracts numbers for ML
    
    Input: '{"calories": 150, "fiber": 3.2, ...}'
    Output: [150, 3.2, ...]  (numeric values)
    """
    try:
        nutrition_list = []
        # nutrition_json_str might contain multiple foods separated by '||'
        for nutrition_str in nutrition_json_str.split('||'):
            nutrition = json.loads(nutrition_str)
            nutrition_list.append(nutrition)
        
        # Sum up totals for the meal(s)
        total_calories = sum(n.get('calories', 0) for n in nutrition_list)
        total_protein = sum(n.get('protein', 0) for n in nutrition_list)
        total_fiber = sum(n.get('fiber', 0) for n in nutrition_list)
        total_fat = sum(n.get('fat', 0) for n in nutrition_list)
        
        return [total_calories, total_protein, total_fiber, total_fat]
    except:
        return [0, 0, 0, 0]  # Return zeros if parsing fails
    
def train_model():
    """Train the machine learning model"""
    print("Preparing training data...")
    df = prepare_training_data()
    
    if len(df) < 20:
        print(f"Need 20+ samples to train. Currently have {len(df)}")
        return False
    # Extract features for ML
    X_list = []  # Features (input: nutrition info)
    y_list = []  # Labels (output: bristol type)
    
    for idx, row in df.iterrows():
        nutrition_features = extract_nutrition_features(row['all_nutrition'])
        X_list.append(nutrition_features)
        y_list.append(row['bristol_type'])
    
    X = np.array(X_list)  # Convert list to numpy array
    y = np.array(y_list)

    # Split data: 80% training, 20% testing
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features (important for ML!)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

        # Train Random Forest Classifier
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,      # Create 100 decision trees
        max_depth=10,          # Each tree can be max 10 levels deep
        random_state=42,       # Reproducibility
        class_weight='balanced' # Handle imbalanced classes
    )
    
    model.fit(X_train_scaled, y_train)

    # Test the model
    y_pred = model.predict(X_test_scaled)
    accuracy = (y_pred == y_test).sum() / len(y_test)
    print(f"Model Accuracy: {accuracy:.2%}")

        # Save model and scaler
    joblib.dump(model, 'poop_predictor_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    
    print("✅ Model saved!")
    return True