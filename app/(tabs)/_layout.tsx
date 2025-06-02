import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const MenuItem = ({ emoji, title, onPress }: { emoji: string; title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
      <ThemedText style={styles.menuEmoji}>{emoji}</ThemedText>
      <ThemedText style={styles.menuTextBlack}>{title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inventory',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add Item',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="plus.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color }) => (
              <View style={styles.menuTabBarButton}>
                <IconSymbol size={28} name="menu" color={color} style={{ marginBottom: -4 }} />
                <ThemedText style={styles.menuTabLabel}>Menu</ThemedText>
              </View>
            ),
            tabBarButton: (props) => (
              <TouchableOpacity
                style={styles.menuTabBarButton}
                activeOpacity={0.85}
                onPress={() => setIsModalVisible(true)}
              >
                <View style={{alignItems: 'center'}}>
                  <IconSymbol size={28} name="menu" color={Colors[colorScheme ?? 'light'].tint} style={{ marginBottom: -4 }} />
                  <ThemedText style={styles.menuTabLabel}>Menu</ThemedText>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <MenuItem 
              emoji="📅" 
              title="Calendar View"
              onPress={() => { setIsModalVisible(false); }} 
            />
            <MenuItem 
              emoji="🛒" 
              title="Shopping List" 
              onPress={() => { setIsModalVisible(false); }} 
            />
            <MenuItem 
              emoji="⚙" 
              title="Settings" 
              onPress={() => { setIsModalVisible(false); }} 
            />
            <MenuItem 
              emoji="📊" 
              title="Stats" 
              onPress={() => { setIsModalVisible(false); }} 
            />
            <MenuItem 
              emoji="👤" 
              title="Profile" 
              onPress={() => { setIsModalVisible(false); }} 
            />
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0)', // No black overlay
  },
  modalContent: {
    alignSelf: 'center',
    width: '96%',
    marginBottom: 18,
    borderRadius: 22,
    paddingVertical: 18,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  closeButton: {
    fontSize: 22,
    color: '#888',
    fontWeight: 'bold',
    padding: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(180,180,180,0.13)',
  },
  menuEmoji: {
    fontSize: 24,
    marginRight: 18,
  },
  menuText: {
    fontSize: 17,
    fontWeight: '600',
  },
  menuTextBlack: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  menuTabBarButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 100,
    pointerEvents: 'box-none',
    paddingRight: 32,
  },
  menuTabBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  menuTabLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
});