import * as ImagePicker from 'expo-image-picker';

/**
 * Opens the device image library and returns the picked photo as a
 * self-contained data: URI (base64), so it can be stored directly in SQLite
 * and stays valid across app/browser restarts (unlike blob:/file: URIs).
 * Returns null if the user cancels or permission is denied.
 */
export async function pickProductImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType ?? 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}
