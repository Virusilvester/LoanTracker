import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { TextInput, Button, Appbar, HelperText } from "react-native-paper";
import { addTransaction } from "../database/database";

const AddTransactionScreen = ({ route, navigation }) => {
  const { customerId } = route.params;
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!itemName.trim()) newErrors.itemName = "Item name is required";
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await addTransaction(
        customerId,
        itemName,
        parseFloat(amount),
        parseInt(quantity) || 1,
        notes,
      );
      navigation.goBack();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Loan" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <TextInput
          label="Item Name *"
          value={itemName}
          onChangeText={setItemName}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., iPhone 12, Lawn Mower"
          error={!!errors.itemName}
        />
        <HelperText type="error" visible={!!errors.itemName}>
          {errors.itemName}
        </HelperText>

        <View style={styles.row}>
          <TextInput
            label="Amount *"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            style={[styles.input, styles.flex1]}
            keyboardType="decimal-pad"
            placeholder="0.00"
            error={!!errors.amount}
          />
          <TextInput
            label="Qty"
            value={quantity}
            onChangeText={setQuantity}
            mode="outlined"
            style={[styles.input, styles.quantityInput]}
            keyboardType="number-pad"
          />
        </View>
        <HelperText type="error" visible={!!errors.amount}>
          {errors.amount}
        </HelperText>

        <TextInput
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Condition of item, due date, etc."
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Record Loan
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
  row: {
    flexDirection: "row",
  },
  flex1: {
    flex: 1,
    marginRight: 12,
  },
  quantityInput: {
    width: 80,
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

export default AddTransactionScreen;
