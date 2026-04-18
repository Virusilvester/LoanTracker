import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Avatar, Card } from "react-native-paper";
import { getInitials, formatCurrency } from "../utils/helpers";

const CustomerCard = ({ customer, onPress }) => {
  const hasDebt = customer.owed_amount > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, hasDebt && styles.cardWithDebt]}>
        <Card.Content style={styles.content}>
          {customer.photo ? (
            <Image source={{ uri: customer.photo }} style={styles.photo} />
          ) : (
            <Avatar.Text
              size={50}
              label={getInitials(customer.name)}
              style={[styles.avatar, hasDebt && { backgroundColor: "#EF4444" }]}
            />
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{customer.name}</Text>
            <Text style={styles.phone}>{customer.phone || "No phone"}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>
                {customer.total_transactions} items
              </Text>
              {hasDebt ? (
                <Text style={styles.debtAmount}>
                  Owes: {formatCurrency(customer.owed_amount)}
                </Text>
              ) : (
                <Text style={styles.paidStatus}>All Paid ✓</Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  cardWithDebt: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatar: {
    backgroundColor: "#6366F1",
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  cardWithDebt: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#6366F1",
  },
  info: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  phone: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  stat: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 12,
  },
  debtAmount: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "700",
  },
  paidStatus: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
  },
});

export default CustomerCard;
