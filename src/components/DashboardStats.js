import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Surface, useTheme } from "react-native-paper";
import { formatCurrency } from "../utils/helpers";

const StatCard = ({ title, amount, count, color }) => {
  const theme = useTheme();
  const secondaryText = theme.colors.onSurfaceVariant || "#6B7280";

  return (
    <Surface
      style={[
        styles.statCard,
        { borderTopColor: color, backgroundColor: theme.colors.surface },
      ]}
    >
      <Text style={[styles.statTitle, { color: secondaryText }]}>{title}</Text>
      <Text style={[styles.statAmount, { color }]}>
        {formatCurrency(amount)}
      </Text>
      <Text style={[styles.statCount, { color: secondaryText }]}>
        {count} transactions
      </Text>
    </Surface>
  );
};

const DashboardStats = ({ stats }) => {
  const theme = useTheme();
  const onPrimary = theme.colors.onPrimary || "#fff";
  const onPrimaryMuted =
    theme.colors.onPrimaryContainer || theme.colors.onPrimary || "#94A3B8";

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
      <View
        style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={[styles.summaryLabel, { color: onPrimaryMuted }]}>
          Active Customers
        </Text>
        <Text style={[styles.summaryValue, { color: onPrimary }]}>
          {stats.total_customers || 0}
        </Text>
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
    borderTopWidth: 4,
  },
  statTitle: {
    fontSize: 12,
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
  },
  summaryCard: {
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default DashboardStats;
