import ActivityCard from "@/components/activities/ActivityCard";
import { SafeAreaView } from "react-native";
import { ScrollView, Text, YStack } from "tamagui";

export default function ActivitiesPage() {
  return (
    <SafeAreaView>
      <ScrollView>
        <YStack style={{ gap: 16, padding: 16 }}>
          <ActivityCard
            activity={{
              title: "Meet the President",
              description:
                "Experience an extraordinary moment as the President arrives to meet the freshers, delivering an inspiring welcome speech filled with advice and the essence of MFU's way.",
              imageUri:
                "https://hllc.mfu.ac.th/api/uploads/a8f7e7df9272785192ea869104caa4469.jpg",
            }}
          ></ActivityCard>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
