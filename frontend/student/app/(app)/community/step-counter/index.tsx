import React, { useRef, useState } from "react";
import { View, Dimensions, ScrollView, StyleSheet, SafeAreaView, Platform, TouchableOpacity } from "react-native";

import StepData from "@/components/step-counter/StepData";
import LeaderBoard from "@/components/step-counter/LeaderBoard";
import { useStepData } from "@/hooks/useStepLeaderboard";
import { ChevronLeft } from "lucide-react-native";
import chatStyles from "@/constants/chats/chatStyles";
import { router } from "expo-router";

const { width } = Dimensions.get("window");


export default function StepCounterScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const onScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setPageIndex(newIndex);
  };
  const { stepData, achievementData, loading } = useStepData();


  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollRef}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={[chatStyles.backButton, { position: 'absolute', top: 20, left: 20 }]}
          onPress={() => router.replace('/(app)')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        {/* Page 1: Step Progress */}
        <View style={[styles.page, { width }]}>
          <StepData achievementData={achievementData} leaderboardData={stepData} loading={loading} />
        </View>

        {/* Page 2: Leaderboard */}
        <View style={[styles.page, { width }]}>
          <LeaderBoard data={stepData} loading={loading} />
        </View>
      </ScrollView>
      <View style={styles.dotContainer}>
        {[0, 1].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              pageIndex === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent", marginTop: Platform.OS === 'ios' ? 20 : 20},
  page: { flex: 1, justifyContent: "center", alignItems: "center" },

  progressContainer: {
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

  totalStepsBox: { alignItems: "center", marginTop: 12 },
  totalStepsDesc: { color: "#ddd", fontSize: 13, textAlign: "center" },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Platform.OS === 'ios' ? 0 : 0,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginHorizontal: 2.5,
  },
  dotActive: {
    backgroundColor: "#fff",
  },
  dotInactive: {
    backgroundColor: "#999",
  },
});
