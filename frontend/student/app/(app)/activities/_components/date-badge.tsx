import { View, Text } from "react-native"

export function DateBadge({ date }: { date: string }) {
  const d = new Date(date)
  const month = d.toLocaleString("en-US", { month: "long" }).toUpperCase()
  const day = d.getDate()

  return (
    <View
      style={{
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: "center",
        backgroundColor: "#f2f2f2",
        width: 64,
      }}
    >
      <Text style={{ fontSize: 14, letterSpacing: 1, color: "#666" }}>
        {month}
      </Text>
      <Text style={{ fontSize: 28, fontWeight: "600", color: "#444" }}>
        {day}
      </Text>
    </View>
  )
}
