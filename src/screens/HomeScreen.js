import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import {
  FAB,
  Searchbar,
  Appbar,
  Snackbar,
  IconButton,
} from "react-native-paper";
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
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    initDatabase().then(() => loadData());
  }, []);

  const loadData = async () => {
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
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)),
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Loan Tracker" subtitle="Manage customer loans" />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate("Settings")}
        />
      </Appbar.Header>

      <DashboardStats stats={stats} />

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
});

export default HomeScreen;
