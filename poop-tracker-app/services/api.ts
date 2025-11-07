
import axios from 'axios';

// ═════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═════════════════════════════════════════════════════════════════

// ⚠️ IMPORTANT: Change this to your backend IP address
// When testing on physical phone, use your computer's local IP
// Get it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
// Example: http://192.168.1.100:5000

// For Expo Go app on same network:
const API_BASE_URL = 'http://localhost:5000/api';
// Change localhost to your computer IP if testing on physical device:
// const API_BASE_URL = 'http://192.168.1.XXX:5000/api';

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,  // 10 second timeout
});

// ═════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════

// Food object structure
export interface Food {
    id?: number;
    user_id: number;
    food_name: string;
    quantity: number;
    quantity_unit: string;
    nutrition_data?: string;  // JSON string from backend
    eaten_at?: string;
}

// Poop log object structure
export interface PoopLog {
    id?: number;
    user_id: number;
    bristol_type: number;
    bleeding: boolean;
    urgency: number;
    notes?: string;
    logged_at?: string;
}

// ML prediction response
export interface Prediction {
    predicted_bristol_type: number;
    description: string;
    food_summary: {
        calories: number;
        fiber: number;
        fat: number;
        protein: number;
        meals: number;
    };
}

// Analytics response
export interface Analytics {
    frequency_data: Array<{
        date: string;
        count: number;
    }>;
    average_bristol_score: number | null;
    total_logs: number;
}

// ═════════════════════════════════════════════════════════════════
// USER ENDPOINTS
// ═════════════════════════════════════════════════════════════════

export const createUser = async (username: string) => {
    // Create a new user
    // Request: {"username": "john_doe"}
    // Response: {"id": 1, "username": "john_doe"}

    const response = await api.post('/users', { username });
    return response.data;
};

export const getUser = async (userId: number) => {
    // Get user by ID
    // Request: GET /users/1
    // Response: {"id": 1, "username": "john_doe", "created_at": "..."}

    const response = await api.get(`/users/${userId}`);
    return response.data;
};

// ═════════════════════════════════════════════════════════════════
// FOOD ENDPOINTS
// ═════════════════════════════════════════════════════════════════

export const logFood = async (food: Food) => {
    // Log a food entry
    // User enters: food_name, quantity, quantity_unit
    // Backend: Looks up nutrition from USDA, stores with nutrition data

    // Request: {
    //   "user_id": 1,
    //   "food_name": "pasta",
    //   "quantity": 1.5,
    //   "quantity_unit": "cup"
    // }

    // Response: {
    //   "id": 42,
    //   "message": "Food logged!",
    //   "nutrition": {"calories": 221, "fiber": 2, ...}
    // }

    const response = await api.post('/foods', food);
    return response.data;
};

export const getFoods = async (userId: number, date?: string) => {
    // Get foods logged by a user
    // Optional: filter by date (format: YYYY-MM-DD)

    // Request: GET /foods/1
    // OR: GET /foods/1?date=2025-11-06

    // Response: [
    //   {"id": 1, "food_name": "pasta", "quantity": 1.5, ...},
    //   {"id": 2, "food_name": "chicken", "quantity": 100, ...}
    // ]

    const params = date ? { date } : {};
    const response = await api.get(`/foods/${userId}`, { params });
    return response.data;
};

// ═════════════════════════════════════════════════════════════════
// POOP ENDPOINTS
// ═════════════════════════════════════════════════════════════════

export const logPoop = async (poopLog: PoopLog) => {
    // Log a poop entry
    // User enters: bristol_type, bleeding, urgency, notes

    // Request: {
    //   "user_id": 1,
    //   "bristol_type": 4,
    //   "bleeding": false,
    //   "urgency": 2,
    //   "notes": "felt normal"
    // }

    // Response: {
    //   "id": 99,
    //   "message": "Poop logged successfully! 💩"
    // }

    const response = await api.post('/poops', poopLog);
    return response.data;
};

export const getPoops = async (userId: number, date?: string) => {
    // Get poop logs by user
    // Optional: filter by date (format: YYYY-MM-DD)

    // Request: GET /poops/1
    // OR: GET /poops/1?date=2025-11-06

    // Response: [
    //   {"id": 1, "bristol_type": 4, "bleeding": 0, "urgency": 2, ...},
    //   {"id": 2, "bristol_type": 5, "bleeding": 1, "urgency": 3, ...}
    // ]

    const params = date ? { date } : {};
    const response = await api.get(`/poops/${userId}`, { params });
    return response.data;
};

// ═════════════════════════════════════════════════════════════════
// ML PREDICTION ENDPOINT
// ═════════════════════════════════════════════════════════════════

export const getPrediction = async (userId: number): Promise<Prediction> => {
    // Get ML prediction of next poop based on food intake
    // Requires: Model trained with 20+ food/poop pairs

    // Request: POST /predict
    // {"user_id": 1}

    // Response: {
    //   "predicted_bristol_type": 4,
    //   "description": "Smooth and soft sausage (ideal!)",
    //   "food_summary": {
    //     "calories": 2150,
    //     "fiber": 25,
    //     "fat": 60,
    //     "protein": 120,
    //     "meals": 3
    //   }
    // }

    const response = await api.post('/predict', { user_id: userId });
    return response.data;
};

// ═════════════════════════════════════════════════════════════════
// ANALYTICS ENDPOINT
// ═════════════════════════════════════════════════════════════════

export const getAnalytics = async (userId: number): Promise<Analytics> => {
    // Get user analytics from last 30 days

    // Request: GET /analytics/1

    // Response: {
    //   "frequency_data": [
    //     {"date": "2025-11-06", "count": 2},
    //     {"date": "2025-11-05", "count": 1},
    //     ...
    //   ],
    //   "average_bristol_score": 4.2,
    //   "total_logs": 28
    // }

    const response = await api.get(`/analytics/${userId}`);
    return response.data;
};

// ═════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═════════════════════════════════════════════════════════════════

// Add request interceptor (runs before every request)
api.interceptors.request.use(
    (config) => {
        // You can add auth tokens here if needed
        // config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor (runs after every response)
api.interceptors.response.use(
    (response) => {
        // All good
        return response;
    },
    (error) => {
        // Handle errors
        if (error.response?.status === 404) {
            console.error('Resource not found:', error.config.url);
        } else if (error.response?.status === 500) {
            console.error('Server error:', error.response.data);
        } else if (error.code === 'ECONNABORTED') {
            console.error('Request timeout - backend not responding');
        } else if (error.message === 'Network Error') {
            console.error('Network error - check if backend is running and IP is correct');
        }
        return Promise.reject(error);
    }
);

export default api;