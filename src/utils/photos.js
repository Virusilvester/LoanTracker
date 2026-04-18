import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export const requestPhotoPermissions = async () => {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return false;
    }
    return true;
  }
  return true;
};

export const pickImage = async () => {
  const hasPermission = await requestPhotoPermissions();
  if (!hasPermission) return null;

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5, // Compress for older devices
    base64: false,
  });

  if (!result.canceled) {
    // Copy to app directory for persistence
    const fileName = `customer_${Date.now()}.jpg`;
    const newPath = `${FileSystem.documentDirectory}photos/${fileName}`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(
      `${FileSystem.documentDirectory}photos`,
    );
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}photos`,
        { intermediates: true },
      );
    }

    await FileSystem.copyAsync({
      from: result.assets[0].uri,
      to: newPath,
    });

    return newPath;
  }
  return null;
};

export const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    alert("Sorry, we need camera permissions to make this work!");
    return null;
  }

  let result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
  });

  if (!result.canceled) {
    const fileName = `customer_${Date.now()}.jpg`;
    const newPath = `${FileSystem.documentDirectory}photos/${fileName}`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(
      `${FileSystem.documentDirectory}photos`,
    );
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}photos`,
        { intermediates: true },
      );
    }

    await FileSystem.copyAsync({
      from: result.assets[0].uri,
      to: newPath,
    });

    return newPath;
  }
  return null;
};
