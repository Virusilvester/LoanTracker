import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getAllDataForExport, initDatabase } from "../database/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const exportToCSV = async () => {
  try {
    const data = await getAllDataForExport();

    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Create CSV header
    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Item",
      "Amount",
      "Quantity",
      "Status",
      "Paid Amount",
      "Balance",
      "Due Date",
      "Date Borrowed",
      "Date Paid",
      "Notes",
    ];
    let csvContent = headers.join(",") + "\n";

    // Add data rows
    data.forEach((row) => {
      const rowData = [
        `"${row.name || ""}"`,
        `"${row.phone || ""}"`,
        `"${row.email || ""}"`,
        `"${row.item_name || ""}"`,
        row.amount || 0,
        row.quantity || 1,
        row.status || "unpaid",
        row.paid_amount || 0,
        row.balance || 0,
        `"${row.due_date || ""}"`,
        `"${row.date_borrowed || ""}"`,
        `"${row.date_paid || ""}"`,
        `"${row.notes || ""}"`,
      ];
      csvContent += rowData.join(",") + "\n";
    });

    // Save to file
    const fileName = `loan_tracker_backup_${new Date().toISOString().split("T")[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent);

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: "Export Loan Data",
        UTI: "public.comma-separated-values-text",
      });
    }

    return filePath;
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};

export const shareDatabase = async () => {
  const dbPath = `${FileSystem.documentDirectory}SQLite/loan_tracker.db`;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dbPath, {
      mimeType: "application/x-sqlite3",
      dialogTitle: "Backup Database",
    });
  }
};

export const importDatabase = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/x-sqlite3",
      copyToCacheDirectory: true,
    });

    if (result.canceled === false) {
      const dbPath = `${FileSystem.documentDirectory}SQLite/loan_tracker.db`;

      // Backup current DB first
      const backupPath = `${FileSystem.documentDirectory}SQLite/loan_tracker_backup_${Date.now()}.db`;
      try {
        await FileSystem.copyAsync({
          from: dbPath,
          to: backupPath,
        });
      } catch (e) {
        console.log("No existing DB to backup");
      }

      // Copy new DB
      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: dbPath,
      });

      // Reinitialize
      await initDatabase();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Import error:", error);
    throw error;
  }
};
