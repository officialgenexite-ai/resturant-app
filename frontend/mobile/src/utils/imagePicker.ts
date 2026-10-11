import * as ImagePicker from "expo-image-picker";

/**
 * Opens the device gallery, lets the user pick one image, and returns it
 * as a base64 data URI string ready to send to the backend.
 * Returns null if the user cancels or permission is denied.
 */
export async function pickPaymentScreenshot(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Gallery access is required to upload your payment screenshot.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.6, // compress — screenshots don't need full resolution, keeps upload fast
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const mimeType = asset.mimeType || "image/jpeg";

  return `data:${mimeType};base64,${asset.base64}`;
}
