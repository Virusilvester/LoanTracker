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
          due_date DATETIME,
          FOREIGN KEY (customer_id) REFERENCES customers (id)
        );`,
        [],
        () => console.log("Transactions table created"),
        (_, error) => reject(error),
      );

      // Payments table (supports partial payments)
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          date_paid DATETIME DEFAULT CURRENT_TIMESTAMP,
          note TEXT,
          FOREIGN KEY (transaction_id) REFERENCES transactions (id)
        );`,
        [],
        () => console.log("Payments table created"),
        (_, error) => reject(error),
      );

      // Lightweight migrations
      tx.executeSql(
        "PRAGMA table_info(transactions);",
        [],
        (_, { rows }) => {
          const columnNames = rows._array.map((c) => c.name);

          const runBackfill = () => {
            // Backfill payments for legacy "paid" transactions (idempotent)
            tx.executeSql(
              `INSERT INTO payments (transaction_id, amount, date_paid, note)
               SELECT t.id, t.amount, COALESCE(t.date_paid, t.date_borrowed), 'Migrated legacy paid'
               FROM transactions t
               WHERE t.status = 'paid'
               AND NOT EXISTS (
                 SELECT 1 FROM payments p WHERE p.transaction_id = t.id
               );`,
              [],
              () => {
                console.log("Migration complete");
                resolve();
              },
              (_, error) => reject(error),
            );
          };

          if (!columnNames.includes("due_date")) {
            tx.executeSql(
              "ALTER TABLE transactions ADD COLUMN due_date DATETIME;",
              [],
              () => {
                console.log("Migrated: added transactions.due_date");
                runBackfill();
              },
              (_, error) => reject(error),
            );
            return;
          }

          runBackfill();
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

export const getCustomerById = (customerId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM customers WHERE id = ?",
        [customerId],
        (_, { rows }) => resolve(rows._array[0] || null),
        (_, error) => reject(error),
      );
    });
  });
};

export const updateCustomer = (
  customerId,
  name,
  phone,
  email,
  photo = null,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE customers SET name = ?, phone = ?, email = ?, photo = ? WHERE id = ?",
        [name, phone, email, photo, customerId],
        (_, result) => resolve(result),
        (_, error) => reject(error),
      );
    });
  });
};

export const deleteCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM payments WHERE transaction_id IN (SELECT id FROM transactions WHERE customer_id = ?)",
        [customerId],
        () => {
          tx.executeSql(
            "DELETE FROM transactions WHERE customer_id = ?",
            [customerId],
            () => {
              tx.executeSql(
                "DELETE FROM customers WHERE id = ?",
                [customerId],
                (_, result) => resolve(result),
                (_, error) => reject(error),
              );
            },
            (_, error) => reject(error),
          );
        },
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
          SUM(
            CASE
              WHEN t.id IS NULL THEN 0
              WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN 0
              WHEN (t.amount - IFNULL(p.paid_amount, 0)) > 0 THEN (t.amount - IFNULL(p.paid_amount, 0))
              ELSE 0
            END
          ) as owed_amount
         FROM customers c
         LEFT JOIN transactions t ON c.id = t.customer_id
         LEFT JOIN (
           SELECT transaction_id, SUM(amount) as paid_amount
           FROM payments
           GROUP BY transaction_id
         ) p ON t.id = p.transaction_id
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
  dueDate = null,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO transactions (customer_id, item_name, amount, quantity, notes, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        [customerId, itemName, amount, quantity, notes, dueDate],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error),
      );
    });
  });
};

export const getTransactions = (customerId = null) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT 
                   t.*, 
                   c.name as customer_name,
                   CASE 
                     WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount
                     ELSE IFNULL(p.paid_amount, 0)
                   END as paid_amount,
                   CASE 
                     WHEN (t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END) > 0 
                     THEN (t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END)
                     ELSE 0
                   END as balance
                 FROM transactions t
                 JOIN customers c ON t.customer_id = c.id
                 LEFT JOIN (
                   SELECT transaction_id, SUM(amount) as paid_amount
                   FROM payments
                   GROUP BY transaction_id
                 ) p ON t.id = p.transaction_id`;
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

export const getTransactionById = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT 
           t.*, 
           c.name as customer_name,
           CASE 
             WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount
             ELSE IFNULL(p.paid_amount, 0)
           END as paid_amount,
           CASE 
             WHEN (t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END) > 0 
             THEN (t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END)
             ELSE 0
           END as balance
         FROM transactions t
         JOIN customers c ON t.customer_id = c.id
         LEFT JOIN (
           SELECT transaction_id, SUM(amount) as paid_amount
           FROM payments
           GROUP BY transaction_id
         ) p ON t.id = p.transaction_id
         WHERE t.id = ?
         LIMIT 1`,
        [transactionId],
        (_, { rows }) => resolve(rows._array[0] || null),
        (_, error) => reject(error),
      );
    });
  });
};

export const markAsPaid = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT amount FROM transactions WHERE id = ?",
        [transactionId],
        (_, { rows }) => {
          const total = rows._array[0]?.amount || 0;

          tx.executeSql(
            "SELECT IFNULL(SUM(amount), 0) as paid_amount FROM payments WHERE transaction_id = ?",
            [transactionId],
            (_, { rows: paymentRows }) => {
              const paid = paymentRows._array[0]?.paid_amount || 0;
              const remaining = total - paid;

              const insertRemaining = (onDone) => {
                if (remaining > 0) {
                  tx.executeSql(
                    "INSERT INTO payments (transaction_id, amount) VALUES (?, ?)",
                    [transactionId, remaining],
                    () => onDone(),
                    (_, error) => reject(error),
                  );
                } else {
                  onDone();
                }
              };

              insertRemaining(() => {
                tx.executeSql(
                  "UPDATE transactions SET status = ?, date_paid = CURRENT_TIMESTAMP WHERE id = ?",
                  ["paid", transactionId],
                  (_, result) => resolve(result),
                  (_, error) => reject(error),
                );
              });
            },
            (_, error) => reject(error),
          );
        },
        (_, error) => reject(error),
      );
    });
  });
};

export const addPayment = (transactionId, amount, note = "") => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO payments (transaction_id, amount, note) VALUES (?, ?, ?)",
        [transactionId, amount, note],
        (_, result) => {
          tx.executeSql(
            `SELECT 
               t.amount as total_amount,
               IFNULL(SUM(p.amount), 0) as paid_amount
             FROM transactions t
             LEFT JOIN payments p ON p.transaction_id = t.id
             WHERE t.id = ?`,
            [transactionId],
            (_, { rows }) => {
              const total = rows._array[0]?.total_amount || 0;
              const paid = rows._array[0]?.paid_amount || 0;

              let nextStatus = "unpaid";
              if (paid >= total && total > 0) nextStatus = "paid";
              else if (paid > 0) nextStatus = "partial";

              tx.executeSql(
                "UPDATE transactions SET status = ?, date_paid = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?",
                [nextStatus, nextStatus, transactionId],
                () => resolve(result.insertId),
                (_, error) => reject(error),
              );
            },
            (_, error) => reject(error),
          );
        },
        (_, error) => reject(error),
      );
    });
  });
};

export const getPayments = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM payments WHERE transaction_id = ? ORDER BY date_paid DESC",
        [transactionId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error),
      );
    });
  });
};

export const deleteTransaction = (transactionId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM payments WHERE transaction_id = ?",
        [transactionId],
        () => {
          tx.executeSql(
            "DELETE FROM transactions WHERE id = ?",
            [transactionId],
            (_, result) => resolve(result),
            (_, error) => reject(error),
          );
        },
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
          SUM(
            CASE
              WHEN t.id IS NULL THEN 0
              WHEN (
                t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
              ) > 0 THEN 1
              ELSE 0
            END
          ) as unpaid_count,
          SUM(
            CASE
              WHEN t.id IS NULL THEN 0
              WHEN (
                t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
              ) <= 0 THEN 1
              ELSE 0
            END
          ) as paid_count,
          SUM(
            CASE
              WHEN t.id IS NULL THEN 0
              WHEN (
                t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
              ) > 0 THEN (
                t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
              )
              ELSE 0
            END
          ) as total_owed,
          SUM(
            CASE
              WHEN t.id IS NULL THEN 0
              WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount
              ELSE IFNULL(p.paid_amount, 0)
            END
          ) as total_paid
         FROM customers c
         LEFT JOIN transactions t ON c.id = t.customer_id
         LEFT JOIN (
           SELECT transaction_id, SUM(amount) as paid_amount
           FROM payments
           GROUP BY transaction_id
         ) p ON t.id = p.transaction_id`,
        [],
        (_, { rows }) => resolve(rows._array[0]),
        (_, error) => reject(error),
      );
    });
  });
};

export const updateCustomerPhoto = (customerId, photoUri) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE customers SET photo = ? WHERE id = ?",
        [photoUri, customerId],
        (_, result) => resolve(result),
        (_, error) => reject(error),
      );
    });
  });
};

export const getOverdueTransactions = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT 
           t.*, 
           c.name as customer_name, 
           c.phone,
           CASE 
             WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount
             ELSE IFNULL(p.paid_amount, 0)
           END as paid_amount,
           CASE 
             WHEN (
               t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
             ) > 0 THEN (
               t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
             )
             ELSE 0
           END as balance
         FROM transactions t
         JOIN customers c ON t.customer_id = c.id
         LEFT JOIN (
           SELECT transaction_id, SUM(amount) as paid_amount
           FROM payments
           GROUP BY transaction_id
         ) p ON t.id = p.transaction_id
         WHERE (
           t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
         ) > 0
         AND date(COALESCE(t.due_date, date(t.date_borrowed, '+30 day'))) <= date('now')`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error),
      );
    });
  });
};

// For CSV Export
export const getAllDataForExport = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT 
          c.name, c.phone, c.email,
          t.item_name, t.amount, t.quantity, t.status,
          CASE 
            WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount
            ELSE IFNULL(p.paid_amount, 0)
          END as paid_amount,
          CASE 
            WHEN (
              t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
            ) > 0 THEN (
              t.amount - CASE WHEN t.status = 'paid' AND p.paid_amount IS NULL THEN t.amount ELSE IFNULL(p.paid_amount, 0) END
            )
            ELSE 0
          END as balance,
          t.due_date, t.date_borrowed, t.date_paid, t.notes
         FROM customers c
         LEFT JOIN transactions t ON c.id = t.customer_id
         LEFT JOIN (
           SELECT transaction_id, SUM(amount) as paid_amount
           FROM payments
           GROUP BY transaction_id
         ) p ON t.id = p.transaction_id
         ORDER BY c.name, t.date_borrowed`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error),
      );
    });
  });
};

export default db;
