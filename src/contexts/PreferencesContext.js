import React from "react";

export const PreferencesContext = React.createContext({
  themeMode: "system",
  setThemeMode: async () => {},
  currencyCode: "ZMW",
  setCurrencyCode: async () => {},
  defaultDueDays: 30,
  setDefaultDueDays: async () => {},
});
