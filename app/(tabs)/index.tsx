// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { foodItemsService } from '@/services/foodItems';
import { FoodItem } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function InventoryScreen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fridge' | 'shelf'>('all');
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    loadItems();
  }, [user, filter]);

  const loadItems = async () => {
    try {
      const location = filter === 'all' ? undefined : filter;
      const data = await foodItemsService.getItems(location);
      setItems(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleItemPress = (item: FoodItem) => {
    Alert.alert(
      item.name,
      `Quantity: ${item.quantity}${item.unit ? ' ' + item.unit : ''}\nLocation: ${item.location}\nExpiry: ${
        item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'Not set'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Used',
          onPress: () => handleMarkAsUsed(item),
        },
        {
          text: 'Delete',
          onPress: () => handleDelete(item),
          style: 'destructive',
        },
      ]
    );
  };

  const handleMarkAsUsed = async (item: FoodItem) => {
    try {
      await foodItemsService.logUsage(item.id, 'used', item.quantity);
      await loadItems();
      Alert.alert('Success', 'Item marked as used');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = async (item: FoodItem) => {
    try {
      await foodItemsService.deleteItem(item.id);
      await loadItems();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getExpiryColor = (expiryDate?: string) => {
    if (!expiryDate) return colorScheme === 'dark' ? '#666' : '#999';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return '#FF3B30'; // Red - expired
    if (daysUntilExpiry <= 3) return '#FF9500'; // Orange - expiring soon
    if (daysUntilExpiry <= 7) return '#FFCC00'; // Yellow - expiring this week
    return '#34C759'; // Green - fresh
  };

  const renderItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => handleItemPress(item)}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <View style={[styles.locationBadge, item.location === 'fridge' ? styles.fridgeBadge : styles.shelfBadge]}>
          <ThemedText style={styles.locationText}>
            {item.location === 'fridge' ? '🧊' : '🗄️'} {item.location}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.itemDetails}>
        <ThemedText style={styles.quantity}>
          {item.quantity} {item.unit || 'items'}
        </ThemedText>
        {item.expiry_date && (
          <ThemedText style={[styles.expiry, { color: getExpiryColor(item.expiry_date) }]}>
            Expires: {new Date(item.expiry_date).toLocaleDateString()}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>No items in your inventory</ThemedText>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
        onPress={() => router.push('/(tabs)/add')}
      >
        <ThemedText style={styles.addButtonText}>Add Your First Item</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">🧊 FridgeWise</ThemedText>
        <ThemedText style={styles.subtitle}>Your Food Inventory</ThemedText>
      </View>

      {Platform.OS === 'ios' ? (
        <SegmentedControl
        values={['All', 'Fridge', 'Shelf']}
        selectedIndex={filter === 'all' ? 0 : filter === 'fridge' ? 1 : 2}
        onChange={(event: any) => {
          const index = event.nativeEvent.selectedSegmentIndex;
          setFilter(index === 0 ? 'all' : index === 1 ? 'fridge' : 'shelf');
        }}
        style={styles.segmentedControl}
        />
      ) : (
        <View style={styles.filterContainer}>
          {['all', 'fridge', 'shelf'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                filter === f && styles.filterButtonActive,
                filter === f && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              ]}
              onPress={() => setFilter(f as any)}
            >
              <ThemedText style={filter === f ? styles.filterTextActive : styles.filterText}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyList : null}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  segmentedControl: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  locationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fridgeBadge: {
    backgroundColor: '#E3F2FD',
  },
  shelfBadge: {
    backgroundColor: '#FFF3E0',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    opacity: 0.7,
  },
  expiry: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});