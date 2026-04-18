import React from "react";

export const PreferencesContext = React.createContext({
  themeMode: "system",
  setThemeMode: async () => {},
  defaultDueDays: 30,
  setDefaultDueDays: async () => {},
});
