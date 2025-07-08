import useHealthData from "@/hooks/health/useHealthData";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function StepData() {
    const { steps, deviceMismatch } = useHealthData(new Date());
    const circleRadius = 70;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const goal = 50000;
    const stepPercent = Math.min(steps / goal, 1);
    return (
        <>
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
});