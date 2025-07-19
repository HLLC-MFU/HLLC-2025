import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Categories } from '@/constants/chats/categories';
import { useLanguage } from '@/context/LanguageContext';


interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}
export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const { language } = useLanguage();
  return (
    <View style={styles.categoryFilterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {Categories.map(({ name, key, color }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryFilterButton,
              selectedCategory === key && styles.categoryFilterButtonActive,
            ]}
            onPress={() => onCategoryChange(key)}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={40}
              tint="light"
              style={styles.categoryFilterBlur}
            >
              <LinearGradient
                colors={selectedCategory === key ? [color, `${color}dd`] : ['transparent', 'transparent']}
                style={styles.categoryFilterGradient}
              >
                <Text style={[
                  styles.categoryFilterText,
                  selectedCategory === key && styles.categoryFilterTextActive
                ]}>
                  {name[language]}
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
