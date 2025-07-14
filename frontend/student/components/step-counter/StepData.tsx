import useHealthData from "@/hooks/health/useHealthData";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { AchievementData, LeaderboardData } from "@/hooks/useStepLeaderboard";
type Props = {
    leaderboardData: LeaderboardData | null;
    achievementData: AchievementData[] | null;
    loading?: boolean;
}
export default function StepData({ leaderboardData, achievementData }: Props) {
    const { steps, deviceMismatch } = useHealthData(new Date());

    const circleRadius = 100;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const goal = achievementData?.[0]?.archievement || 50000;
    const stepPercent = Math.min((leaderboardData?.myRank?.totalStep ?? 0) / goal, 1);
    return (
        <>
            <View style={styles.progressContainer}>
                <Svg width={300} height={300}>
                    <Circle
                        cx={150}
                        cy={150}
                        r={circleRadius}
                        stroke="#222"
                        strokeWidth={18}
                        fill="none"
                        opacity={0.2}
                    />
                    <G transform={`rotate(-90 150 150)`}>
                        <Circle
                            cx={150}
                            cy={150}
                            r={circleRadius}
                            stroke="#FF7A00"
                            strokeWidth={18}
                            fill="none"
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={circleCircumference * (1 - stepPercent)}
                            strokeLinecap="round"

                        />
                    </G>
                </Svg>
                {
                    leaderboardData && leaderboardData.myRank && (
                        <View style={styles.stepTextBox}>
                            <Text style={styles.stepLabel}>Total</Text>
                            <Text style={styles.stepNumber}>{leaderboardData.myRank.totalStep.toLocaleString()}</Text>
                            <Text style={styles.stepLabel}>Today: {steps.toLocaleString()}</Text>
                        </View>
                    )
                }
            </View>
            <View style={styles.totalStepsBox}>
                <Text style={styles.totalStepsDesc}>
                    {deviceMismatch
                        ? "Device mismatch detected. Steps won’t count toward your campaign. Please update your device."
                        : "Keep moving!"}
                </Text>
            </View>
            <View style={styles.totalStepsBox}>
                <Text style={styles.totalStepsDesc}>
                    Your goal is {goal.toLocaleString()} steps.
                </Text>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    progressContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    stepTextBox: {
        position: "absolute",
        top: 0,
        left: 0,
        width: 300,
        height: 300,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumber: { fontSize: 32, fontWeight: "bold", color: "white" },
    stepLabel: { fontSize: 16, color: "#ffffff80" },

    totalStepsBox: { alignItems: "center", marginTop: 12 },
    totalStepsDesc: { color: "#ddd", fontSize: 13, textAlign: "center" },
});