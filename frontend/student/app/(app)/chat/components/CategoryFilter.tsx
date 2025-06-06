import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Categories } from '../constants/categories';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
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
              { borderColor: color }
            ]}
            onPress={() => onCategoryChange(name)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedCategory === name ? [color, `${color}dd`] : ['#ffffff', '#f8fafc']}
              style={styles.categoryFilterGradient}
            >
              <Icon size={16} color={selectedCategory === name ? '#fff' : color} />
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === name && styles.categoryFilterTextActive
              ]}>
                {name}
              </Text>
            </LinearGradient>
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
    borderWidth: 1,
  },
  categoryFilterButtonActive: {},
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
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },
}); 