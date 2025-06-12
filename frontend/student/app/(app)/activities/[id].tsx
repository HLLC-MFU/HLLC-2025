

import { router, useLocalSearchParams } from "expo-router"
import { useActivityStore } from "@/stores/activityStore"
import { Linking, Text, TouchableOpacity, View } from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { DateBadge } from "./_components/date-badge"
import { WebView } from 'react-native-webview'
import { Button, Separator } from "tamagui"
import { ArrowLeft, Compass } from "@tamagui/lucide-icons"


export default function ActivityDetailPage() {
  const { id } = useLocalSearchParams()
  const activity = useActivityStore((s) => s.selectedActivity)

  if (!activity) {
    return <Text>No activity data found.</Text>
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ position: "relative", width: "100%", aspectRatio: 4 / 3 }}>

        <View style={{ position: 'relative', width: '100%', aspectRatio: 4 / 3 }}>
          {/* Banner Image */}
          <Image
            source={
              activity.photo.banner
                ? { uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${activity.photo.banner}` }
                : null
            }
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 60, // or use SafeAreaInsets for dynamic padding
              left: 16,
              backgroundColor: 'rgba(255,255,255,0.7)',
              padding: 8,
              borderRadius: 999,
            }}
          >
            <ArrowLeft color="#333" size={20} />
          </TouchableOpacity>
        </View>
        <LinearGradient
          colors={["transparent", "rgb(255, 255, 255)255, rgba(255, 255, 255, 0.8)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.8, 1]}
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
          }}
        />
      </View>
      <View>

      </View>
      <View style={{ padding: 16, gap: 16 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View>
            <Text style={{
              textTransform
                : 'uppercase', fontSize: 16, fontWeight: 'thin', color: '#555'
            }}>Activity</Text>
            <Text style={{ textTransform: 'uppercase', fontSize: 24, fontWeight: 'bold', color: '#777' }}>{activity.name.en}</Text>
            <Text style={{
              textTransform
                : 'uppercase', fontSize: 16, fontWeight: 'thin', color: '#555'
            }}>Start At{' '}
              {new Date(activity.metadata.startAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}</Text>
            <Text style={{
              textTransform
                : 'uppercase', fontSize: 16, fontWeight: 'thin', color: '#555'
            }}>{activity.location.en}</Text>
            <Text style={{
              textTransform
                : 'uppercase', fontSize: 12, fontWeight: 'thin', color: '#555'
            }}>{activity.checkinMessage}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, color: '#777', marginTop: 4 }}><DateBadge date={activity.metadata.startAt} /></Text>
          </View>
        </View>
        <Separator />

        <View>
          <Text style={{ fontSize: 16, color: '#555', textAlign: 'justify', }}>{"     "}{activity.fullDetails.en}</Text>
        </View>
        <Separator />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <Button
            onPress={() =>
              Linking.openURL('https://maps.app.goo.gl/CWfVTpiP9Xu9BZx4A')
            }
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
          ><Compass /> Get Direction</Button>
        </View>

      </View>

    </View>
  )
}
