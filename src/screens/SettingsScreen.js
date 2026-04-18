import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Share } from "react-native";
import {
  Appbar,
  List,
  Divider,
  Button,
  Portal,
  Dialog,
  ActivityIndicator,
} from "react-native-paper";
import { exportToCSV, shareDatabase, importDatabase } from "../services/backup";
import { checkAndScheduleOverdueReminders } from "../services/notifications";

const SettingsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      await exportToCSV();
    } catch (error) {
      Alert.alert("Export Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDB = async () => {
    setLoading(true);
    try {
      await shareDatabase();
    } catch (error) {
      Alert.alert("Backup Failed", "Could not create database backup");
    } finally {
      setLoading(false);
    }
  };

  const handleImportDB = async () => {
    setImportDialogVisible(false);
    setLoading(true);
    try {
      const success = await importDatabase();
      if (success) {
        Alert.alert(
          "Success",
          "Database imported successfully. Please restart the app.",
        );
      }
    } catch (error) {
      Alert.alert("Import Failed", "Could not import database");
    } finally {
      setLoading(false);
    }
  };

  const handleTestReminders = async () => {
    await checkAndScheduleOverdueReminders();
    Alert.alert(
      "Reminders Scheduled",
      "Overdue payment reminders have been scheduled",
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Settings & Backup" />
      </Appbar.Header>

      <ScrollView>
        <List.Section>
          <List.Subheader>Data Management</List.Subheader>

          <List.Item
            title="Export to CSV"
            description="Share data as spreadsheet"
            left={(props) => (
              <List.Icon {...props} icon="file-export" color="#6366F1" />
            )}
            onPress={handleExportCSV}
          />
          <Divider />

          <List.Item
            title="Backup Database"
            description="Create full database backup"
            left={(props) => (
              <List.Icon {...props} icon="cloud-upload" color="#10B981" />
            )}
            onPress={handleBackupDB}
          />
          <Divider />

          <List.Item
            title="Import Database"
            description="Restore from backup file"
            left={(props) => (
              <List.Icon {...props} icon="cloud-download" color="#F59E0B" />
            )}
            onPress={() => setImportDialogVisible(true)}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>

          <List.Item
            title="Check Overdue Reminders"
            description="Schedule reminders for overdue items"
            left={(props) => (
              <List.Icon {...props} icon="bell-ring" color="#EF4444" />
            )}
            onPress={handleTestReminders}
          />
        </List.Section>

        <View style={styles.infoSection}>
          <Button
            mode="outlined"
            onPress={() =>
              Share.share({
                message:
                  "Loan Tracker App - Manage your customer loans easily!",
              })
            }
            style={styles.shareButton}
          >
            Share App
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={importDialogVisible}
          onDismiss={() => setImportDialogVisible(false)}
        >
          <Dialog.Title>Import Database</Dialog.Title>
          <Dialog.Content>
            <ActivityIndicator animating={loading} />
            <List.Item
              title="Warning"
              description="This will replace all current data. Make sure you have a backup first!"
              left={(props) => (
                <List.Icon {...props} icon="alert" color="#EF4444" />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setImportDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleImportDB} color="#EF4444">
              Import
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  infoSection: {
    padding: 16,
    marginTop: 24,
  },
  shareButton: {
    borderColor: "#6366F1",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SettingsScreen;
