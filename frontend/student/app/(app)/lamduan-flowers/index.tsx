import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ข้อมูลตัวอย่าง
const lamduanData = [
  {
    id: '1',
    name: { first: 'ทีม', last: 'A' },
    stepCount: 1200,
    isTeam: false,
  },
  {
    id: '2',
    name: { first: 'บุคคล', last: 'B' },
    stepCount: 850,
    isTeam: false,
  },
];

export default function LamduanFlowersPage() {
  const getFullName = (name: { first: string; last: string }) =>
    `${name.first} ${name.last}`;

  return (
    <FlatList
      data={lamduanData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ ...styles.listContainer, paddingBottom: width * 0.08 }}
      renderItem={({ item }) => (
        <View
          style={[
            styles.cardItem,
            item.isTeam && {
              backgroundColor: 'rgba(255,255,255,0.13)',
              borderWidth: 2,
              borderColor: '#FFD700',
            },
          ]}
        >
          <View style={styles.cardRankCircle}>
            <Text style={styles.cardRankText}>🌼</Text>
          </View>

          <View style={styles.cardAvatar} />

          <View>
            <Text
              style={[
                styles.cardName,
                item.isTeam && { fontWeight: 'bold' },
              ]}
            >
              {item.isTeam
                ? item.name.first + ' ' + item.name.last
                : getFullName(item.name)}
            </Text>

            <Text style={styles.cardSteps}>{item.stepCount} steps</Text>
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardRankCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD70033',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  cardName: {
    fontSize: 16,
    color: '#fff',
  },
  cardSteps: {
    fontSize: 14,
    color: '#aaa',
  },
});
