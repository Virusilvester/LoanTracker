import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
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

const AddPaymentScreen = ({ route, navigation }) => {
  const theme = useTheme();
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
      console.error(error);
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
    return { totalAmount, paidAmount, balance };
  }, [transaction]);

  const validate = () => {
    const newErrors = {};
    const value = parseFloat(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      newErrors.amount = "Enter a valid payment amount";
    } else if (transaction && totals.balance > 0 && value > totals.balance) {
      newErrors.amount = `Payment exceeds balance (${formatCurrency(totals.balance)})`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayFullBalance = () => {
    if (!transaction) return;
    if (totals.balance <= 0) return;
    setAmount(String(totals.balance));
  };

  const handleSave = async () => {
    if (!transaction) return;
    if (totals.balance <= 0) {
      Alert.alert("Already Paid", "This loan has no remaining balance.");
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      await addPayment(transaction.id, parseFloat(amount), note.trim());
      const updated = await getTransactionById(transaction.id);

      if ((Number(updated?.balance) || 0) <= 0) {
        await cancelReminder(transaction.id);
        await cancelOverdueReminder(transaction.id);
      }

      Alert.alert(
        "Payment Recorded",
        (Number(updated?.balance) || 0) <= 0
          ? "Loan is now fully paid."
          : `Remaining balance: ${formatCurrency(Number(updated?.balance) || 0)}`,
      );
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  const headerSubtitle =
    transaction?.customer_name && transaction?.item_name
      ? `${transaction.customer_name} • ${transaction.item_name}`
      : undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        <View style={styles.content}>
          <Surface
            style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondaryText }]}>
                Total
              </Text>
              <Text
                style={[styles.summaryValue, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(totals.totalAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: secondaryText }]}>
                Paid
              </Text>
              <Text
                style={[styles.summaryValue, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(totals.paidAmount)}
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
                {formatCurrency(totals.balance)}
              </Text>
            </View>
            {transaction.due_date ? (
              <Text style={[styles.summaryMeta, { color: secondaryText }]}>
                Due: {formatDate(transaction.due_date)}
              </Text>
            ) : null}
          </Surface>

          <Surface style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              label="Payment Amount *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              error={!!errors.amount}
              disabled={saving || totals.balance <= 0}
            />
            <HelperText type="error" visible={!!errors.amount}>
              {errors.amount}
            </HelperText>

            <Button
              mode="outlined"
              onPress={handlePayFullBalance}
              disabled={saving || totals.balance <= 0}
              style={styles.payFullButton}
              icon="cash"
            >
              Pay Full Balance
            </Button>

            <TextInput
              label="Note (Optional)"
              value={note}
              onChangeText={setNote}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.noteInput}
              disabled={saving || totals.balance <= 0}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={totals.balance <= 0}
              style={[styles.saveButton, { backgroundColor: theme.colors.secondary }]}
              contentStyle={styles.saveButtonContent}
            >
              Record Payment
            </Button>

            {totals.balance <= 0 ? (
              <HelperText type="info" visible>
                This loan is already fully paid.
              </HelperText>
            ) : null}
          </Surface>

          <Surface
            style={[styles.historyCard, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.historyTitle, { color: theme.colors.onSurface }]}>
              Payment History
            </Text>
            <Divider style={styles.divider} />
            {payments.length === 0 ? (
              <Text style={[styles.historyEmpty, { color: secondaryText }]}>
                No payments recorded yet
              </Text>
            ) : (
              payments.map((p) => (
                <List.Item
                  key={p.id}
                  title={formatCurrency(p.amount)}
                  description={
                    p.note
                      ? `${formatDate(p.date_paid)} • ${p.note}`
                      : formatDate(p.date_paid)
                  }
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="cash"
                      color={theme.colors.secondary}
                    />
                  )}
                />
              ))
            )}
          </Surface>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingState: {
    padding: 16,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    padding: 24,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  summaryMeta: {
    marginTop: 8,
    fontSize: 12,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  payFullButton: {
    marginTop: 8,
  },
  noteInput: {
    marginTop: 10,
  },
  saveButton: {
    marginTop: 14,
    borderRadius: 8,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  divider: {
    marginVertical: 10,
  },
  historyEmpty: {
    color: "#6B7280",
  },
});

export default AddPaymentScreen;
