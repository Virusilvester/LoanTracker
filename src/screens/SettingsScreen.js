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
  RadioButton,
} from "react-native-paper";
import { exportToCSV, shareDatabase, importDatabase } from "../services/backup";
import { checkAndScheduleOverdueReminders } from "../services/notifications";
import { PreferencesContext } from "../contexts/PreferencesContext";

const CURRENCY_OPTIONS = [
  { label: "ZMW (K)", value: "ZMW" },
  { label: "USD ($)", value: "USD" },
  { label: "ZAR (R)", value: "ZAR" },
  { label: "KES (Ksh)", value: "KES" },
  { label: "NGN (₦)", value: "NGN" },
  { label: "GHS (₵)", value: "GHS" },
  { label: "GBP (£)", value: "GBP" },
  { label: "EUR (€)", value: "EUR" },
];

const SettingsScreen = () => {
  const theme = useTheme();
  const {
    themeMode,
    setThemeMode,
    currencyCode,
    setCurrencyCode,
    defaultDueDays,
    setDefaultDueDays,
  } = useContext(PreferencesContext);
  const [loading, setLoading] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [dueDialogVisible, setDueDialogVisible] = useState(false);
  const [currencyDialogVisible, setCurrencyDialogVisible] = useState(false);
  const [dueDaysInput, setDueDaysInput] = useState(
    String(defaultDueDays || 30),
  );
  const [selectedCurrency, setSelectedCurrency] = useState(
    currencyCode || "ZMW",
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
        Alert.alert("Success", "Database imported. Please restart the app.");
      }
    } catch (error) {
      Alert.alert("Import Failed", "Could not import database");
    } finally {
      setLoading(false);
    }
  };

  const handleTestReminders = async () => {
    await checkAndScheduleOverdueReminders();
    Alert.alert("Done", "Overdue payment reminders have been scheduled");
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

  const openCurrencyDialog = () => {
    setSelectedCurrency(currencyCode || "ZMW");
    setCurrencyDialogVisible(true);
  };

  const currentCurrencyLabel =
    CURRENCY_OPTIONS.find((c) => c.value === currencyCode)?.label ||
    currencyCode ||
    "ZMW";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView>
        {/* Appearance */}
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <View style={styles.sectionContent}>
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
        </List.Section>

        <Divider />

        {/* Preferences */}
        <List.Section>
          <List.Subheader>Preferences</List.Subheader>

          <List.Item
            title="Default Due Period"
            description={`${defaultDueDays || 30} days after loan date`}
            left={(props) => (
              <List.Icon
                {...props}
                icon="calendar-clock"
                color={theme.colors.secondary}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={openDueDaysDialog}
          />
          <Divider />

          <List.Item
            title="Currency"
            description={currentCurrencyLabel}
            left={(props) => (
              <List.Icon
                {...props}
                icon="currency-usd"
                color={theme.colors.secondary}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={openCurrencyDialog}
          />
        </List.Section>

        <Divider />

        {/* Data Management */}
        <List.Section>
          <List.Subheader>Data Management</List.Subheader>

          <List.Item
            title="Export to CSV"
            description="Share data as a spreadsheet"
            left={(props) => (
              <List.Icon {...props} icon="file-export" color="#6366F1" />
            )}
            onPress={handleExportCSV}
          />
          <Divider />

          <List.Item
            title="Backup Database"
            description="Create a full database backup file"
            left={(props) => (
              <List.Icon {...props} icon="cloud-upload" color="#10B981" />
            )}
            onPress={handleBackupDB}
          />
          <Divider />

          <List.Item
            title="Restore from Backup"
            description="Import a previously saved backup"
            left={(props) => (
              <List.Icon {...props} icon="cloud-download" color="#F59E0B" />
            )}
            onPress={() => setImportDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        {/* Notifications */}
        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          <List.Item
            title="Check Overdue Reminders"
            description="Schedule reminders for all overdue loans"
            left={(props) => (
              <List.Icon {...props} icon="bell-ring" color="#EF4444" />
            )}
            onPress={handleTestReminders}
          />
        </List.Section>

        <Divider />

        {/* About */}
        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Share App"
            description="Tell others about Loan Tracker"
            left={(props) => (
              <List.Icon
                {...props}
                icon="share-variant"
                color={theme.colors.secondary}
              />
            )}
            onPress={() =>
              Share.share({
                message:
                  "Loan Tracker App — Easily manage customer loans! Track who owes what, set reminders, and keep your records organised.",
              })
            }
          />
          <Divider />
          <List.Item
            title="Version"
            description="1.0.3"
            left={(props) => (
              <List.Icon
                {...props}
                icon="information-outline"
                color="#9CA3AF"
              />
            )}
          />
        </List.Section>
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        <Dialog
          visible={importDialogVisible}
          onDismiss={() => setImportDialogVisible(false)}
        >
          <Dialog.Title>Restore from Backup</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Warning"
              description="This will replace ALL current data with the backup. Make sure you have exported your current data first."
              left={(props) => (
                <List.Icon {...props} icon="alert" color="#EF4444" />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setImportDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleImportDB} textColor="#EF4444">
              Restore
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
            <HelperText type="info" visible>
              New loans will default to this many days before the due date.
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDueDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveDueDays} disabled={!!dueDaysError}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={currencyDialogVisible}
          onDismiss={() => setCurrencyDialogVisible(false)}
        >
          <Dialog.Title>Select Currency</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 360 }}>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(v) => setSelectedCurrency(v)}
                value={selectedCurrency}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <RadioButton.Item
                    key={opt.value}
                    label={opt.label}
                    value={opt.value}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCurrencyDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                setCurrencyCode(selectedCurrency);
                setCurrencyDialogVisible(false);
              }}
            >
              Save
            </Button>
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
  container: { flex: 1 },
  sectionContent: { paddingHorizontal: 16, paddingBottom: 8 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SettingsScreen;
