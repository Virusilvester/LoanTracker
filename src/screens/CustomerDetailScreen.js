import React, { useCallback, useContext, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Linking,
  Share,
} from "react-native";
import {
  Appbar,
  FAB,
  Text,
  Avatar,
  Surface,
  ActivityIndicator,
  SegmentedButtons,
  Searchbar,
  useTheme,
  Button,
  Chip,
  Menu,
  Divider,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import TransactionItem from "../components/TransactionItem";
import {
  getCustomerById,
  getTransactions,
  markAsPaid,
  deleteTransaction,
} from "../database/database";
import {
  cancelReminder,
  cancelOverdueReminder,
} from "../services/notifications";
import { formatCurrency, getInitials } from "../utils/helpers";
import { PreferencesContext } from "../contexts/PreferencesContext";

const CustomerDetailScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { currencyCode } = useContext(PreferencesContext);
  const secondaryText = theme.colors.onSurfaceVariant || "#6B7280";

  const initialCustomer = route.params?.customer || null;
  const customerId = route.params?.customerId || initialCustomer?.id;

  const [customer, setCustomer] = useState(initialCustomer);
  const [transactions, setTransactions] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(!initialCustomer);
  const [transactionFilter, setTransactionFilter] = useState("unpaid");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleCall = () => {
    if (!customer?.phone) return;
    Linking.openURL(`tel:${customer.phone}`).catch(() =>
      Alert.alert("Error", "Could not open phone app"),
    );
  };

  const handleWhatsApp = () => {
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/${phone}`).catch(() =>
      Alert.alert("Error", "WhatsApp is not installed"),
    );
  };

  const handleShareStatement = async () => {
    const unpaid = transactions.filter((t) => (Number(t.balance) || 0) > 0);
    if (unpaid.length === 0) {
      Alert.alert("No Owing Loans", "This customer has no outstanding loans.");
      return;
    }
    const lines = unpaid.map(
      (t) =>
        `• ${t.item_name}: ${formatCurrency(Number(t.balance) || 0, currencyCode)}`,
    );
    const totalOwed = unpaid.reduce((s, t) => s + (Number(t.balance) || 0), 0);
    const message =
      `Statement for ${customer?.name}\n\n` +
      lines.join("\n") +
      `\n\nTotal Owed: ${formatCurrency(totalOwed, currencyCode)}`;
    await Share.share({ message });
    setMenuVisible(false);
  };

  const totalOwed = transactions.reduce(
    (sum, t) => sum + (Number(t.balance) || 0),
    0,
  );

  const totalLoaned = transactions.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0,
  );

  const paidCount = transactions.filter(
    (t) => (Number(t.balance) || 0) <= 0,
  ).length;
  const overdueCount = transactions.filter(
    (t) =>
      (Number(t.balance) || 0) > 0 &&
      t.due_date &&
      new Date(t.due_date) < new Date(),
  ).length;

  const filteredTransactions = transactions
    .filter((t) => {
      if (transactionFilter === "all") return true;
      if (transactionFilter === "paid") return (Number(t.balance) || 0) <= 0;
      return (Number(t.balance) || 0) > 0;
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={customer?.name || "Customer"} />
        <Appbar.Action
          icon="pencil"
          disabled={!customer}
          onPress={() => navigation.navigate("EditCustomer", { customer })}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={handleShareStatement}
            title="Share Statement"
            leadingIcon="share-variant"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate("EditCustomer", { customer });
            }}
            title="Edit Customer"
            leadingIcon="pencil"
          />
        </Menu>
      </Appbar.Header>

      {loadingCustomer && !customer ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      <Surface
        style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.profileTop}>
          {customer?.photo ? (
            <Avatar.Image size={72} source={{ uri: customer.photo }} />
          ) : (
            <Avatar.Text
              size={72}
              label={getInitials(customer?.name || "?")}
              style={{ backgroundColor: theme.colors.secondary }}
            />
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>
              {customer?.name || "Customer"}
            </Text>
            {customer?.phone ? (
              <Text style={[styles.phone, { color: secondaryText }]}>
                {customer.phone}
              </Text>
            ) : null}
            {customer?.email ? (
              <Text style={[styles.email, { color: secondaryText }]}>
                {customer.email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionRow}>
          {customer?.phone ? (
            <>
              <Button
                mode="outlined"
                icon="phone"
                onPress={handleCall}
                style={styles.actionBtn}
                compact
              >
                Call
              </Button>
              <Button
                mode="outlined"
                icon="whatsapp"
                onPress={handleWhatsApp}
                style={[styles.actionBtn, { borderColor: "#25D366" }]}
                textColor="#25D366"
                compact
              >
                WhatsApp
              </Button>
            </>
          ) : null}
          <Button
            mode="outlined"
            icon="share-variant"
            onPress={handleShareStatement}
            style={styles.actionBtn}
            compact
          >
            Statement
          </Button>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                { color: totalOwed > 0 ? "#EF4444" : "#10B981" },
              ]}
            >
              {formatCurrency(totalOwed, currencyCode)}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Balance
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {transactions.length}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Total Loans
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#10B981" }]}>
              {paidCount}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>
              Paid
            </Text>
          </View>
          {overdueCount > 0 ? (
            <>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                  {overdueCount}
                </Text>
                <Text style={[styles.statLabel, { color: secondaryText }]}>
                  Overdue
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </Surface>

      <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        Transaction History
      </Text>

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
            showCustomerName={false}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SegmentedButtons
              value={transactionFilter}
              onValueChange={setTransactionFilter}
              buttons={[
                { value: "unpaid", label: "Owing", icon: "clock-outline" },
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
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
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
  container: { flex: 1 },
  profileCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: { fontSize: 20, fontWeight: "bold" },
  phone: { fontSize: 14, marginTop: 3 },
  email: { fontSize: 13, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  actionBtn: { flex: 1, minWidth: 90, borderRadius: 8 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontWeight: "bold" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: {
    width: 0.5,
    height: 32,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  listHeader: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  searchBar: { borderRadius: 12, elevation: 2 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
  loadingState: { padding: 16, alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 18, color: "#9CA3AF", fontWeight: "600" },
  emptySubtext: { fontSize: 14, color: "#D1D5DB", marginTop: 8 },
});

export default CustomerDetailScreen;
