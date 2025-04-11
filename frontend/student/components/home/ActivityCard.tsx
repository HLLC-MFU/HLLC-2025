import { Activity } from "@/types/activities";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";

type HomeActivityCardProps = {
  activity: Activity;
  lang: "th" | "en";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  onImageLoaded?: () => void;
};

export default function HomeActivityCard({
  activity,
  lang,
  onPress,
  style,
  onImageLoaded,
}: HomeActivityCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const title = activity.name?.[lang] || activity.name?.["en"];
  const imageUrl = activity.banner;
  const categories = activity.type ? [activity.type] : [];

  const handleImageLoaded = () => {
    setImageLoaded(true);
    onImageLoaded?.();
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={StyleSheet.absoluteFillObject}>
        {!imageLoaded && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        )}
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onLoadEnd={handleImageLoaded}
        />
      </View>

      <View style={styles.overlay}>
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.titleContainer}
        >
          <Text style={styles.title}>{title}</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  categoryTag: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  titleContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: "flex-end",
    height: "35%",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
