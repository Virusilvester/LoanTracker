import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Surface } from "react-native-paper";
import { formatCurrency } from "../utils/helpers";

const StatCard = ({ title, amount, count, color }) => (
  <Surface style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statAmount, { color }]}>{formatCurrency(amount)}</Text>
    <Text style={styles.statCount}>{count} transactions</Text>
  </Surface>
);

const DashboardStats = ({ stats }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          title="Total Paid"
          amount={stats.total_paid || 0}
          count={stats.paid_count || 0}
          color="#10B981"
        />
        <StatCard
          title="Outstanding"
          amount={stats.total_owed || 0}
          count={stats.unpaid_count || 0}
          color="#EF4444"
        />
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Active Customers</Text>
        <Text style={styles.summaryValue}>{stats.total_customers || 0}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#fff",
    borderTopWidth: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statAmount: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 4,
  },
  statCount: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  summaryCard: {
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#1E3A5F",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#94A3B8",
    fontSize: 14,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default DashboardStats;
