# COMPLETE: app / (tabs) / index.tsx - Pink UI Ready to Copy - Paste

import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { logFood, getFoods, type Food } from '../../services/api';

const USER_ID = 1;

export default function FoodLogScreen() {
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('cup');
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [foodsLoading, setFoodsLoading] = useState(true);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    try {
      setFoodsLoading(true);
      const foods = await getFoods(USER_ID);
      setRecentFoods(foods.slice(0, 5));
    } catch (error) {
      console.error('Error loading foods:', error);
      Alert.alert('Error', 'Failed to load recent foods');
    } finally {
      setFoodsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    if (!quantity.trim()) {
      Alert.alert('Error', 'Please enter a quantity');
      return;
    }

    setLoading(true);
    try {
      const food: Food = {
        user_id: USER_ID,
        food_name: foodName,
        quantity: parseFloat(quantity),
        quantity_unit: quantityUnit,
      };

      await logFood(food);
      Alert.alert('Success', '🍽️ Food logged successfully!');

      setFoodName('');
      setQuantity('');
      setQuantityUnit('cup');

      loadRecentFoods();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to log food. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🍽️</Text>
        <Text style={styles.headerTitle}>What did you eat?</Text>
        <Text style={styles.headerSubtitle}>Log your food to track nutrition</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Food Name *</Text>
        <TextInput
          style={styles.input}
          value={foodName}
          onChangeText={setFoodName}
          placeholder="e.g., Chicken Caesar Salad"
          placeholderTextColor="#FFB6D9"
          editable={!loading}
        />

        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g., 1.5"
          placeholderTextColor="#FFB6D9"
          keyboardType="decimal-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Unit *</Text>
        <View style={styles.unitSelector}>
          {['cup', 'gram', 'serving', 'slice'].map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                quantityUnit === unit && styles.unitButtonActive,
              ]}
              onPress={() => setQuantityUnit(unit)}
              disabled={loading}
            >
              <Text style={[
                styles.unitText,
                quantityUnit === unit && styles.unitTextActive
              ]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Log Food 🍴</Text>
          )}
        </TouchableOpacity>
      </View>

      {foodsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.loadingText}>Loading recent foods...</Text>
        </View>
      ) : recentFoods.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Foods</Text>

          {recentFoods.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.food_name}</Text>
                <Text style={styles.foodQuantity}>
                  {food.quantity} {food.quantity_unit}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => Alert.alert('Delete', 'Delete this food? (Not implemented yet)')}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🥗</Text>
          <Text style={styles.emptyTitle}>No foods logged yet</Text>
          <Text style={styles.emptySubtitle}>Start by logging your first meal above!</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ═════════════════════════════════════════════════════════════════
// COMPLETE PINK THEME STYLING
// ═════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F9',
  },

  // HEADER
  header: {
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
    backgroundColor: '#FFB6D9',
    borderBottomWidth: 4,
    borderBottomColor: '#FF69B4',
    borderBottomStyle: 'dashed',
    marginBottom: 5,
  },

  headerEmoji: {
    fontSize: 70,
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF1493',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 105, 180, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#C2185B',
    fontStyle: 'italic',
  },

  // FORM
  form: {
    padding: 20,
    paddingTop: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF1493',
    marginBottom: 10,
    marginTop: 18,
    textShadowColor: 'rgba(255, 105, 180, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  input: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 3,
    borderColor: '#FFB6D9',
    borderStyle: 'solid',
    color: '#FF1493',

    shadowColor: '#FF69B4',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // UNIT SELECTOR
  unitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingHorizontal: 5,
  },

  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFB6D9',
    backgroundColor: 'white',

    shadowColor: '#FF69B4',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  unitButtonActive: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF1493',
    borderWidth: 4,

    shadowColor: '#FF1493',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  unitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFB6D9',
  },

  unitTextActive: {
    color: 'white',
    fontWeight: '900',
  },

  // BUTTON
  button: {
    backgroundColor: '#FF69B4',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
    marginHorizontal: 15,
    borderWidth: 3,
    borderColor: '#FF1493',

    shadowColor: '#FF1493',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#FFB6D9',
  },

  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FFB6D9',
    fontWeight: '600',
  },

  // RECENT FOODS
  recentSection: {
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 3,
    borderTopColor: '#FFB6D9',
    borderTopStyle: 'dashed',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF1493',
    marginBottom: 15,
    textShadowColor: 'rgba(255, 105, 180, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  foodItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFB6D9',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#FF69B4',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },

  foodInfo: {
    flex: 1,
  },

  foodName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF1493',
    marginBottom: 5,
  },

  foodQuantity: {
    fontSize: 14,
    color: '#FFB6D9',
    fontWeight: '500',
  },

  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },

  deleteText: {
    fontSize: 20,
  },

  // EMPTY STATE
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },

  emptyEmoji: {
    fontSize: 70,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF1493',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#FFB6D9',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});