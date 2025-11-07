import requests
import json
from typing import Optional, Dict
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get API key from environment variable (not hardcoded)
USDA_API_KEY = os.getenv('USDA_API_KEY')

if not USDA_API_KEY:
    raise ValueError("USDA_API_KEY not found in .env file!")

USDA_API_ENDPOINT = "https://api.nal.usda.gov/fdc/v1/foods/search"

def fetch_nutrition_data(food_name: str, quantity: float, unit: str) -> Optional[Dict]:
    try:
        # Make HTTP request to USDA API
        params = {
            'query': food_name,
            'pageSize': 1,  # Only want the top result
            'api_key': USDA_API_KEY
        }
        
        response = requests.get(USDA_API_ENDPOINT, params=params)
        response.raise_for_status()  # Raise error if status code is 400-500

        data = response.json()  # Convert response text to Python dictionary
        
        if not data.get('foods') or len(data['foods']) == 0:
            return None
        
                # Extract the first (best match) food item
        food_item = data['foods'][0]
        
        # Extract relevant nutrition info
        nutrients = food_item.get('foodNutrients', [])
        
        nutrition_dict = {
            'calories': 0,
            'protein': 0,
            'fiber': 0,
            'fat': 0,
            'food_description': food_item.get('description', 'Unknown')
        }

        # Parse nutrients from USDA response
        nutrient_mapping = {
            'Energy': 'calories',           # USDA calls it "Energy"
            'Protein': 'protein',
            'Fiber, total dietary': 'fiber',
            'Total lipid (fat)': 'fat'
        }
        
        for nutrient in nutrients:
            nutrient_name = nutrient.get('nutrientName', '')
            nutrient_value = nutrient.get('value', 0)
            
            # Check if this nutrient matches one we care about
            if nutrient_name in nutrient_mapping:
                key = nutrient_mapping[nutrient_name]
                nutrition_dict[key] = nutrient_value

        # Adjust for serving size / quantity
        # Note: USDA typically gives per-100g or per-serving values
        # You might need to calculate based on quantity and unit
        
        return nutrition_dict
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching nutrition data: {e}")
        return None


