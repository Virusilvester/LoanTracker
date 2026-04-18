import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { IconButton, Surface, useTheme } from "react-native-paper";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/helpers";

const TransactionItem = ({
  transaction,
  onMarkPaid,
  onAddPayment,
  onDelete,
  onPress,
  showCustomerName = true,
}) => {
  const theme = useTheme();
  const secondaryText = theme.colors.onSurfaceVariant || "#6B7280";

  const totalAmount = Number(transaction.amount) || 0;
  const paidAmount = Number(transaction.paid_amount) || 0;
  const balance =
    transaction.balance === null || transaction.balance === undefined
      ? Math.max(totalAmount - paidAmount, 0)
      : Number(transaction.balance) || 0;
  const isSettled = balance <= 0 || transaction.status === "paid";
  const displayAmount = isSettled ? totalAmount : balance;

  const content = (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.header}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
            {transaction.item_name}
          </Text>
          {showCustomerName ? (
            <Text style={[styles.customerName, { color: secondaryText }]}>
              {transaction.customer_name}
            </Text>
          ) : null}
        </View>
        <Text
          style={[styles.amount, { color: isSettled ? "#10B981" : "#EF4444" }]}
        >
          {formatCurrency(displayAmount)}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={[styles.meta, { color: secondaryText }]}>
          Borrowed: {formatDate(transaction.date_borrowed)}
          {transaction.quantity > 1 ? ` • Qty: ${transaction.quantity}` : ""}
        </Text>
        {transaction.due_date ? (
          <Text style={[styles.meta, { color: secondaryText }]}>
            Due: {formatDate(transaction.due_date)}
          </Text>
        ) : null}
        {paidAmount > 0 ? (
          <Text style={[styles.meta, { color: secondaryText }]}>
            Paid: {formatCurrency(paidAmount)}
            {balance > 0 ? ` • Balance: ${formatCurrency(balance)}` : ""}
          </Text>
        ) : null}
        {transaction.status === "paid" && transaction.date_paid ? (
          <Text style={[styles.meta, { color: secondaryText }]}>
            Paid on: {formatDate(transaction.date_paid)}
          </Text>
        ) : null}
        {transaction.notes ? (
          <Text style={[styles.notes, { color: secondaryText }]}>
            📝 {transaction.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <StatusBadge
          status={transaction.status}
          dateBorrowed={transaction.date_borrowed}
          dueDate={transaction.due_date}
        />

        <View style={styles.actions}>
          {balance > 0 && typeof onAddPayment === "function" ? (
            <IconButton
              icon="cash-plus"
              iconColor={theme.colors.secondary}
              size={22}
              onPress={() => onAddPayment(transaction)}
            />
          ) : null}
          {balance > 0 && typeof onMarkPaid === "function" ? (
            <IconButton
              icon="check-circle"
              iconColor="#10B981"
              size={24}
              onPress={() => onMarkPaid(transaction.id)}
            />
          ) : null}
          <IconButton
            icon="delete"
            iconColor="#EF4444"
            size={24}
            onPress={() => onDelete(transaction.id)}
          />
        </View>
      </View>
    </Surface>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 14,
    marginTop: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A5F",
  },
  details: {
    marginBottom: 12,
  },
  meta: {
    fontSize: 13,
  },
  notes: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
  },
});

export default TransactionItem;
