import React, { useContext, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Share } from "react-native";
import {
  Appbar,
  List,
  Divider,
  Button,
  Portal,
  Dialog,
  ActivityIndicator,
  SegmentedButtons,
  TextInput,
  HelperText,
  useTheme,
} from "react-native-paper";
import { exportToCSV, shareDatabase, importDatabase } from "../services/backup";
import { checkAndScheduleOverdueReminders } from "../services/notifications";
import { PreferencesContext } from "../contexts/PreferencesContext";

const SettingsScreen = () => {
  const theme = useTheme();
  const { themeMode, setThemeMode, defaultDueDays, setDefaultDueDays } =
    useContext(PreferencesContext);
  const [loading, setLoading] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [dueDialogVisible, setDueDialogVisible] = useState(false);
  const [dueDaysInput, setDueDaysInput] = useState(
    String(defaultDueDays || 30),
  );

  const dueDaysError = useMemo(() => {
    const parsed = parseInt(dueDaysInput, 10);
    if (!dueDaysInput) return "Due days is required";
    if (Number.isNaN(parsed) || parsed <= 0)
      return "Enter a valid number of days";
    return "";
  }, [dueDaysInput]);

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

  const openDueDaysDialog = () => {
    setDueDaysInput(String(defaultDueDays || 30));
    setDueDialogVisible(true);
  };

  const handleSaveDueDays = async () => {
    if (dueDaysError) return;
    await setDefaultDueDays(dueDaysInput);
    setDueDialogVisible(false);
    Alert.alert("Saved", `Default due period set to ${dueDaysInput} days`);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Settings & Backup" />
      </Appbar.Header>

      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <View style={styles.appearanceSection}>
            <SegmentedButtons
              value={themeMode}
              onValueChange={setThemeMode}
              buttons={[
                { value: "system", label: "System", icon: "theme-light-dark" },
                { value: "light", label: "Light", icon: "white-balance-sunny" },
                { value: "dark", label: "Dark", icon: "weather-night" },
              ]}
            />
          </View>

          <List.Item
            title="Default Due Period"
            description={`${defaultDueDays || 30} days`}
            left={(props) => (
              <List.Icon {...props} icon="calendar-clock" color="#6366F1" />
            )}
            onPress={openDueDaysDialog}
          />
        </List.Section>

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
            style={[
              styles.shareButton,
              { borderColor: theme.colors.secondary },
            ]}
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

        <Dialog
          visible={dueDialogVisible}
          onDismiss={() => setDueDialogVisible(false)}
        >
          <Dialog.Title>Default Due Period</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Due in (days)"
              value={dueDaysInput}
              onChangeText={setDueDaysInput}
              mode="outlined"
              keyboardType="number-pad"
              disabled={loading}
            />
            <HelperText type="error" visible={!!dueDaysError}>
              {dueDaysError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDueDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveDueDays}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            {
              backgroundColor: theme.dark
                ? "rgba(0,0,0,0.6)"
                : "rgba(255,255,255,0.8)",
            },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appearanceSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  infoSection: {
    padding: 16,
    marginTop: 24,
  },
  shareButton: {},
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SettingsScreen;
