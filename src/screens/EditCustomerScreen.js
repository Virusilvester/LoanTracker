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
  Divider,
} from "react-native-paper";
import {
  deleteCustomer,
  getTransactions,
  updateCustomer,
} from "../database/database";
import {
  cancelOverdueReminder,
  cancelReminder,
} from "../services/notifications";
import { pickImage, takePhoto } from "../utils/photos";
import { getInitials } from "../utils/helpers";

const EditCustomerScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { customer } = route.params;
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [photo, setPhoto] = useState(customer?.photo || null);
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
    const options = photo
      ? [
          { text: "Take Photo", onPress: handleTakePhoto },
          { text: "Choose from Gallery", onPress: handlePickImage },
          {
            text: "Remove Photo",
            style: "destructive",
            onPress: () => setPhoto(null),
          },
          { text: "Cancel", style: "cancel" },
        ]
      : [
          { text: "Camera", onPress: handleTakePhoto },
          { text: "Gallery", onPress: handlePickImage },
          { text: "Cancel", style: "cancel" },
        ];
    Alert.alert(
      photo ? "Change Photo" : "Add Photo",
      "Choose a source:",
      options,
    );
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await updateCustomer(
        customer.id,
        name.trim(),
        phone.trim(),
        email.trim(),
        photo,
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Delete ${customer.name || "this customer"} and all their loan records? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const transactions = await getTransactions(customer.id);
              for (const t of transactions) {
                await cancelReminder(t.id);
                await cancelOverdueReminder(t.id);
              }
              await deleteCustomer(customer.id);
              navigation.popToTop();
            } catch (error) {
              Alert.alert("Error", "Could not delete customer");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Customer" />
      </Appbar.Header>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photoSection}>
          <TouchableOpacity
            onPress={handlePhotoPress}
            disabled={loading}
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
          disabled={loading}
          autoCapitalize="words"
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
          disabled={loading}
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
          disabled={loading}
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colors.secondary },
          ]}
          contentStyle={styles.buttonContent}
        >
          Save Changes
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="outlined"
          onPress={handleDelete}
          disabled={loading}
          style={styles.deleteButton}
          textColor="#EF4444"
          icon="delete"
        >
          Delete Customer
        </Button>
        <Text
          style={[
            styles.deleteWarning,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          This will permanently delete the customer and all associated loans.
        </Text>
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
  saveButton: { marginTop: 24, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  divider: { marginVertical: 20 },
  deleteButton: { borderRadius: 8, borderColor: "#EF4444", marginBottom: 8 },
  deleteWarning: { fontSize: 12, textAlign: "center", marginBottom: 32 },
});

export default EditCustomerScreen;
