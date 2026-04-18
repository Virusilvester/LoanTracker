import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  HelperText,
  Switch,
  Text,
} from "react-native-paper";
import { addTransaction } from "../database/database";
import {
  requestNotificationPermissions,
  schedulePaymentReminder,
} from "../services/notifications";
import { formatCurrency } from "../utils/helpers";

const AddTransactionScreen = ({ route, navigation }) => {
  const { customerId, customerName } = route.params || {};
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const parsedAmount = parseFloat(amount);
  const amountPreview =
    !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? formatCurrency(parsedAmount)
      : null;

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!customerId) newErrors.customerId = "Customer is required";
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
      const transactionId = await addTransaction(
        customerId,
        itemName,
        parseFloat(amount),
        parseInt(quantity) || 1,
        notes,
      );

      // Schedule reminder if enabled
      if (reminderEnabled) {
        await schedulePaymentReminder(
          transactionId,
          customerName || "Customer",
          formatCurrency(parseFloat(amount) || 0),
          parseInt(reminderDays) || 7,
        );
      }

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
        <Appbar.Content
          title="New Loan"
          subtitle={customerName ? `For ${customerName}` : undefined}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <HelperText type="error" visible={!!errors.customerId}>
          {errors.customerId}
        </HelperText>
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
        <HelperText type="info" visible={!!amountPreview}>
          Recorded amount: {amountPreview}
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

        {/* Reminder Section */}
        <View style={styles.reminderSection}>
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderTitle}>Payment Reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              color="#6366F1"
            />
          </View>

          {reminderEnabled && (
            <TextInput
              label="Remind me in (days)"
              value={reminderDays}
              onChangeText={setReminderDays}
              mode="outlined"
              style={styles.reminderInput}
              keyboardType="number-pad"
            />
          )}
        </View>

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
  reminderSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  reminderInput: {
    marginTop: 12,
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
