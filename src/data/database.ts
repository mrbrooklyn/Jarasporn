import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'

const DB_NAME = 'pork_shop'
const schema = `
CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, image TEXT, display_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, category_id TEXT NOT NULL, image TEXT, default_price REAL NOT NULL, display_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, deleted_at TEXT, FOREIGN KEY(category_id) REFERENCES categories(id));
CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, photo TEXT, phone TEXT, notes TEXT, credit_limit REAL, display_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, deleted_at TEXT);
CREATE TABLE IF NOT EXISTS customer_prices (customer_id TEXT, product_id TEXT, price REAL NOT NULL, PRIMARY KEY(customer_id, product_id));
CREATE TABLE IF NOT EXISTS sales_sessions (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, opened_at TEXT NOT NULL, closed_at TEXT, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sales_orders (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, customer_id TEXT NOT NULL, customer_name_snapshot TEXT NOT NULL, customer_photo_snapshot TEXT, closed INTEGER NOT NULL DEFAULT 0, invoice_total REAL NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sales_lines (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, product_name_snapshot TEXT NOT NULL, quantity REAL NOT NULL, price_per_kg REAL NOT NULL, line_total REAL NOT NULL, notes TEXT);
CREATE TABLE IF NOT EXISTS debt_history (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, customer_id TEXT NOT NULL, customer_name_snapshot TEXT NOT NULL, session_id TEXT, session_name_snapshot TEXT, amount REAL NOT NULL, type TEXT NOT NULL, note TEXT);
CREATE INDEX IF NOT EXISTS idx_debt_customer_created ON debt_history(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_session ON sales_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_lines_order ON sales_lines(order_id);
`

class Database {
  private connection?: SQLiteDBConnection
  private transactionQueue: Promise<void> = Promise.resolve()
  async open() {
    if (this.connection) return this.connection
    if (!Capacitor.isNativePlatform()) return undefined
    const sqlite = new SQLiteConnection(CapacitorSQLite)
    this.connection = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
    await this.connection.open()
    await this.connection.execute(schema)
    return this.connection
  }
  async transaction(statements: { statement: string; values?: unknown[] }[]) {
    const operation = this.transactionQueue.then(async () => {
      const db = await this.open()
      if (!db) return

      // Clear a transaction left behind by older app versions before writing.
      if (await db.isTransactionActive()) {
        await db.rollbackTransaction()
      }

      await db.executeTransaction(statements)
    })

    // Keep subsequent writes running even if the current write fails.
    this.transactionQueue = operation.catch(() => undefined)
    return operation
  }
}
export const database = new Database()
export { schema }
