import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import {
  FAB,
  Searchbar,
  Appbar,
  Snackbar,
  SegmentedButtons,
  Text,
  useTheme,
  Badge,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import CustomerCard from "../components/CustomerCard";
import DashboardStats from "../components/DashboardStats";
import { getCustomers, getDashboardStats } from "../database/database";

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [sortBy, setSortBy] = useState("name"); // 'name' | 'balance' | 'recent'

  const loadData = useCallback(async () => {
    try {
      const [customerData, statsData] = await Promise.all([
        getCustomers(),
        getDashboardStats(),
      ]);
      setCustomers(customerData);
      setStats(statsData);
    } catch (error) {
      console.error(error);
      showSnackbar("Error loading data");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const cycleSortBy = () => {
    const options = ["name", "balance", "recent"];
    const next = options[(options.indexOf(sortBy) + 1) % options.length];
    setSortBy(next);
  };

  const sortLabel = { name: "A–Z", balance: "Balance ↓", recent: "Recent" }[
    sortBy
  ];

  const filteredCustomers = customers
    .filter((customer) => {
      if (customerFilter === "owing") return customer.owed_amount > 0;
      if (customerFilter === "paid") return customer.owed_amount <= 0;
      return true;
    })
    .filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchQuery)),
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "balance")
        return (b.owed_amount || 0) - (a.owed_amount || 0);
      if (sortBy === "recent") return (b.id || 0) - (a.id || 0);
      return 0;
    });

  const overdueCount = stats.overdue_count || 0;
  const emptyTextColor = theme.colors.onSurfaceVariant || "#9CA3AF";
  const emptySubtextColor = theme.colors.onSurfaceVariant || "#6B7280";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header
        style={[styles.header, { backgroundColor: theme.colors.primary }]}
      >
        <Appbar.Content
          title="Loan Tracker"
          subtitle="Manage customer loans"
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
        <View>
          <Appbar.Action
            icon="format-list-bulleted"
            onPress={() => navigation.navigate("Transactions")}
            iconColor="#fff"
          />
          {overdueCount > 0 && (
            <Badge style={styles.badge} size={16}>
              {overdueCount}
            </Badge>
          )}
        </View>
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate("Settings")}
          iconColor="#fff"
        />
      </Appbar.Header>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={() =>
              navigation.navigate("CustomerDetail", { customer: item })
            }
          />
        )}
        ListHeaderComponent={
          <View>
            <DashboardStats stats={stats} />

            <View style={styles.controlsRow}>
              <SegmentedButtons
                value={customerFilter}
                onValueChange={setCustomerFilter}
                style={styles.segmented}
                buttons={[
                  { value: "all", label: "All", icon: "account-multiple" },
                  {
                    value: "owing",
                    label: "Owing",
                    icon: "alert-circle-outline",
                  },
                  { value: "paid", label: "Paid", icon: "check-circle-outline" },
                ]}
              />
              <TouchableOpacity
                onPress={cycleSortBy}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                  },
                ]}
              >
                <Text
                  style={[styles.sortLabel, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {sortLabel}
                </Text>
              </TouchableOpacity>
            </View>

            <Searchbar
              placeholder="Search customers..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={[styles.emptyText, { color: emptyTextColor }]}>
              {searchQuery ? "No customers found" : "No customers yet"}
            </Text>
            <Text style={[styles.emptySubtext, { color: emptySubtextColor }]}>
              {searchQuery
                ? "Try a different name or phone number"
                : 'Tap "Add Customer" to get started'}
            </Text>
          </View>
        }
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        icon="plus"
        label="Add Customer"
        onPress={() => navigation.navigate("AddCustomer")}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: "OK", onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: "#1E3A5F" },
  headerTitle: { color: "#fff", fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  segmented: { flex: 1 },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 72,
    alignItems: "center",
  },
  sortLabel: { fontSize: 12, fontWeight: "600" },
  searchBar: {
    margin: 16,
    marginTop: 10,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: { fontSize: 14 },
  list: { paddingBottom: 100 },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

export default HomeScreen;
