import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

import HomeScreen from "./src/screens/HomeScreen";
import AddCustomerScreen from "./src/screens/AddCustomerScreen";
import CustomerDetailScreen from "./src/screens/CustomerDetailScreen";
import AddTransactionScreen from "./src/screens/AddTransactionScreen";

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1E3A5F",
    accent: "#6366F1",
    background: "#F3F4F6",
    surface: "#FFFFFF",
    text: "#1F2937",
    placeholder: "#9CA3AF",
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#1E3A5F" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "#F3F4F6" },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
          <Stack.Screen
            name="CustomerDetail"
            component={CustomerDetailScreen}
          />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
