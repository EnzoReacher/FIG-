import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as FileSystem from 'expo-file-system';
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
const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
type NutritionGoalResponse = {
  goal: { calorieTarget: number } | null;
  explanation: { calculatedTarget?: number | null } | null;
};
type DevicePermission = 'unknown' | 'granted' | 'denied' | 'unavailable';

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
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [steps, setSteps] = useState<{
    steps: number;
    permission: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [temporaryImageId, setTemporaryImageId] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] =
    useState<DevicePermission>('unknown');
  const [galleryPermission, setGalleryPermission] =
    useState<DevicePermission>('unknown');
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
  const [stepPermission, setStepPermission] =
    useState<DevicePermission>('unknown');
  const [manualSteps, setManualSteps] = useState('');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editItems, setEditItems] = useState<
    Array<{ foodId: string; quantity: string; name: string }>
  >([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [day, foodList, stepState, goal] = await Promise.all([
        api<Today>('/v1/meals'),
        api<{ foods: Food[] }>('/v1/foods'),
        api<{ steps: number; permission: string }>('/v1/steps'),
        api<NutritionGoalResponse>('/v1/nutrition-goal').catch(() => null),
      ]);
      setToday(day);
      setFoods(foodList.foods);
      setSteps(stepState);
      setCalorieTarget(
        goal?.goal?.calorieTarget ??
          goal?.explanation?.calculatedTarget ??
          null,
      );
    } catch {
      setError('Unable to reach the API. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);
  const syncSteps = useCallback(async () => {
    try {
      if (!(await Pedometer.isAvailableAsync())) {
        setStepPermission('unavailable');
        return;
      }
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
          day: localDay(start),
          steps: result.steps,
          source: 'expo-pedometer',
        }),
      });
      await load();
    } catch {
      setStepPermission('unavailable');
    }
  }, [load]);
  const syncManualSteps = async () => {
    const steps = Number(manualSteps);
    if (!Number.isInteger(steps) || steps < 0) {
      setError('Enter a non-negative whole-number step total.');
      return;
    }
    try {
      await api('/v1/steps/sync', {
        method: 'POST',
        body: JSON.stringify({
          steps,
          source: 'manual',
        }),
      });
      setManualSteps('');
      await load();
    } catch {
      setError('Manual steps could not be saved.');
    }
  };
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
    setError(null);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setGalleryPermission('denied');
        return;
      }
      setGalleryPermission('granted');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch {
      setGalleryPermission('unavailable');
      setError('Gallery is unavailable on this device.');
    }
  };
  const takePhoto = async () => {
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setCameraPermission('denied');
        return;
      }
      setCameraPermission('granted');
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch {
      setCameraPermission('unavailable');
      setError('Camera is unavailable on this device.');
    }
  };
  const analyze = async () => {
    if (!imageUri) return;
    let temporaryUri: string | null = null;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      temporaryUri = `${FileSystem.cacheDirectory}forge-food-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: imageUri, to: temporaryUri });
      const upload = await api<{ temporaryImageId: string }>(
        '/v1/food-analysis/upload',
        { method: 'POST', body: JSON.stringify({ imageUri: temporaryUri }) },
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
      await FileSystem.deleteAsync(temporaryUri, { idempotent: true });
      setImageUri(null);
    } catch {
      setPhotoError('Photo analysis failed. Retry or use manual entry.');
      if (temporaryUri)
        await FileSystem.deleteAsync(temporaryUri, { idempotent: true });
    } finally {
      setPhotoBusy(false);
    }
  };
  const startMealEdit = (meal: Meal) => {
    setEditingMealId(meal.meal.id);
    setEditMealName(meal.meal.name);
    setEditItems(
      meal.items.map((item) => ({
        foodId: item.food.id,
        quantity: String(item.quantityHundredths / 100),
        name: item.food.name,
      })),
    );
  };
  const saveMealEdit = async () => {
    if (!editingMealId) return;
    const items = editItems.map((item) => ({
      foodId: item.foodId,
      quantity: Number(item.quantity),
    }));
    if (
      !editMealName.trim() ||
      items.length === 0 ||
      items.some(
        (item) => !Number.isFinite(item.quantity) || item.quantity <= 0,
      )
    ) {
      setError('Enter a meal name and positive quantities.');
      return;
    }
    try {
      await api(`/v1/meals/${editingMealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editMealName.trim(), items }),
      });
      setEditingMealId(null);
      await load();
    } catch {
      setError('Meal could not be updated. Retry.');
    }
  };
  const discardAnalysis = async () => {
    if (temporaryImageId) {
      await api(`/v1/food-analysis/${temporaryImageId}`, {
        method: 'DELETE',
      }).catch(() => undefined);
    }
    setAnalysis(null);
    setTemporaryImageId(null);
  };
  const confirmAnalysis = async () => {
    if (!analysis) return;
    try {
      await api('/v1/food-analysis/confirm', {
        method: 'POST',
        body: JSON.stringify({
          temporaryImageId,
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
            <Text>
              {calorieTarget === null
                ? 'Daily target unavailable'
                : `of ${calorieTarget} kcal daily target`}
            </Text>
            <Text style={styles.steps}>
              Steps today: {steps?.steps ?? 0}
              {stepPermission === 'denied'
                ? ' (permission denied)'
                : stepPermission === 'unavailable'
                  ? ' (unavailable)'
                  : stepPermission === 'unknown'
                    ? ' (manual entry available)'
                    : ''}
            </Text>
            <TextInput
              placeholder="Manual step total"
              value={manualSteps}
              onChangeText={setManualSteps}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Button title="Save manual steps" onPress={syncManualSteps} />
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
                  {editingMealId === meal.meal.id ? (
                    <>
                      <TextInput
                        value={editMealName}
                        onChangeText={setEditMealName}
                        style={styles.input}
                      />
                      {editItems.map((item, index) => (
                        <View
                          key={`${item.foodId}-${index}`}
                          style={styles.editItem}
                        >
                          <View>
                            <Text>{item.name}</Text>
                            <Button
                              title="Remove"
                              onPress={() =>
                                setEditItems((current) =>
                                  current.filter(
                                    (_, itemIndex) => itemIndex !== index,
                                  ),
                                )
                              }
                            />
                          </View>
                          <TextInput
                            value={item.quantity}
                            onChangeText={(quantity) =>
                              setEditItems((current) =>
                                current.map((entry, itemIndex) =>
                                  itemIndex === index
                                    ? { ...entry, quantity }
                                    : entry,
                                ),
                              )
                            }
                            keyboardType="decimal-pad"
                            style={styles.quantityInput}
                          />
                        </View>
                      ))}
                      <Text>Add another food</Text>
                      {foods.map((food) => (
                        <Button
                          key={food.id}
                          title={`Add ${food.name}`}
                          onPress={() =>
                            setEditItems((current) => [
                              ...current,
                              {
                                foodId: food.id,
                                quantity: '1',
                                name: food.name,
                              },
                            ])
                          }
                        />
                      ))}
                      <Button title="Save changes" onPress={saveMealEdit} />
                      <Button
                        title="Cancel"
                        onPress={() => setEditingMealId(null)}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.mealName}>{meal.meal.name}</Text>
                      <Text>
                        {meal.items.map((i) => i.food.name).join(', ')}
                      </Text>
                      <Button
                        title="Edit"
                        onPress={() => startMealEdit(meal)}
                      />
                      <Button
                        title="Delete"
                        onPress={async () => {
                          await api(`/v1/meals/${meal.meal.id}`, {
                            method: 'DELETE',
                          });
                          await load();
                        }}
                      />
                    </>
                  )}
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
      <Text style={styles.muted}>
        Camera: {cameraPermission} · Gallery: {galleryPermission}
      </Text>
      {imageUri && <Text style={styles.muted}>Photo selected.</Text>}
      {photoError && <Text style={styles.errorText}>{photoError}</Text>}
      <Button
        title={photoBusy ? 'Analyzing…' : 'Analyze image'}
        onPress={analyze}
        disabled={!imageUri || photoBusy}
      />
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
          <Button title="Discard" onPress={discardAnalysis} />
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
  errorText: { color: '#a00', marginVertical: 8 },
  editItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityInput: {
    borderColor: '#aaa',
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 80,
    padding: 8,
  },
});
