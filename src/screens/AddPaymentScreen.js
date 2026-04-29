import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Appbar,
  Surface,
  Text,
  TextInput,
  HelperText,
  Button,
  List,
  Divider,
  ActivityIndicator,
  useTheme,
  ProgressBar,
  Chip,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import {
  addPayment,
  getPayments,
  getTransactionById,
} from "../database/database";
import {
  cancelOverdueReminder,
  cancelReminder,
} from "../services/notifications";
import { formatCurrency, formatDate } from "../utils/helpers";
import { PreferencesContext } from "../contexts/PreferencesContext";

const QUICK_AMOUNTS = [0.25, 0.5, 0.75, 1]; // fractions of balance

const AddPaymentScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { currencyCode } = useContext(PreferencesContext);
  const secondaryText = theme.colors.onSurfaceVariant || "#6B7280";
  const transactionId = route.params?.transactionId;

  const [transaction, setTransaction] = useState(null);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    if (!transactionId) return;
    try {
      setLoading(true);
      const [tx, paymentData] = await Promise.all([
        getTransactionById(transactionId),
        getPayments(transactionId),
      ]);
      setTransaction(tx);
      setPayments(paymentData);
    } catch (error) {
      Alert.alert("Error", "Could not load payment data");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const totals = useMemo(() => {
    const totalAmount = Number(transaction?.amount) || 0;
    const paidAmount = Number(transaction?.paid_amount) || 0;
    const balance = Number(transaction?.balance) || 0;
    const progressRatio = totalAmount > 0 ? paidAmount / totalAmount : 0;
    return { totalAmount, paidAmount, balance, progressRatio };
  }, [transaction]);

  const validate = () => {
    const newErrors = {};
    const value = parseFloat(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      newErrors.amount = "Enter a valid payment amount";
    } else if (transaction && totals.balance > 0 && value > totals.balance) {
      newErrors.amount = `Payment exceeds balance (${formatCurrency(
        totals.balance,
        currencyCode,
      )})`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuickAmount = (fraction) => {
    if (totals.balance <= 0) return;
    const val = totals.balance * fraction;
    setAmount(String(Math.round(val * 100) / 100));
  };

  const handleSave = async () => {
    if (!transaction) return;
    if (totals.balance <= 0) {
      Alert.alert("Already Paid", "This loan has no remaining balance.");
      return;
    }
    if (!validate()) return;

    const paymentValue = parseFloat(amount);
    const isFullPayment = paymentValue >= totals.balance;

    Alert.alert(
      "Confirm Payment",
      `Record ${formatCurrency(paymentValue, currencyCode)} payment${
        isFullPayment ? " — this will fully settle the loan." : "?"
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSaving(true);
            try {
              await addPayment(transaction.id, paymentValue, note.trim());
              const updated = await getTransactionById(transaction.id);

              if ((Number(updated?.balance) || 0) <= 0) {
                await cancelReminder(transaction.id);
                await cancelOverdueReminder(transaction.id);
              }

              Alert.alert(
                "Payment Recorded",
                (Number(updated?.balance) || 0) <= 0
                  ? "Loan is now fully paid!"
                  : `Remaining balance: ${formatCurrency(
                      Number(updated?.balance) || 0,
                      currencyCode,
                    )}`,
              );
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Could not record payment");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const headerSubtitle =
    transaction?.customer_name && transaction?.item_name
      ? `${transaction.customer_name} • ${transaction.item_name}`
      : undefined;

  const isOverdue =
    transaction?.due_date && new Date(transaction.due_date) < new Date();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Record Payment" subtitle={headerSubtitle} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {!loading && !transaction ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Transaction not found</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      ) : null}

      {!loading && transaction ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Summary Card */}
          <Surface
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondaryText }]}>
                Total
              </Text>
              <Text
                style={[styles.summaryValue, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(totals.totalAmount, currencyCode)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondaryText }]}>
                Paid
              </Text>
              <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                {formatCurrency(totals.paidAmount, currencyCode)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondaryText }]}>
                Balance
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: totals.balance > 0 ? "#EF4444" : "#10B981" },
                ]}
              >
                {formatCurrency(totals.balance, currencyCode)}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={totals.progressRatio}
                color="#10B981"
                style={styles.progressBar}
              />
              <Text style={[styles.progressLabel, { color: secondaryText }]}>
                {Math.round(totals.progressRatio * 100)}% paid
              </Text>
            </View>

            {transaction.due_date ? (
              <Text
                style={[
                  styles.dueText,
                  { color: isOverdue ? "#EF4444" : secondaryText },
                ]}
              >
                {isOverdue ? "⚠ Overdue" : "Due"}:{" "}
                {formatDate(transaction.due_date)}
              </Text>
            ) : null}
          </Surface>

          {/* Payment Form */}
          <Surface
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              New Payment
            </Text>

            {/* Quick amount chips */}
            {totals.balance > 0 && (
              <View style={styles.quickRow}>
                {QUICK_AMOUNTS.map((frac) => (
                  <Chip
                    key={frac}
                    onPress={() => handleQuickAmount(frac)}
                    disabled={saving}
                    compact
                    style={styles.quickChip}
                  >
                    {frac === 1 ? "Full" : `${frac * 100}%`}
                  </Chip>
                ))}
              </View>
            )}

            <TextInput
              label="Payment Amount *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              error={!!errors.amount}
              disabled={saving || totals.balance <= 0}
              style={styles.amountInput}
            />
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount}
            </HelperText>

            <TextInput
              label="Note (Optional)"
              value={note}
              onChangeText={setNote}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.noteInput}
              disabled={saving || totals.balance <= 0}
              placeholder="e.g., Cash, Bank transfer, etc."
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={totals.balance <= 0}
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.secondary },
              ]}
              contentStyle={styles.saveButtonContent}
            >
              Record Payment
            </Button>

            {totals.balance <= 0 ? (
              <HelperText type="info" visible>
                ✓ This loan is fully paid.
              </HelperText>
            ) : null}
          </Surface>

          {/* Payment History */}
          <Surface
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Payment History ({payments.length})
            </Text>
            <Divider style={styles.divider} />
            {payments.length === 0 ? (
              <Text style={[styles.historyEmpty, { color: secondaryText }]}>
                No payments recorded yet
              </Text>
            ) : (
              payments.map((p, index) => (
                <React.Fragment key={p.id}>
                  <List.Item
                    title={formatCurrency(p.amount, currencyCode)}
                    titleStyle={{ fontWeight: "600" }}
                    description={
                      p.note
                        ? `${formatDate(p.date_paid)} • ${p.note}`
                        : formatDate(p.date_paid)
                    }
                    left={(props) => (
                      <List.Icon {...props} icon="cash" color="#10B981" />
                    )}
                  />
                  {index < payments.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </Surface>
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingState: { padding: 16, alignItems: "center" },
  emptyState: {
    flex: 1,
    padding: 24,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  progressContainer: {
    marginTop: 10,
    gap: 4,
  },
  progressBar: { height: 8, borderRadius: 4 },
  progressLabel: { fontSize: 11, textAlign: "right" },
  dueText: { marginTop: 8, fontSize: 12 },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  quickChip: {},
  amountInput: {},
  noteInput: { marginTop: 10 },
  saveButton: { marginTop: 14, borderRadius: 8 },
  saveButtonContent: { paddingVertical: 8 },
  divider: { marginVertical: 10 },
  historyEmpty: { color: "#6B7280", fontSize: 13 },
});

export default AddPaymentScreen;
