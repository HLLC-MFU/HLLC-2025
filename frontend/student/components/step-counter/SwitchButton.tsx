import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import styles from './styles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface SwitchButtonProps {
  isIndividual: boolean;
  onPress: () => void;
}

const SwitchButton = ({ isIndividual, onPress }:SwitchButtonProps) => (
  <TouchableOpacity style={styles.switchButton} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.switchOvalButton}>
      {isIndividual ? (
        <>
          <MaterialIcons
            name="groups"
            size={28}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <MaterialIcons
            name="arrow-forward"
            size={32}
            color="#fff"
          />
        </>
      ) : (
        <>
          <MaterialIcons
            name="arrow-back"
            size={32}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <MaterialIcons
            name="person"
            size={28}
            color="#fff"
          />
        </>
      )}
    </View>
  </TouchableOpacity>
);

export default SwitchButton; 