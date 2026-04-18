import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import {
  Appbar,
  FAB,
  Text,
  Avatar,
  Surface,
  ActivityIndicator,
  SegmentedButtons,
  Searchbar,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import TransactionItem from "../components/TransactionItem";
import {
  getCustomerById,
  getTransactions,
  markAsPaid,
  deleteTransaction,
} from "../database/database";
import { cancelReminder, cancelOverdueReminder } from "../services/notifications";
import { formatCurrency, getInitials } from "../utils/helpers";

const CustomerDetailScreen = ({ route, navigation }) => {
  const initialCustomer = route.params?.customer || null;
  const customerId = route.params?.customerId || initialCustomer?.id;

  const [customer, setCustomer] = useState(initialCustomer);
  const [transactions, setTransactions] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(!initialCustomer);
  const [transactionFilter, setTransactionFilter] = useState("unpaid");
  const [transactionSearch, setTransactionSearch] = useState("");

  const loadCustomer = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoadingCustomer(true);
      const data = await getCustomerById(customerId);
      if (data) setCustomer(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCustomer(false);
    }
  }, [customerId]);

  const loadTransactions = useCallback(async () => {
    if (!customerId) return;
    const data = await getTransactions(customerId);
    setTransactions(data);
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      loadCustomer();
      loadTransactions();
    }, [loadCustomer, loadTransactions]),
  );

  const handleMarkPaid = (transactionId) => {
    Alert.alert("Mark as Paid", "Confirm this loan has been fully paid?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Paid",
        style: "default",
        onPress: async () => {
          try {
            await cancelReminder(transactionId);
            await cancelOverdueReminder(transactionId);
            await markAsPaid(transactionId);
            loadTransactions();
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not update status");
          }
        },
      },
    ]);
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
            await cancelReminder(transactionId);
            await cancelOverdueReminder(transactionId);
            await deleteTransaction(transactionId);
            loadTransactions();
          },
        },
      ],
    );
  };

  const totalOwed = transactions
    .filter((t) => t.status === "unpaid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredTransactions = transactions
    .filter((t) => {
      if (transactionFilter === "all") return true;
      return t.status === transactionFilter;
    })
    .filter((t) => {
      const query = transactionSearch.trim().toLowerCase();
      if (!query) return true;
      return (t.item_name || "").toLowerCase().includes(query);
    });

  const emptyTitle =
    transactions.length === 0 ? "No transactions yet" : "No matching loans";
  const emptySubtitle =
    transactions.length === 0
      ? "Tap + to add a new loan"
      : "Try a different filter or search term.";

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={customer?.name || "Customer"} />
        <Appbar.Action
          icon="pencil"
          disabled={!customer}
          onPress={() => navigation.navigate("EditCustomer", { customer })}
        />
      </Appbar.Header>

      {loadingCustomer && !customer ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      <Surface style={styles.profileCard}>
        {customer?.photo ? (
          <Avatar.Image
            size={80}
            source={{ uri: customer.photo }}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={80}
            label={getInitials(customer?.name || "?")}
            style={styles.avatar}
          />
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{customer?.name || "Customer"}</Text>
          <Text style={styles.phone}>
            {customer?.phone || "No phone number"}
          </Text>
          {customer?.email ? (
            <Text style={styles.email}>{customer.email}</Text>
          ) : null}
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
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onMarkPaid={handleMarkPaid}
            onDelete={handleDelete}
            showCustomerName={false}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SegmentedButtons
              value={transactionFilter}
              onValueChange={setTransactionFilter}
              buttons={[
                { value: "unpaid", label: "Unpaid", icon: "clock-outline" },
                { value: "paid", label: "Paid", icon: "check-circle-outline" },
                { value: "all", label: "All", icon: "format-list-bulleted" },
              ]}
            />
            <Searchbar
              placeholder="Search item..."
              onChangeText={setTransactionSearch}
              value={transactionSearch}
              style={styles.searchBar}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyTitle}</Text>
            <Text style={styles.emptySubtext}>{emptySubtitle}</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Loan"
        onPress={() =>
          navigation.navigate("AddTransaction", {
            customerId,
            customerName: customer?.name,
          })
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
  email: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
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
  listHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 2,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6366F1",
  },
  loadingState: {
    padding: 16,
    alignItems: "center",
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
