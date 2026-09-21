import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Pedometer } from 'expo-sensors';
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
  const [steps, setSteps] = useState<{
    steps: number;
    permission: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [temporaryImageId, setTemporaryImageId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    name: string;
    calories: number;
    proteinGrams: number;
    carbohydrateGrams: number;
    fatGrams: number;
    confidence: number;
    assumptions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepPermission, setStepPermission] = useState<
    'granted' | 'denied' | 'unavailable'
  >('unavailable');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [day, foodList, stepState] = await Promise.all([
        api<Today>('/v1/meals'),
        api<{ foods: Food[] }>('/v1/foods'),
        api<{ steps: number; permission: string }>('/v1/steps'),
      ]);
      setToday(day);
      setFoods(foodList.foods);
      setSteps(stepState);
    } catch {
      setError('Unable to reach the API. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);
  const syncSteps = useCallback(async () => {
    try {
      const permission = await Pedometer.getPermissionsAsync();
      if (!permission.granted) {
        const requested = await Pedometer.requestPermissionsAsync();
        if (!requested.granted) {
          setStepPermission('denied');
          return;
        }
      }
      setStepPermission('granted');
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(start, new Date());
      await api('/v1/steps/sync', {
        method: 'POST',
        body: JSON.stringify({
          day: start.toISOString().slice(0, 10),
          steps: result.steps,
          source: 'expo-pedometer',
        }),
      });
      await load();
    } catch {
      setStepPermission('unavailable');
    }
  }, [load]);
  useEffect(() => {
    void load();
    void syncSteps();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncSteps();
    });
    return () => subscription.remove();
  }, [load, syncSteps]);
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
  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return setError('Photo library permission denied.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return setError('Camera permission denied.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };
  const analyze = async () => {
    if (!imageUri) return;
    try {
      const upload = await api<{ temporaryImageId: string }>(
        '/v1/food-analysis/upload',
        { method: 'POST', body: JSON.stringify({ imageUri }) },
      );
      const result = await api<{ result: typeof analysis }>(
        '/v1/food-analysis',
        {
          method: 'POST',
          body: JSON.stringify({ temporaryImageId: upload.temporaryImageId }),
        },
      );
      setTemporaryImageId(upload.temporaryImageId);
      setAnalysis(result.result);
    } catch {
      setError('Photo analysis failed. You can add the food manually.');
    }
  };
  const confirmAnalysis = async () => {
    if (!analysis) return;
    try {
      await api('/v1/food-analysis/confirm', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: imageUri,
          result: {
            ...analysis,
            proteinGrams: analysis.proteinGrams,
            carbohydrateGrams: analysis.carbohydrateGrams,
            fatGrams: analysis.fatGrams,
          },
          eatenAt: new Date().toISOString(),
        }),
      });
      setAnalysis(null);
      setImageUri(null);
      setTemporaryImageId(null);
      await load();
    } catch {
      setError('The analyzed food could not be added.');
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
            <Text style={styles.steps}>
              Steps today: {steps?.steps ?? 0}
              {stepPermission === 'denied' || steps?.permission === 'denied'
                ? ' (permission denied)'
                : steps?.permission === 'unavailable'
                  ? ' (unavailable)'
                  : ''}
            </Text>
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
      <Text style={styles.heading}>Photo analysis (review before adding)</Text>
      <Button title="Choose from gallery" onPress={choosePhoto} />
      <Button title="Take a photo" onPress={takePhoto} />
      {imageUri && <Text style={styles.muted}>Photo selected.</Text>}
      <Button title="Analyze image" onPress={analyze} disabled={!imageUri} />
      {analysis && (
        <View style={styles.card}>
          <Text style={styles.mealName}>{analysis.name}</Text>
          <TextInput
            value={analysis.name}
            onChangeText={(name) => setAnalysis({ ...analysis, name })}
            style={styles.input}
          />
          <TextInput
            value={String(analysis.calories)}
            onChangeText={(value) =>
              setAnalysis({ ...analysis, calories: Number(value) || 0 })
            }
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Text>
            {analysis.calories} kcal · confidence{' '}
            {(analysis.confidence * 100).toFixed(0)}%
          </Text>
          <Text>{analysis.assumptions.join(' ')}</Text>
          <Button title="Confirm and add" onPress={confirmAnalysis} />
          <Button
            title="Discard"
            onPress={() => {
              setAnalysis(null);
              setImageUri(null);
              setTemporaryImageId(null);
            }}
          />
        </View>
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
  steps: { fontSize: 17, marginTop: 12 },
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
