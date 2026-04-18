import { format, differenceInDays, parseISO } from "date-fns";

export const CREDIT_PERIOD_DAYS = 30;

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

export const getDaysOverdue = (dateBorrowed) => {
  try {
    const borrowed = parseISO(dateBorrowed);
    const due = new Date(borrowed);
    due.setDate(due.getDate() + CREDIT_PERIOD_DAYS);

    const today = new Date();
    const days = differenceInDays(today, due);
    return days > 0 ? days : 0;
  } catch {
    return 0;
  }
};

export const getDaysOverdueWithDueDate = (dateBorrowed, dueDate) => {
  try {
    if (dueDate) {
      const due = parseISO(dueDate);
      const today = new Date();
      const days = differenceInDays(today, due);
      return days > 0 ? days : 0;
    }
    return getDaysOverdue(dateBorrowed);
  } catch {
    return getDaysOverdue(dateBorrowed);
  }
};

export const getDaysUntilDue = (dateBorrowed) => {
  try {
    const borrowed = parseISO(dateBorrowed);
    const due = new Date(borrowed);
    due.setDate(due.getDate() + CREDIT_PERIOD_DAYS);

    const today = new Date();
    const remaining = differenceInDays(due, today);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
};

export const getDaysUntilDueWithDueDate = (dateBorrowed, dueDate) => {
  try {
    if (dueDate) {
      const due = parseISO(dueDate);
      const today = new Date();
      const remaining = differenceInDays(due, today);
      return remaining > 0 ? remaining : 0;
    }
    return getDaysUntilDue(dateBorrowed);
  } catch {
    return getDaysUntilDue(dateBorrowed);
  }
};

export const getStatusColor = (status, daysOverdue = 0) => {
  if (status === "paid") return "#10B981"; // Emerald
  if (daysOverdue > 7) return "#EF4444"; // Red
  if (daysOverdue > 0) return "#F59E0B"; // Orange
  return "#6366F1"; // Indigo
};

export const getInitials = (name) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
