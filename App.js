import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  Provider as PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  ActivityIndicator,
  Text,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen from "./src/screens/HomeScreen";
import AddCustomerScreen from "./src/screens/AddCustomerScreen";
import CustomerDetailScreen from "./src/screens/CustomerDetailScreen";
import AddTransactionScreen from "./src/screens/AddTransactionScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";
import EditCustomerScreen from "./src/screens/EditCustomerScreen";
import AddPaymentScreen from "./src/screens/AddPaymentScreen";
import { PreferencesContext } from "./src/contexts/PreferencesContext";
import { initDatabase } from "./src/database/database";

import {
  requestNotificationPermissions,
  checkAndScheduleOverdueReminders,
} from "./src/services/notifications";

const Stack = createStackNavigator();

const STORAGE_KEYS = {
  themeMode: "pref_theme_mode",
  defaultDueDays: "pref_default_due_days",
};

export default function App() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState("system"); // system | light | dark
  const [defaultDueDays, setDefaultDueDaysState] = useState(30);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Database init failed:", error);
      } finally {
        setDbReady(true);
      }

      // Request permissions on app start
      requestNotificationPermissions();

      // Check for overdue items daily (you might want to use BackgroundFetch for production)
      try {
        await checkAndScheduleOverdueReminders();
      } catch (error) {
        console.error("Overdue reminder check failed:", error);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(STORAGE_KEYS.themeMode);
        if (savedThemeMode) setThemeModeState(savedThemeMode);
      } catch {}

      try {
        const savedDueDays = await AsyncStorage.getItem(
          STORAGE_KEYS.defaultDueDays,
        );
        const parsed = parseInt(savedDueDays, 10);
        if (!Number.isNaN(parsed) && parsed > 0) setDefaultDueDaysState(parsed);
      } catch {}
    };

    loadPreferences();
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.themeMode, mode);
    } catch {}
  }, []);

  const setDefaultDueDays = useCallback(async (days) => {
    const parsed = parseInt(days, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    setDefaultDueDaysState(parsed);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.defaultDueDays, String(parsed));
    } catch {}
  }, []);

  const resolvedThemeMode =
    themeMode === "system" ? systemColorScheme || "light" : themeMode;

  const paperTheme = useMemo(() => {
    const base = resolvedThemeMode === "dark" ? MD3DarkTheme : MD3LightTheme;
    const colors =
      resolvedThemeMode === "dark"
        ? {
            primary: "#1E3A5F",
            secondary: "#6366F1",
            background: "#0B1220",
            surface: "#111827",
            onSurface: "#E5E7EB",
            onBackground: "#E5E7EB",
            outline: "#374151",
            error: "#EF4444",
          }
        : {
            primary: "#1E3A5F",
            secondary: "#6366F1",
            background: "#F3F4F6",
            surface: "#FFFFFF",
            onSurface: "#1F2937",
            onBackground: "#1F2937",
            outline: "#E5E7EB",
            error: "#EF4444",
          };

    return {
      ...base,
      colors: {
        ...base.colors,
        ...colors,
      },
    };
  }, [resolvedThemeMode]);

  const navigationTheme = useMemo(() => {
    const base =
      resolvedThemeMode === "dark" ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: paperTheme.colors.background,
        card: paperTheme.colors.surface,
        text: paperTheme.colors.onSurface,
        primary: paperTheme.colors.primary,
      },
    };
  }, [paperTheme, resolvedThemeMode]);

  const preferences = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      defaultDueDays,
      setDefaultDueDays,
    }),
    [defaultDueDays, setDefaultDueDays, setThemeMode, themeMode],
  );

  return (
    <PreferencesContext.Provider value={preferences}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="light" backgroundColor={paperTheme.colors.primary} />

        {dbReady ? (
          <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: paperTheme.colors.background },
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
              <Stack.Screen
                name="CustomerDetail"
                component={CustomerDetailScreen}
              />
              <Stack.Screen name="EditCustomer" component={EditCustomerScreen} />
              <Stack.Screen
                name="AddTransaction"
                component={AddTransactionScreen}
              />
              <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
              <Stack.Screen name="Transactions" component={TransactionsScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        ) : (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: paperTheme.colors.background },
            ]}
          >
            <ActivityIndicator size="large" />
            <Text style={[styles.loadingText, { color: paperTheme.colors.onBackground }]}>
              Loading…
            </Text>
          </View>
        )}
      </PaperProvider>
    </PreferencesContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
