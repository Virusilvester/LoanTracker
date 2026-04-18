import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import {
  FAB,
  Searchbar,
  Appbar,
  Snackbar,
  SegmentedButtons,
  Text,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import CustomerCard from "../components/CustomerCard";
import DashboardStats from "../components/DashboardStats";
import {
  getCustomers,
  getDashboardStats,
  initDatabase,
} from "../database/database";

const HomeScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        loadData();
      })
      .catch((error) => {
        console.error(error);
        showSnackbar("Error initializing database");
      });
  }, []);

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
      if (!dbInitialized) return;
      loadData();
    }, [dbInitialized, loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

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
    );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Loan Tracker" subtitle="Manage customer loans" />
        <Appbar.Action
          icon="format-list-bulleted"
          onPress={() => navigation.navigate("Transactions")}
        />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>

      <DashboardStats stats={stats} />

      <View style={styles.filters}>
        <SegmentedButtons
          value={customerFilter}
          onValueChange={setCustomerFilter}
          buttons={[
            { value: "all", label: "All", icon: "account-multiple" },
            { value: "owing", label: "Owing", icon: "alert-circle-outline" },
            { value: "paid", label: "Paid", icon: "check-circle-outline" },
          ]}
        />
      </View>

      <Searchbar
        placeholder="Search customers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>
              Tap “Add Customer” to record your first customer.
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Customer"
        onPress={() => navigation.navigate("AddCustomer")}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#1E3A5F",
  },
  searchBar: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  list: {
    paddingBottom: 80,
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
    paddingHorizontal: 24,
  },
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

export default HomeScreen;
