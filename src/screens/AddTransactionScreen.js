import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  HelperText,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { addTransaction } from "../database/database";
import {
  requestNotificationPermissions,
  schedulePaymentReminder,
} from "../services/notifications";
import { formatCurrency, formatDate } from "../utils/helpers";
import { PreferencesContext } from "../contexts/PreferencesContext";

const AddTransactionScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { customerId, customerName } = route.params || {};
  const { defaultDueDays } = useContext(PreferencesContext);
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [dueDays, setDueDays] = useState(String(defaultDueDays || 30));
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const parsedAmount = parseFloat(amount);
  const amountPreview =
    !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? formatCurrency(parsedAmount)
      : null;

  const parsedDueDays = parseInt(dueDays, 10);
  const dueDateIso =
    !Number.isNaN(parsedDueDays) && parsedDueDays > 0
      ? new Date(Date.now() + parsedDueDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    setDueDays(String(defaultDueDays || 30));
  }, [defaultDueDays]);

  const validate = () => {
    const newErrors = {};
    if (!customerId) newErrors.customerId = "Customer is required";
    if (!itemName.trim()) newErrors.itemName = "Item name is required";
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }
    if (dueDays && (Number.isNaN(parsedDueDays) || parsedDueDays <= 0)) {
      newErrors.dueDays = "Enter a valid due period";
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
        dueDateIso,
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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

        {/* Due Date Section */}
        <View
          style={[styles.dueSection, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.dueTitle, { color: theme.colors.onSurface }]}>
            Due Date
          </Text>
          <TextInput
            label="Due in (days)"
            value={dueDays}
            onChangeText={setDueDays}
            mode="outlined"
            style={styles.dueInput}
            keyboardType="number-pad"
            error={!!errors.dueDays}
          />
          <HelperText type="error" visible={!!errors.dueDays}>
            {errors.dueDays}
          </HelperText>
          <HelperText type="info" visible={!!dueDateIso && !errors.dueDays}>
            Due date: {dueDateIso ? formatDate(dueDateIso) : ""}
          </HelperText>
        </View>

        {/* Reminder Section */}
        <View
          style={[
            styles.reminderSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.reminderHeader}>
            <Text
              style={[styles.reminderTitle, { color: theme.colors.onSurface }]}
            >
              Payment Reminder
            </Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              color={theme.colors.secondary}
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
          style={[styles.button, { backgroundColor: theme.colors.secondary }]}
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
  },
  reminderSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  dueSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  dueTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dueInput: {},
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  reminderInput: {
    marginTop: 12,
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default AddTransactionScreen;
