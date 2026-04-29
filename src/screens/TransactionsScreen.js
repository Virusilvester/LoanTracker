import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Appbar,
  Searchbar,
  Surface,
  Text,
  SegmentedButtons,
  useTheme,
  FAB,
  Menu,
  Divider,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import TransactionItem from "../components/TransactionItem";
import {
  deleteTransaction,
  getTransactions,
  markAsPaid,
} from "../database/database";
import {
  cancelOverdueReminder,
  cancelReminder,
} from "../services/notifications";
import { formatCurrency, getDaysOverdueWithDueDate } from "../utils/helpers";
import { PreferencesContext } from "../contexts/PreferencesContext";

const TransactionsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { currencyCode } = useContext(PreferencesContext);
  const secondaryText = theme.colors.onSurfaceVariant || "#6B7280";
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("unpaid");
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("recent"); // 'recent' | 'amount' | 'duedate'
  const [menuVisible, setMenuVisible] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      Alert.alert("Error", "Could not load transactions");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const totals = useMemo(() => {
    const unpaid = transactions.filter((t) => (Number(t.balance) || 0) > 0);
    const paid = transactions.filter((t) => (Number(t.balance) || 0) <= 0);
    const unpaidTotal = unpaid.reduce(
      (sum, t) => sum + (Number(t.balance) || 0),
      0,
    );
    const paidTotal = paid.reduce(
      (sum, t) => sum + (Number(t.paid_amount) || 0),
      0,
    );
    const overdueCount = unpaid.filter(
      (t) => getDaysOverdueWithDueDate(t.date_borrowed, t.due_date) > 0,
    ).length;

    return {
      unpaidCount: unpaid.length,
      unpaidTotal,
      overdueCount,
      paidCount: paid.length,
      paidTotal,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const byFilter = transactions.filter((t) => {
      if (filter === "all") return true;
      if (filter === "paid") return (Number(t.balance) || 0) <= 0;
      if (filter === "overdue") {
        return (
          (Number(t.balance) || 0) > 0 &&
          getDaysOverdueWithDueDate(t.date_borrowed, t.due_date) > 0
        );
      }
      return (Number(t.balance) || 0) > 0;
    });

    const searched = query
      ? byFilter.filter((t) => {
          const item = (t.item_name || "").toLowerCase();
          const customer = (t.customer_name || "").toLowerCase();
          return item.includes(query) || customer.includes(query);
        })
      : byFilter;

    return [...searched].sort((a, b) => {
      if (sortBy === "amount")
        return (Number(b.balance) || 0) - (Number(a.balance) || 0);
      if (sortBy === "duedate") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return (b.id || 0) - (a.id || 0); // 'recent'
    });
  }, [filter, searchQuery, transactions, sortBy]);

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
            try {
              await cancelReminder(transactionId);
              await cancelOverdueReminder(transactionId);
              await deleteTransaction(transactionId);
              loadTransactions();
            } catch (error) {
              Alert.alert("Error", "Could not delete transaction");
            }
          },
        },
      ],
    );
  };

  const sortLabel = {
    recent: "Recent",
    amount: "Amount ↓",
    duedate: "Due Date",
  }[sortBy];
  const cycleSortBy = () => {
    const opts = ["recent", "amount", "duedate"];
    setSortBy(opts[(opts.indexOf(sortBy) + 1) % opts.length]);
    setMenuVisible(false);
  };

  const emptyMessage =
    filter === "paid"
      ? "No paid transactions yet"
      : filter === "overdue"
        ? "No overdue transactions — great!"
        : filter === "all"
          ? "No transactions yet"
          : "No owing transactions";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="All Transactions" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="sort" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item
            title="Sort: Recent"
            leadingIcon={sortBy === "recent" ? "check" : "clock-outline"}
            onPress={() => {
              setSortBy("recent");
              setMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Sort: Amount ↓"
            leadingIcon={
              sortBy === "amount" ? "check" : "sort-numeric-descending"
            }
            onPress={() => {
              setSortBy("amount");
              setMenuVisible(false);
            }}
          />
          <Menu.Item
            title="Sort: Due Date"
            leadingIcon={sortBy === "duedate" ? "check" : "calendar"}
            onPress={() => {
              setSortBy("duedate");
              setMenuVisible(false);
            }}
          />
        </Menu>
      </Appbar.Header>

      {/* Summary Stats */}
      <Surface
        style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {formatCurrency(totals.unpaidTotal, currencyCode)}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Outstanding
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {formatCurrency(totals.paidTotal, currencyCode)}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Collected
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.statBox}>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    totals.overdueCount > 0
                      ? "#F59E0B"
                      : theme.colors.onSurface,
                },
              ]}
            >
              {totals.overdueCount}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Overdue
            </Text>
          </View>
        </View>
        <Text style={[styles.summaryMeta, { color: secondaryText }]}>
          {totals.unpaidCount} owing • {totals.paidCount} paid •{" "}
          {transactions.length} total
        </Text>
      </Surface>

      <View style={styles.controls}>
        <Searchbar
          placeholder="Search item or customer..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 14 }}
        />

        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          style={styles.segment}
          buttons={[
            { value: "unpaid", label: "Owing", icon: "clock-outline" },
            {
              value: "overdue",
              label: "Overdue",
              icon: "alert-circle-outline",
            },
            { value: "paid", label: "Paid", icon: "check-circle-outline" },
            { value: "all", label: "All", icon: "format-list-bulleted" },
          ]}
        />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onMarkPaid={handleMarkPaid}
            onAddPayment={(tx) =>
              navigation.navigate("AddPayment", { transactionId: tx.id })
            }
            onDelete={handleDelete}
            showCustomerName
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
            <Text style={styles.emptySubtext}>
              Add a loan from a customer's profile.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 0.5, height: 36, marginHorizontal: 8 },
  summaryMeta: { fontSize: 12, textAlign: "center" },
  controls: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  searchBar: { borderRadius: 12, elevation: 2 },
  segment: { alignSelf: "center" },
  list: { paddingBottom: 24 },
  emptyState: { alignItems: "center", marginTop: 40, paddingHorizontal: 24 },
  emptyText: {
    fontSize: 18,
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#D1D5DB",
    marginTop: 8,
    textAlign: "center",
  },
});

export default TransactionsScreen;
