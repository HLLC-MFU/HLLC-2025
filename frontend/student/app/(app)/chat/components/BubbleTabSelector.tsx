import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

type TabKey = 'my' | 'discover'; // ✅ เพิ่ม type นี้ให้ตรงกับที่ใช้ใน index.tsx

type Tab = { key: TabKey; label: string };
type Props = {
  tabs: Tab[];
  activeKey: TabKey;
  onSelect: (key: TabKey) => void; // ✅ แก้จาก string → TabKey
};


export default function BubbleTabSelector({ tabs, activeKey, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const { width } = Dimensions.get('window');
const tabWidth = (width - 64) / 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 999,
    padding: 4,
    marginVertical: 12,
    marginHorizontal: 24,
  },
  tab: {
    width: tabWidth,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
  },
});
