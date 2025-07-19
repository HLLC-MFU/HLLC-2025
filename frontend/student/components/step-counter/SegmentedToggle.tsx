import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
interface SegmentedToggleProps {
  value: number;
  onChange: (idx: number) => void;
}

const SegmentedToggle = ({ value, onChange }: SegmentedToggleProps) => {

  const { t } = useTranslation();
  const options = [t('step.individual'), t('step.school'), t('step.achievement')];


  return (
    <View style={styles.container}>
      {options.map((option, idx) => (
        <TouchableOpacity
          key={option}
          style={[styles.button, value === idx && styles.selected]}
          onPress={() => onChange(idx)}
          activeOpacity={0.8}
        >
          <Text style={[styles.text, value === idx && styles.selectedText]} numberOfLines={1} ellipsizeMode="tail">
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 32,
    padding: 3,
    alignSelf: 'center',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 32,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  selected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  text: {
    color: '#ffffff70',
    fontWeight: '500',
    fontSize: 12,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default SegmentedToggle; 