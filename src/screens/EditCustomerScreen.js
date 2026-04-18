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
  useTheme,
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
      await updateCustomer(customer.id, name, phone, email, photo);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      "This will delete the customer and all their transactions. Continue?",
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
              console.error(error);
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Customer" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.photoSection}>
          {photo ? (
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Remove Photo", "Remove the current photo?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => setPhoto(null),
                  },
                ])
              }
            >
              <Image source={{ uri: photo }} style={styles.photo} />
            </TouchableOpacity>
          ) : (
            <Avatar.Text
              size={100}
              label={getInitials(name.trim() || "?")}
              style={styles.avatarPlaceholder}
            />
          )}

          <View style={styles.photoButtons}>
            <Button
              mode="outlined"
              onPress={handleTakePhoto}
              style={styles.photoButton}
              icon="camera"
              disabled={loading}
            >
              Camera
            </Button>
            <Button
              mode="outlined"
              onPress={handlePickImage}
              style={styles.photoButton}
              icon="image"
              disabled={loading}
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
          disabled={loading}
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
          disabled={loading}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colors.secondary },
          ]}
          contentStyle={styles.buttonContent}
        >
          Save Changes
        </Button>

        <Button
          mode="outlined"
          onPress={handleDelete}
          disabled={loading}
          style={styles.deleteButton}
          textColor="#EF4444"
        >
          Delete Customer
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 8,
  },
  deleteButton: {
    marginTop: 12,
    borderRadius: 8,
    borderColor: "#EF4444",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default EditCustomerScreen;
