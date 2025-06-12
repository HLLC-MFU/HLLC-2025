import { apiRequest } from '@/utils/api';
import { useRouter } from 'expo-router';
import { LocateFixedIcon, LocateIcon, MapPin, Search } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Button, Card, Input, XStack } from 'tamagui';
import { Image } from 'expo-image';
import { Clock, Pin } from '@tamagui/lucide-icons';
import { BlurView } from 'expo-blur';


export default function ActivitiesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const fetchActivities = async () => {
    try {
      const response = await apiRequest('/activities/users', "GET");
      console.log('Activities fetched:', response.data.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  }

  fetchActivities();


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("activty.activities")}</Text>
      </View>
      <View style={styles.content}>
        <XStack alignItems="center" paddingHorizontal={"$3"} borderRadius="$6" backgroundColor="#ebebf0">
          <Search color={"#8e8e93"} />
          <Input flex={1} size="$4" borderWidth={0} placeholder="Search..." backgroundColor={"transparent"} />
        </XStack>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View style={{ gap: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Upcoming Activity</Text>
          <Card
            unstyled
            style={{
              aspectRatio: 4 / 3,
              overflow: 'hidden',
              borderRadius: 30,
            }}
          >
            <Card.Header>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <BlurView
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    width: 'auto',
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 24,
                    overflow: 'hidden',
                  }}
                  intensity={25}
                  tint="systemThinMaterialLight"
                >
                  <Clock color="white" size={16} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>
                    {t("19.00")}
                  </Text>
                </BlurView>
                <BlurView
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    width: 'auto',
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 24,
                    overflow: 'hidden',
                  }}
                >
                  <MapPin color="white" size={16} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>
                    {t("Indoor Sports Complex")}
                  </Text>
                </BlurView>
              </View>
            </Card.Header>

            <Card.Footer padded>
              <XStack flex={1} />
              <BlurView
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  width: 'auto',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 24,
                  overflow: 'hidden',
                }}
              >
                <MapPin color="white" size={16} />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>
                  {t("Indoor Sports Complex")}
                </Text>
              </BlurView>
            </Card.Footer>

            <Card.Background>
              <Image
                source={{
                  uri: 'https://hllc.mfu.ac.th/v0/api/uploads/d2868e2241aee435aa19e0a7f863c2a9.jpg',
                }}
                contentFit="cover"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: 30,
                }}
              />
            </Card.Background>
          </Card>

        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
});
