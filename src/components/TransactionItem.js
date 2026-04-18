import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { IconButton, Surface } from "react-native-paper";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/helpers";

const TransactionItem = ({
  transaction,
  onMarkPaid,
  onDelete,
  onPress,
  showCustomerName = true,
}) => {
  const content = (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{transaction.item_name}</Text>
          {showCustomerName ? (
            <Text style={styles.customerName}>{transaction.customer_name}</Text>
          ) : null}
        </View>
        <Text style={styles.amount}>{formatCurrency(transaction.amount)}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.meta}>
          Borrowed: {formatDate(transaction.date_borrowed)}
          {transaction.quantity > 1 ? ` • Qty: ${transaction.quantity}` : ""}
        </Text>
        {transaction.status === "paid" && transaction.date_paid ? (
          <Text style={styles.meta}>Paid: {formatDate(transaction.date_paid)}</Text>
        ) : null}
        {transaction.notes ? (
          <Text style={styles.notes}>📝 {transaction.notes}</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <StatusBadge
          status={transaction.status}
          dateBorrowed={transaction.date_borrowed}
        />

        <View style={styles.actions}>
          {transaction.status === "unpaid" && (
            <IconButton
              icon="check-circle"
              iconColor="#10B981"
              size={24}
              onPress={() => onMarkPaid(transaction.id)}
            />
          )}
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
    backgroundColor: "#fff",
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
    color: "#1F2937",
  },
  customerName: {
    fontSize: 14,
    color: "#6B7280",
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
    color: "#6B7280",
  },
  notes: {
    fontSize: 13,
    color: "#6B7280",
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
