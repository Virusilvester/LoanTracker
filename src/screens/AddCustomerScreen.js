import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  HelperText,
  Avatar,
} from "react-native-paper";
import { addCustomer } from "../database/database";
import { pickImage, takePhoto } from "../utils/photos";

const AddCustomerScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (phone && phone.length < 10) newErrors.phone = "Invalid phone number";
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

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await addCustomer(name, phone, email, photo);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Customer" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          {photo ? (
            <TouchableOpacity onPress={() => setPhoto(null)}>
              <Image source={{ uri: photo }} style={styles.photo} />
            </TouchableOpacity>
          ) : (
            <Avatar.Text
              size={100}
              label="?"
              style={styles.avatarPlaceholder}
            />
          )}

          <View style={styles.photoButtons}>
            <Button
              mode="outlined"
              onPress={handleTakePhoto}
              style={styles.photoButton}
              icon="camera"
            >
              Camera
            </Button>
            <Button
              mode="outlined"
              onPress={handlePickImage}
              style={styles.photoButton}
              icon="image"
            >
              Gallery
            </Button>
          </View>
        </View>

        <TextInput
          label="Full Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
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
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Save Customer
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: "#E5E7EB",
  },
  photoButtons: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  photoButton: {
    marginHorizontal: 6,
  },
  input: {
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#6366F1",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default AddCustomerScreen;
