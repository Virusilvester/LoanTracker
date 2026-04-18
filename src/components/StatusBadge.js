import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getStatusColor, getDaysOverdue } from "../utils/helpers";

const StatusBadge = ({ status, dateBorrowed }) => {
  const daysOverdue = status === "unpaid" ? getDaysOverdue(dateBorrowed) : 0;
  const color = getStatusColor(status, daysOverdue);

  const getLabel = () => {
    if (status === "paid") return "✓ Paid";
    if (daysOverdue > 0) return `⚠️ ${daysOverdue}d overdue`;
    return "⏳ Pending";
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: `${color}20`, borderColor: color },
      ]}
    >
      <Text style={[styles.text, { color }]}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default StatusBadge;
