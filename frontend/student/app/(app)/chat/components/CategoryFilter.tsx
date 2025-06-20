import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Categories } from '../constants/categories';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}
export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <View style={styles.categoryFilterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {Categories.map(({ name, icon: Icon, color }) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.categoryFilterButton,
              selectedCategory === name && styles.categoryFilterButtonActive,
             
            ]}
            onPress={() => onCategoryChange(name)}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={40}
              tint="light"
              style={styles.categoryFilterBlur}
            >
              <LinearGradient
                colors={selectedCategory === name ? [color, `${color}dd`] : ['transparent', 'transparent']}
                style={styles.categoryFilterGradient}
              >
                <Icon size={16} color= '#fff' />
                <Text style={[
                  styles.categoryFilterText,
                  selectedCategory === name && styles.categoryFilterTextActive
                ]}>
                  {name}
                </Text>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryFilterContainer: {
    marginBottom: 20,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryFilterButton: {
    borderRadius: 20,
    overflow: 'hidden',

  },
  categoryFilterButtonActive: {},
  categoryFilterBlur: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryFilterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff70',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },
}); 