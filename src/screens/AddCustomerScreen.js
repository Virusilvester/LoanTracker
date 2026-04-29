import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  HelperText,
  Avatar,
  useTheme,
  Text,
} from "react-native-paper";
import { addCustomer } from "../database/database";
import { pickImage, takePhoto } from "../utils/photos";
import { getInitials } from "../utils/helpers";

const AddCustomerScreen = ({ navigation }) => {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (phone && phone.replace(/\D/g, "").length < 9)
      newErrors.phone = "Invalid phone number";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    const uri = await pickImage();
    if (uri) setPhoto(uri);
  };

  const handleTakePhoto = async () => {
    const uri = await takePhoto();
    if (uri) setPhoto(uri);
  };

  const handlePhotoPress = () => {
    if (photo) {
      Alert.alert("Change Photo", "What would you like to do?", [
        {
          text: "Remove Photo",
          style: "destructive",
          onPress: () => setPhoto(null),
        },
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Gallery", onPress: handlePickImage },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert("Add Photo", "Choose a source:", [
        { text: "Camera", onPress: handleTakePhoto },
        { text: "Gallery", onPress: handlePickImage },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await addCustomer(name.trim(), phone.trim(), email.trim(), photo);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Customer" />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            onPress={handlePhotoPress}
            style={styles.photoTouchable}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <Avatar.Text
                size={100}
                label={getInitials(name.trim() || "?")}
                style={{ backgroundColor: theme.colors.secondary }}
              />
            )}
            <View
              style={[
                styles.photoEditBadge,
                { backgroundColor: theme.colors.secondary },
              ]}
            >
              <Text style={styles.photoEditIcon}>✎</Text>
            </View>
          </TouchableOpacity>
          <Text
            style={[styles.photoHint, { color: theme.colors.onSurfaceVariant }]}
          >
            Tap to {photo ? "change" : "add"} photo
          </Text>
        </View>

        <TextInput
          label="Full Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <HelperText type="error" visible={!!errors.name}>
          {errors.name}
        </HelperText>

        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          error={!!errors.phone}
          returnKeyType="next"
        />
        <HelperText type="error" visible={!!errors.phone}>
          {errors.phone}
        </HelperText>

        <TextInput
          label="Email (Optional)"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          returnKeyType="done"
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
          contentStyle={styles.buttonContent}
        >
          Save Customer
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  photoTouchable: { position: "relative" },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  photoEditIcon: { color: "#fff", fontSize: 14 },
  photoHint: { marginTop: 8, fontSize: 12 },
  input: { marginBottom: 4 },
  button: { marginTop: 24, marginBottom: 32, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
});

export default AddCustomerScreen;
