import { router } from "expo-router";
import { ChevronLeft, Medal } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import Svg, { Circle } from "react-native-svg";
import useHealthData, { useUpdateDevice } from '@/hooks/health/useHealthData';

export default function StepCounterScreen() {
  const { steps, deviceMismatch } = useHealthData(new Date());
  const goal = 50000;
  const stepPercent = Math.min(steps / goal, 1);
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const { updateDevice } = useUpdateDevice();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.stepCounterFab}
            onPress={() => router.replace('/chat')}
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
            onPress={() => router.replace('/step-counter/leaderBoard')}
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
            <Text style={styles.stepLabel}>Total</Text>
            <Text style={styles.stepNumber}>{steps.toLocaleString()}</Text>
            <Text style={styles.stepLabel}>Step</Text>
          </View>
        </View>
        <View style={styles.totalStepsBox}>

          <Text style={styles.totalStepsDesc}>
            {deviceMismatch ? (
              <>
                <Text style={styles.totalStepsWarningTitle}>Device mismatch detected.{"\n"}</Text>
                <Text style={styles.totalStepsWarningMessage}>
                  Steps from this device won’t count toward your campaign.{"\n"}
                  Please update your campaign device to continue.
                </Text>
              </>
            ) : (
              "Keep moving!"
            )}
          </Text>


          {deviceMismatch && (
            <TouchableOpacity
              style={styles.updateDeviceButton}
              onPress={() => updateDevice().then(() => {
                router.replace('/step-counter');
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.updateDeviceButtonText}>Update Device</Text>
            </TouchableOpacity>
          )}
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
  stepNumber: { fontSize: 32, fontWeight: "bold", color: "white" },
  stepLabel: { fontSize: 16, color: "#ffffff80" },

  totalStepsBox: { alignItems: "center", marginBottom: 24 },
  totalStepsTitle: { color: "white", fontWeight: "bold", fontSize: 18 },
  totalStepsDesc: { color: "#ddd", fontSize: 13, marginTop: 2, textAlign: "center" },

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
  updateDeviceButton: {
    marginTop: 12,
    backgroundColor: '#FF7A00',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateDeviceButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  totalStepsWarningTitle: {
    color: '#FF7A00',
    fontWeight: 'bold',
    fontSize: 14,
  },

  totalStepsWarningMessage: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

});