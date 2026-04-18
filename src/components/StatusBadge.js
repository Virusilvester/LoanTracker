import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  getStatusColor,
  getDaysOverdueWithDueDate,
  getDaysUntilDueWithDueDate,
} from "../utils/helpers";

const StatusBadge = ({ status, dateBorrowed, dueDate }) => {
  const isOpen = status !== "paid";
  const daysOverdue = isOpen
    ? getDaysOverdueWithDueDate(dateBorrowed, dueDate)
    : 0;
  const daysUntilDue = isOpen
    ? getDaysUntilDueWithDueDate(dateBorrowed, dueDate)
    : 0;
  const color = getStatusColor(status, daysOverdue);

  const getLabel = () => {
    if (status === "paid") return "✓ Paid";

    const dueText =
      daysOverdue > 0
        ? `${daysOverdue}d overdue`
        : daysUntilDue === 0
          ? "Due today"
          : `Due in ${daysUntilDue}d`;

    if (status === "partial") {
      return daysOverdue > 0
        ? `⚠️ Partial • ${dueText}`
        : `Partial • ${dueText}`;
    }

    return daysOverdue > 0 ? `⚠️ ${dueText}` : `⏳ ${dueText}`;
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
