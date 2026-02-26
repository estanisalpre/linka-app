import { Platform } from "react-native";

/**
 * Appends a file to a FormData object in a cross-platform way.
 *
 * On native (iOS/Android), React Native's XHR understands the
 * `{ uri, type, name }` object pattern and reads the file from disk.
 *
 * On web (Expo Web), that pattern produces a plain JS object, not real
 * binary data. We must fetch() the blob URL to get an actual Blob first.
 */
export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  mimeType: string,
  filename: string,
): Promise<void> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, filename);
  } else {
    (formData as any).append(fieldName, {
      uri,
      type: mimeType,
      name: filename,
    });
  }
}
