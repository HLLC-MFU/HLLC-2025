import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Save a value in SecureStore
 * @param key - Storage key
 * @param value - String value to store
 */
export async function saveToken(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  }
  await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieve a stored value from SecureStore
 * @param key - Storage key
 * @returns Stored value or null if not found
 */
export async function getToken(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}


/**
 * Remove a stored value from SecureStore
 * @param key - Storage key
 */
export async function removeToken(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }else {
    await SecureStore.deleteItemAsync(key);
  }
}