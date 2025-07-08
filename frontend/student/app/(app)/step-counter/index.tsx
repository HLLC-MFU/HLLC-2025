import React, { useRef, useState } from "react";
import { View, Dimensions, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import LeaderBoard from "@/components/step-counter/LeaderBoard";
import StepData from "@/components/step-counter/StepData";
import { useStepCounter } from "@/hooks/useStepLeaderboard";

const { width } = Dimensions.get("window");

export default function StepCounterScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const onScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setPageIndex(newIndex);
  };
    const { individualStepCounter, loading } = useStepCounter();

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
        {/* Page 1: Step Progress */}
        <View style={[styles.page, { width }]}>
          <StepData />
        </View>

        {/* Page 2: Leaderboard */}
        <View style={[styles.page, { width }]}>
          {individualStepCounter && (
            <LeaderBoard individualStepCounter={individualStepCounter} loading={loading} />
          )}
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
  safeArea: { flex: 1, backgroundColor: "transparent" },
  page: { flex: 1, paddingTop: 20, paddingHorizontal: 20, justifyContent: "center", alignItems: "center" },

  progressContainer: {
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

  totalStepsBox: { alignItems: "center", marginTop: 12 },
  totalStepsDesc: { color: "#ddd", fontSize: 13, textAlign: "center" },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 80,
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
