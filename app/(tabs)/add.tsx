// app/(tabs)/add.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { foodItemsService } from '@/services/foodItems';

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState<'fridge' | 'shelf'>('fridge');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await foodItemsService.addItem({
        name: name.trim(),
        quantity: quantityNum,
        unit: unit.trim() || undefined,
        location,
        category: category.trim() || undefined,
        expiry_date: expiryDate?.toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Item added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
      // Reset form
      setName('');
      setQuantity('1');
      setUnit('');
      setCategory('');
      setExpiryDate(null);
      setNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const commonUnits = ['pcs', 'kg', 'g', 'L', 'ml', 'oz', 'lb'];
  const commonCategories = ['Dairy', 'Meat', 'Vegetables', 'Fruits', 'Beverages', 'Snacks', 'Frozen', 'Condiments'];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText type="title">Add New Item</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Item Name *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colorScheme === 'dark' ? '#FFF' : '#000',
                  },
                ]}
                placeholder="e.g., Milk, Apples, Chicken"
                placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <ThemedText style={styles.label}>Quantity *</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                      color: colorScheme === 'dark' ? '#FFF' : '#000',
                    },
                  ]}
                  placeholder="1"
                  placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <ThemedText style={styles.label}>Unit</ThemedText>
                <View style={styles.unitContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {commonUnits.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitButton,
                          unit === u && styles.unitButtonActive,
                          unit === u && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                        ]}
                        onPress={() => setUnit(unit === u ? '' : u)}
                      >
                        <ThemedText style={unit === u ? styles.unitTextActive : styles.unitText}>
                          {u}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Location *</ThemedText>
              <View style={styles.locationContainer}>
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    location === 'fridge' && styles.locationButtonActive,
                    location === 'fridge' && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  ]}
                  onPress={() => setLocation('fridge')}
                >
                  <ThemedText style={location === 'fridge' ? styles.locationTextActive : styles.locationText}>
                    🧊 Fridge
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    location === 'shelf' && styles.locationButtonActive,
                    location === 'shelf' && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  ]}
                  onPress={() => setLocation('shelf')}
                >
                  <ThemedText style={location === 'shelf' ? styles.locationTextActive : styles.locationText}>
                    🗄️ Shelf
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Category</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {commonCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                      category === cat && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                    ]}
                    onPress={() => setCategory(category === cat ? '' : cat)}
                  >
                    <ThemedText style={category === cat ? styles.categoryTextActive : styles.categoryText}>
                      {cat}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Expiry Date</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText style={{ color: expiryDate ? (colorScheme === 'dark' ? '#FFF' : '#000') : '#999' }}>
                  {expiryDate ? expiryDate.toLocaleDateString() : 'Select expiry date'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={expiryDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setExpiryDate(selectedDate);
                  }
                }}
              />
            )}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Notes</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5',
                    color: colorScheme === 'dark' ? '#FFF' : '#000',
                  },
                ]}
                placeholder="Any additional notes..."
                placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                loading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Add Item</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  unitContainer: {
    height: 50,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  locationButtonActive: {
    backgroundColor: '#007AFF',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationTextActive: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryScroll: {
    maxHeight: 40,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dateButton: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});