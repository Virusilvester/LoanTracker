import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Appbar, FAB, Text, Avatar, Surface } from "react-native-paper";
import TransactionItem from "../components/TransactionItem";
import {
  getTransactions,
  markAsPaid,
  deleteTransaction,
  addTransaction,
} from "../database/database";
import { formatCurrency, getInitials } from "../utils/helpers";

const CustomerDetailScreen = ({ route, navigation }) => {
  const { customer } = route.params;
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await getTransactions(customer.id);
    setTransactions(data);
  };

  const handleMarkPaid = async (transactionId) => {
    try {
      await markAsPaid(transactionId);
      loadTransactions();
    } catch (error) {
      Alert.alert("Error", "Could not update status");
    }
  };

  const handleDelete = (transactionId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(transactionId);
            loadTransactions();
          },
        },
      ],
    );
  };

  const totalOwed = transactions
    .filter((t) => t.status === "unpaid")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={customer.name} />
      </Appbar.Header>

      <Surface style={styles.profileCard}>
        <Avatar.Text
          size={80}
          label={getInitials(customer.name)}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>
            {customer.phone || "No phone number"}
          </Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Current Balance:</Text>
            <Text
              style={[
                styles.balance,
                { color: totalOwed > 0 ? "#EF4444" : "#10B981" },
              ]}
            >
              {formatCurrency(totalOwed)}
            </Text>
          </View>
        </View>
      </Surface>

      <Text style={styles.sectionTitle}>Transaction History</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onMarkPaid={handleMarkPaid}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a new loan</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Loan"
        onPress={() =>
          navigation.navigate("AddTransaction", { customerId: customer.id })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  profileCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  avatar: {
    backgroundColor: "#6366F1",
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  phone: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  balanceContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 8,
  },
  balance: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6366F1",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#D1D5DB",
    marginTop: 8,
  },
});

export default CustomerDetailScreen;
