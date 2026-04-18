import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("loan_tracker.db");

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // Customers table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          photo TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => console.log("Customers table created"),
        (_, error) => reject(error),
      );

      // Transactions table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          item_name TEXT NOT NULL,
          amount REAL NOT NULL,
          quantity INTEGER DEFAULT 1,
          status TEXT DEFAULT 'unpaid',
          date_borrowed DATETIME DEFAULT CURRENT_TIMESTAMP,
          date_paid DATETIME,
          notes TEXT,
          reminder_date DATETIME,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        );`,
        [],
        () => {
          console.log("Transactions table created");
          resolve();
        },
        (_, error) => reject(error),
      );
    });
  });
};

export const addCustomer = (name, phone, email, photo = null) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO customers (name, phone, email, photo) VALUES (?, ?, ?, ?)",
        [name, phone, email, photo],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error),
      );
    });
  });
};

export const getCustomers = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT c.*, 
          COUNT(t.id) as total_transactions,
          SUM(CASE WHEN t.status = 'unpaid' THEN t.amount ELSE 0 END) as owed_amount
         FROM customers c
         LEFT JOIN transactions t ON c.id = t.customer_id
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error),
      );
    });
  });
};

export const addTransaction = (
  customerId,
  itemName,
  amount,
  quantity = 1,
  notes = "",
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO transactions (customer_id, item_name, amount, quantity, notes) VALUES (?, ?, ?, ?, ?)",
        [customerId, itemName, amount, quantity, notes],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error),
      );
    });
  });
};

export const getTransactions = (customerId = null) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT t.*, c.name as customer_name 
                 FROM transactions t
                 JOIN customers c ON t.customer_id = c.id`;
    let params = [];

    if (customerId) {
      query += " WHERE t.customer_id = ?";
      params.push(customerId);
    }

    query += " ORDER BY t.date_borrowed DESC";

    db.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error),
      );
    });
  });
};

export const markAsPaid = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE transactions SET status = ?, date_paid = CURRENT_TIMESTAMP WHERE id = ?",
        ["paid", transactionId],
        (_, result) => resolve(result),
        (_, error) => reject(error),
      );
    });
  });
};

export const deleteTransaction = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM transactions WHERE id = ?",
        [transactionId],
        (_, result) => resolve(result),
        (_, error) => reject(error),
      );
    });
  });
};

export const getDashboardStats = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT 
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(t.id) as total_transactions,
          SUM(CASE WHEN t.status = 'unpaid' THEN t.amount ELSE 0 END) as total_owed,
          SUM(CASE WHEN t.status = 'paid' THEN t.amount ELSE 0 END) as total_paid
         FROM customers c
         LEFT JOIN transactions t ON c.id = t.customer_id`,
        [],
        (_, { rows }) => resolve(rows._array[0]),
        (_, error) => reject(error),
      );
    });
  });
};

export default db;
