export type SessionStatus = 'OPEN' | 'CLOSED'
export type DebtType = 'DEBT' | 'PAYMENT' | 'ADJUSTMENT'

export interface Category { id: string; name: string; image?: string; displayOrder: number; active: boolean; deletedAt?: string }
export interface Product { id: string; name: string; categoryId: string; image?: string; defaultPrice: number; displayOrder: number; active: boolean; deletedAt?: string }
export interface Customer { id: string; name: string; photo?: string; phone?: string; notes?: string; displayOrder: number; active: boolean; deletedAt?: string }
export interface SpecialPrice { customerId: string; productId: string; price: number }
export interface SaleLine {
  id: string; productId: string; productName: string; productImage?: string; quantity: number; pricePerKg: number; total: number; notes?: string
}
export interface CustomerOrder {
  id: string; customerId: string; customerName: string; customerPhoto?: string; closed: boolean; lines: SaleLine[]
}
export interface SalesSession {
  id: string; name: string; openedAt: string; closedAt?: string; status: SessionStatus; orders: CustomerOrder[]
  totalPigs: number; averageWeightKg: number
}
export interface DebtRecord {
  id: string; createdAt: string; customerId: string; customerName: string; sessionId?: string; sessionName?: string
  amount: number; type: DebtType; note?: string
}
export interface AppData {
  categories: Category[]; products: Product[]; customers: Customer[]; specialPrices: SpecialPrice[]
  sessions: SalesSession[]; debts: DebtRecord[]
}
