import { router } from "expo-router";
import { ChevronLeft, Medal } from "lucide-react-native";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function StepCounterScreen() {
  const step = 3600;
  const stepPercent = 0.36; 
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
          style={styles.stepCounterFab}
          onPress={() => router.back()}
          activeOpacity={0.9}
        >
          <View style={styles.stepCounterFabInner}>
          <ChevronLeft size={24} color="#fff" />
          </View>
        </TouchableOpacity>
          <View style={styles.titleBox}>
            <Text style={styles.title}>NUBGAO</Text>
          </View>
          <TouchableOpacity
          style={styles.stepCounterFab}
          onPress={() => router.replace('/(app)/step-counter/leaderBoard')}
          activeOpacity={0.9}
        >
          <View style={styles.stepCounterFabInner}>
            <Medal size={24} color="#fff" />
          </View>
          </TouchableOpacity>
        </View>

        {/* Step Progress */}
        <View style={styles.progressContainer}>
          <Svg width={160} height={160}>
            <Circle
              cx={80}
              cy={80}
              r={circleRadius}
              stroke="#222"
              strokeWidth={18}
              fill="none"
              opacity={0.2}
            />
            <Circle
              cx={80}
              cy={80}
              r={circleRadius}
              stroke="#FF7A00"
              strokeWidth={18}
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset={circleCircumference * (1 - stepPercent)}
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.stepTextBox}>
            <Text style={styles.stepNumber}>{step.toLocaleString()}</Text>
            <Text style={styles.stepLabel}>Step</Text>
          </View>
        </View>

        {/* Total Steps */}
        <View style={styles.totalStepsBox}>
          <Text style={styles.totalStepsTitle}>🔥 Total Steps</Text>
          <Text style={styles.totalStepsDesc}>These numbers are based on distance</Text>
        </View>

        {/* Rules Cards */}
        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.cardBack]}>
            <Text style={styles.cardTitle}>The Rules{"\n"}to Get Reward</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardSmall}>The first 5 people to run 50,000 steps</Text>
            <Text style={styles.cardTitle}>The Rules{"\n"}to Get Reward</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  container: { flex: 1, alignItems: "center", paddingTop: 0 },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    position: "absolute",
    top: 20,
    zIndex: 10,
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleBox: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  title: { fontWeight: "bold", fontSize: 16, color: "#333" },

  progressContainer: {
    marginTop: 90,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextBox: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: { fontSize: 32, fontWeight: "bold", color: "#222" },
  stepLabel: { fontSize: 16, color: "#888" },

  totalStepsBox: { alignItems: "center", marginBottom: 24 },
  totalStepsTitle: { color: "#FF7A00", fontWeight: "bold", fontSize: 18 },
  totalStepsDesc: { color: "#888", fontSize: 13, marginTop: 2 },

  cardsContainer: { width: "100%", alignItems: "center", marginTop: 10 },
  card: {
    width: "88%",
    minHeight: 110,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 24,
    padding: 20,
    marginBottom: -30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: "center",
  },
  cardBack: {
    position: "absolute",
    top: 24,
    left: "4%",
    backgroundColor: "rgba(255,255,255,0.6)",
    transform: [{ rotate: "6deg" }],
    zIndex: 0,
  },
  cardSmall: { color: "#888", fontSize: 12, marginBottom: 6 },
  cardTitle: { color: "#333", fontWeight: "bold", fontSize: 20, lineHeight: 28 },
  stepCounterFab: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCounterFabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCounterFabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});