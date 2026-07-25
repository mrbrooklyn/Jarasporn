import { Capacitor } from '@capacitor/core'
import type { AppData } from '../../types/domain'
import { database } from '../database'

const KEY = 'pork-shop-data-v1'
const empty = (): AppData => ({ categories: [], products: [], customers: [], specialPrices: [], sessions: [], debts: [] })

/**
 * The store only calls this repository. On Android it persists the serialized
 * aggregate in SQLite; browser development uses localStorage as a safe fallback.
 * Individual relational tables are created by migrations for reporting/query expansion.
 */
export class AppRepository {
  async initialize(): Promise<AppData> {
    if (!Capacitor.isNativePlatform()) return this.browserRead()
    const db = await database.open()
    await db!.execute('CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL)')
    const result = await db!.query('SELECT payload FROM app_state WHERE id = 1')
    if (!result.values?.[0]?.payload) return empty()
    return JSON.parse(String(result.values[0].payload)) as AppData
  }

  async save(data: AppData) {
    const payload = JSON.stringify(data)
    localStorage.setItem(KEY, payload)
    if (!Capacitor.isNativePlatform()) return
    await database.transaction([{
      statement: 'INSERT OR REPLACE INTO app_state (id, payload, updated_at) VALUES (1, ?, ?)',
      values: [payload, new Date().toISOString()],
    }])
  }

  async export(): Promise<string> {
    return JSON.stringify(await this.initialize(), null, 2)
  }

  async restore(json: string) {
    const data = JSON.parse(json) as AppData
    if (!data.categories || !data.products || !data.customers || !data.sessions || !data.debts) throw new Error('ไฟล์สำรองข้อมูลไม่ถูกต้อง')
    await this.save(data)
  }

  private browserRead(): AppData {
    try { return JSON.parse(localStorage.getItem(KEY) || '') as AppData } catch { return empty() }
  }
}
export const appRepository = new AppRepository()
