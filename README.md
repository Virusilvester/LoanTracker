# LoanTracker

> A mobile app to track loans, manage customers, and stay on top of repayments — built with React Native & Expo.

---

## Features

**Customer Management**
- Add, edit, and delete customers with optional profile photos
- Filter your customer list by All / Owing / Paid
- Auto-refresh on navigation so balances are always current

**Loan Tracking**
- Log loan transactions per customer with amount, quantity, and due dates
- Filter transactions by Unpaid / Paid / All, or search by item
- Visual status badges that show "due in X days" or "overdue"

**Global Transactions View**
- See loans across all customers in one screen
- Filter by Unpaid / Overdue / Paid / All
- Mark loans as paid or delete them with a single tap

**Notifications & Reminders**
- Scheduled reminders for upcoming due dates
- Overdue alerts — without duplicates
- Reminders auto-cancelled when a loan is marked paid

**Data & Sharing**
- SQLite local database — data stays on your device
- Export and share loan records via email
- Camera photo support for customer profiles (auto-creates `photos/` folder)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.71 + Expo ~48 |
| Navigation | React Navigation v6 (Stack) |
| Database | expo-sqlite |
| Storage | AsyncStorage |
| Notifications | expo-notifications |
| UI | React Native Paper |
| File sharing | expo-sharing, expo-mail-composer |
| Date utilities | date-fns |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android or iOS device / emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/Virusilvester/LoanTracker.git
cd LoanTracker

# Install dependencies
npm install

# Start the Expo dev server
npm start
```

Then scan the QR code with the **Expo Go** app on your phone, or press `a` to launch on an Android emulator.

---

## Install via APK (Android)

1. Download the latest APK from the [Releases](https://github.com/Virusilvester/LoanTracker/releases) page
2. On your Android device, go to **Settings → Security** and enable **Install from unknown sources**
3. Open the downloaded APK and follow the prompts

---

## Project Structure

```
LoanTracker/
├── App.js                   # Root navigator & screen registration
├── app.json                 # Expo config (package name, icons, version)
├── assets/                  # Icons, splash screen, adaptive icon
└── src/
    ├── components/
    │   ├── TransactionItem.js   # Loan card with qty, paid date, status badge
    │   └── StatusBadge.js       # "Due in X" / "Overdue" badge
    ├── database/
    │   └── database.js          # SQLite schema & CRUD helpers
    ├── screens/
    │   ├── HomeScreen.js            # Customer list with filters
    │   ├── CustomerDetailScreen.js  # Per-customer loans & filters
    │   ├── EditCustomerScreen.js    # Edit/delete customer
    │   ├── AddTransactionScreen.js  # Add loan with customer preview
    │   └── TransactionsScreen.js    # Global loans dashboard
    ├── services/
    │   └── notifications.js     # Reminder scheduling & cancellation
    └── utils/
        ├── helpers.js           # Date formatting, balance calculation
        └── photos.js            # Camera capture & folder management
```

---

## Version History

| Version | Highlights |
|---|---|
| v1.0.3 | Global Transactions screen, Overdue filter, duplicate-reminder fix, improved dashboard counts |
| v1.0.2 | Customer CRUD in DB, transaction item improvements |
| v1.0.1 | Initial release with core loan tracking |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

This project is private. All rights reserved © 2026 Virusilvester.
