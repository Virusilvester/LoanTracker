import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const reminderKey = (transactionId) => `reminder_${transactionId}`;
const overdueKey = (transactionId) => `overdue_${transactionId}`;

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }
  return true;
};

export const schedulePaymentReminder = async (
  transactionId,
  customerName,
  amount,
  daysFromNow = 7,
) => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💰 Payment Reminder",
      body: `${customerName} owes ${amount}. Follow up for payment.`,
      data: { transactionId, type: "payment_reminder" },
    },
    trigger: {
      seconds: daysFromNow * 24 * 60 * 60,
      repeats: false,
    },
  });

  // Store reminder ID in AsyncStorage for cancellation if paid
  await AsyncStorage.setItem(reminderKey(transactionId), identifier);
  return identifier;
};

export const cancelReminder = async (transactionId) => {
  const identifier = await AsyncStorage.getItem(reminderKey(transactionId));
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    await AsyncStorage.removeItem(reminderKey(transactionId));
  }
};

export const cancelOverdueReminder = async (transactionId) => {
  const identifier = await AsyncStorage.getItem(overdueKey(transactionId));
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    await AsyncStorage.removeItem(overdueKey(transactionId));
  }
};

export const checkAndScheduleOverdueReminders = async () => {
  const { getOverdueTransactions } = require("../database/database");
  const overdue = await getOverdueTransactions();

  for (const transaction of overdue) {
    const alreadyScheduled = await AsyncStorage.getItem(
      overdueKey(transaction.id),
    );
    if (alreadyScheduled) continue;

    // Schedule daily reminder for overdue items
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚠️ Overdue Payment",
        body: `${transaction.customer_name} - ${transaction.item_name} ($${transaction.amount}) is overdue!`,
        data: { transactionId: transaction.id, type: "overdue" },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(overdueKey(transaction.id), identifier);
  }
};
