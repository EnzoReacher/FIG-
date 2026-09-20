import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
type Food = {
  id: string;
  name: string;
  caloriesHundredths: number;
  proteinHundredths: number;
  carbohydrateHundredths: number;
  fatHundredths: number;
};
type Meal = {
  meal: { id: string; name: string; eatenAt: string };
  items: Array<{ quantityHundredths: number; food: Food }>;
};
type Today = {
  meals: Meal[];
  totals: {
    calories: number;
    proteinGrams: number;
    carbohydrateGrams: number;
    fatGrams: number;
  };
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok)
    throw new Error(
      response.status === 0 ? 'offline' : `Request failed (${response.status})`,
    );
  return response.status === 204 ? (undefined as T) : response.json();
}

export default function Index() {
  const [today, setToday] = useState<Today | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [day, foodList] = await Promise.all([
        api<Today>('/v1/meals'),
        api<{ foods: Food[] }>('/v1/foods'),
      ]);
      setToday(day);
      setFoods(foodList.foods);
    } catch {
      setError('Unable to reach the API. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const addFood = async () => {
    try {
      const result = await api<{ food: Food }>('/v1/foods', {
        method: 'POST',
        body: JSON.stringify({
          name,
          calories: Number(calories),
          proteinGrams: 0,
          carbohydrateGrams: 0,
          fatGrams: 0,
        }),
      });
      const now = new Date().toISOString();
      await api('/v1/meals', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Snack',
          eatenAt: now,
          items: [{ foodId: result.food.id, quantity: 1 }],
        }),
      });
      setName('');
      setCalories('');
      await load();
    } catch {
      setError(
        'Food could not be saved. Enter a valid name and calorie value.',
      );
    }
  };
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.title}>Today</Text>
      {error && (
        <View style={styles.error}>
          <Text>{error}</Text>
          <Button title="Retry" onPress={load} />
        </View>
      )}
      {loading && !today ? (
        <ActivityIndicator />
      ) : (
        today && (
          <>
            <Text style={styles.calories}>
              {Math.round(today.totals.calories)} kcal
            </Text>
            <Text>of your daily target</Text>
            <View style={styles.card}>
              <Text>Protein {today.totals.proteinGrams.toFixed(1)} g</Text>
              <Text>Carbs {today.totals.carbohydrateGrams.toFixed(1)} g</Text>
              <Text>Fat {today.totals.fatGrams.toFixed(1)} g</Text>
            </View>
            <Text style={styles.heading}>Meals</Text>
            {today.meals.length === 0 ? (
              <Text>No meals logged today.</Text>
            ) : (
              today.meals.map((meal) => (
                <View style={styles.meal} key={meal.meal.id}>
                  <Text style={styles.mealName}>{meal.meal.name}</Text>
                  <Text>{meal.items.map((i) => i.food.name).join(', ')}</Text>
                  <Button
                    title="Delete"
                    onPress={async () => {
                      await api(`/v1/meals/${meal.meal.id}`, {
                        method: 'DELETE',
                      });
                      await load();
                    }}
                  />
                </View>
              ))
            )}
          </>
        )
      )}
      <Text style={styles.heading}>Manual food entry</Text>
      <TextInput
        placeholder="Food name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <Button
        title="Add to today"
        onPress={addFood}
        disabled={!name || !calories}
      />
      {foods.length > 0 && (
        <Text style={styles.muted}>
          Saved foods: {foods.map((food) => food.name).join(', ')}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  calories: { fontSize: 34, fontWeight: '700' },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 8, marginTop: 24 },
  card: {
    backgroundColor: '#eef5ef',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 16,
  },
  meal: {
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  mealName: { fontSize: 17, fontWeight: '600' },
  input: {
    borderColor: '#aaa',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  error: { backgroundColor: '#fee', padding: 12 },
  muted: { color: '#666', marginTop: 16 },
});
