import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  HelperText,
  Switch,
  Text,
  useTheme,
  Surface,
  Chip,
  Divider,
} from "react-native-paper";
import { addTransaction } from "../database/database";
import {
  requestNotificationPermissions,
  schedulePaymentReminder,
} from "../services/notifications";
import { formatCurrency, formatDate } from "../utils/helpers";
import { PreferencesContext } from "../contexts/PreferencesContext";

const QUICK_DUE_OPTIONS = [
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
];

const AddTransactionScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { customerId, customerName } = route.params || {};
  const { defaultDueDays, currencyCode } = useContext(PreferencesContext);
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [dueDays, setDueDays] = useState(String(defaultDueDays || 30));
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // Interest rate feature
  const [interestEnabled, setInterestEnabled] = useState(false);
  const [interestRate, setInterestRate] = useState("");
  const [interestType, setInterestType] = useState("flat"); // 'flat' | 'monthly'

  const parsedAmount = parseFloat(amount);
  const parsedQty = parseInt(quantity) || 1;
  const baseAmount =
    !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? parsedAmount * parsedQty
      : 0;

  const computedInterest = (() => {
    if (!interestEnabled || !interestRate || !baseAmount) return 0;
    const rate = parseFloat(interestRate);
    if (Number.isNaN(rate) || rate <= 0) return 0;
    const parsedDueDays = parseInt(dueDays, 10);
    if (
      interestType === "monthly" &&
      !Number.isNaN(parsedDueDays) &&
      parsedDueDays > 0
    ) {
      const months = parsedDueDays / 30;
      return baseAmount * (rate / 100) * months;
    }
    return baseAmount * (rate / 100);
  })();

  const totalAmount = baseAmount + computedInterest;

  const amountPreview =
    baseAmount > 0 ? formatCurrency(totalAmount, currencyCode) : null;

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
    if (interestEnabled && interestRate) {
      const rate = parseFloat(interestRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.interestRate = "Enter a valid rate between 0–100%";
      }
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
        totalAmount,
        parsedQty,
        notes,
        dueDateIso,
      );

      if (reminderEnabled) {
        await schedulePaymentReminder(
          transactionId,
          customerName || "Customer",
          formatCurrency(totalAmount, currencyCode),
          parseInt(reminderDays) || 7,
        );
      }

      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save loan. Please try again.");
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

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <HelperText type="error" visible={!!errors.customerId}>
          {errors.customerId}
        </HelperText>

        <TextInput
          label="Item / Description *"
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
          numberOfLines={2}
          placeholder="Condition of item, agreement details, etc."
        />

        {/* Interest Rate Section */}
        <Surface
          style={[styles.section, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Interest / Markup
            </Text>
            <Switch
              value={interestEnabled}
              onValueChange={setInterestEnabled}
              color={theme.colors.secondary}
            />
          </View>
          {interestEnabled && (
            <>
              <View style={styles.row}>
                <TextInput
                  label="Rate (%)"
                  value={interestRate}
                  onChangeText={setInterestRate}
                  mode="outlined"
                  style={[styles.input, styles.flex1]}
                  keyboardType="decimal-pad"
                  error={!!errors.interestRate}
                  placeholder="e.g., 5"
                />
                <View style={styles.interestTypeContainer}>
                  <Chip
                    selected={interestType === "flat"}
                    onPress={() => setInterestType("flat")}
                    style={styles.interestChip}
                    compact
                  >
                    Flat
                  </Chip>
                  <Chip
                    selected={interestType === "monthly"}
                    onPress={() => setInterestType("monthly")}
                    style={styles.interestChip}
                    compact
                  >
                    Monthly
                  </Chip>
                </View>
              </View>
              <HelperText type="error" visible={!!errors.interestRate}>
                {errors.interestRate}
              </HelperText>
              {computedInterest > 0 && (
                <Surface style={styles.interestSummary}>
                  <View style={styles.interestRow}>
                    <Text
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 13,
                      }}
                    >
                      Principal
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: theme.colors.onSurface }}
                    >
                      {formatCurrency(baseAmount, currencyCode)}
                    </Text>
                  </View>
                  <View style={styles.interestRow}>
                    <Text
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 13,
                      }}
                    >
                      Interest
                    </Text>
                    <Text style={{ fontSize: 13, color: "#F59E0B" }}>
                      +{formatCurrency(computedInterest, currencyCode)}
                    </Text>
                  </View>
                  <Divider style={{ marginVertical: 6 }} />
                  <View style={styles.interestRow}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: theme.colors.onSurface,
                      }}
                    >
                      Total
                    </Text>
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: theme.colors.secondary,
                      }}
                    >
                      {formatCurrency(totalAmount, currencyCode)}
                    </Text>
                  </View>
                </Surface>
              )}
            </>
          )}
          {amountPreview && !interestEnabled && (
            <HelperText type="info" visible>
              Loan amount: {amountPreview}
            </HelperText>
          )}
        </Surface>

        {/* Due Date Section */}
        <Surface
          style={[styles.section, { backgroundColor: theme.colors.surface }]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Due Date
          </Text>
          <View style={styles.quickDueRow}>
            {QUICK_DUE_OPTIONS.map((opt) => (
              <Chip
                key={opt.days}
                selected={dueDays === String(opt.days)}
                onPress={() => setDueDays(String(opt.days))}
                style={styles.dueChip}
                compact
              >
                {opt.label}
              </Chip>
            ))}
          </View>
          <TextInput
            label="Or enter custom days"
            value={dueDays}
            onChangeText={setDueDays}
            mode="outlined"
            style={[styles.input, { marginTop: 10 }]}
            keyboardType="number-pad"
            error={!!errors.dueDays}
          />
          <HelperText type="error" visible={!!errors.dueDays}>
            {errors.dueDays}
          </HelperText>
          <HelperText type="info" visible={!!dueDateIso && !errors.dueDays}>
            Due date: {dueDateIso ? formatDate(dueDateIso) : ""}
          </HelperText>
        </Surface>

        {/* Reminder Section */}
        <Surface
          style={[styles.section, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
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
              style={[styles.input, { marginTop: 12 }]}
              keyboardType="number-pad"
            />
          )}
        </Surface>

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
  container: { flex: 1 },
  content: { padding: 16 },
  row: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  quantityInput: { width: 80 },
  input: { marginBottom: 4 },
  section: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  quickDueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  dueChip: { marginBottom: 4 },
  interestTypeContainer: {
    gap: 6,
    justifyContent: "center",
    paddingTop: 6,
  },
  interestChip: {},
  interestSummary: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  interestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 8,
  },
  buttonContent: { paddingVertical: 8 },
});

export default AddTransactionScreen;
