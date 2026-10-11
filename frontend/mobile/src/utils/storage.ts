import AsyncStorage from "@react-native-async-storage/async-storage";

const memoryStorage = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn("AsyncStorage unavailable, using in-memory fallback:", error);
    return memoryStorage.get(key) ?? null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
    memoryStorage.set(key, value);
  } catch (error) {
    console.warn("AsyncStorage unavailable, using in-memory fallback:", error);
    memoryStorage.set(key, value);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    memoryStorage.delete(key);
  } catch (error) {
    console.warn("AsyncStorage unavailable, using in-memory fallback:", error);
    memoryStorage.delete(key);
  }
}

const storage = {
  getItem,
  setItem,
  removeItem,
};

export default storage;
