import type { AppData, CustomerOrder, DebtRecord, Product, SalesSession } from '../types/domain'
import { dateKey, lineTotal, uid } from '../utils/format'

export class SalesService {
  createSession(sessions: SalesSession[], totalPigs: number, averageWeightKg: number): SalesSession {
    const prefix = dateKey()
    const next = sessions.filter(s => s.name.startsWith(prefix)).length + 1
    return { id: uid(), name: `${prefix}_${next}`, openedAt: new Date().toISOString(), status: 'OPEN', orders: [], totalPigs, averageWeightKg }
  }

  addCustomer(session: SalesSession, customer: { id: string; name: string; photo?: string }) {
    if (session.status !== 'OPEN') throw new Error('รายการนี้ปิดแล้ว')
    if (session.orders.some(o => o.customerId === customer.id)) throw new Error('ลูกค้ารายนี้อยู่ในรายการแล้ว')
    session.orders.push({ id: uid(), customerId: customer.id, customerName: customer.name, customerPhoto: customer.photo, closed: false, lines: [] })
  }

  removeCustomer(session: SalesSession, orderId: string) {
    const order = session.orders.find(item => item.id === orderId)
    if (!order) throw new Error('ไม่พบรายการลูกค้า')
    if (order.closed) throw new Error('ลบลูกค้าที่ปิดการขายแล้วไม่ได้')
    session.orders = session.orders.filter(item => item.id !== orderId)
  }

  addLine(order: CustomerOrder, product: Product, price: number, quantity: number) {
    if (order.closed) throw new Error('ปิดการขายลูกค้ารายนี้แล้ว')
    if (quantity < 0 || !Number.isFinite(quantity)) throw new Error('จำนวนสินค้าต้องไม่ติดลบ')
    order.lines.push({ id: uid(), productId: product.id, productName: product.name, productImage: product.image, quantity, pricePerKg: price, total: lineTotal(quantity, price) })
  }

  closeOrder(data: AppData, session: SalesSession, order: CustomerOrder) {
    if (!order.lines.length) throw new Error('ยังไม่มีสินค้าในรายการ')
    if (order.lines.some(line => line.quantity <= 0)) throw new Error('กรุณาระบุจำนวนสินค้าให้ครบทุกรายการก่อนปิดการขาย')
    if (order.closed) return
    order.closed = true
    const amount = order.lines.reduce((sum, line) => sum + line.total, 0)
    data.debts.push({
      id: uid(), createdAt: new Date().toISOString(), customerId: order.customerId,
      customerName: order.customerName, sessionId: session.id, sessionName: session.name,
      amount, type: 'DEBT',
    })
  }

  reopenOrder(data: AppData, session: SalesSession, order: CustomerOrder) {
    if (!order.closed) throw new Error('รายการของลูกค้ารายนี้ยังเปิดอยู่')
    const debtIndex = data.debts.findLastIndex(record =>
      record.type === 'DEBT' && record.sessionId === session.id && record.customerId === order.customerId,
    )
    if (debtIndex < 0) throw new Error('ไม่พบรายการหนี้ที่เกี่ยวข้อง จึงเปิดแก้ไขการขายไม่ได้')
    data.debts.splice(debtIndex, 1)
    order.closed = false
  }

  closeSession(session: SalesSession) {
    if (session.orders.some(o => !o.closed)) throw new Error('กรุณาปิดการขายของลูกค้าทุกรายก่อน')
    if (!session.orders.length) throw new Error('ยังไม่มีลูกค้าในรายการ')
    session.status = 'CLOSED'
    session.closedAt = new Date().toISOString()
  }

  payment(data: AppData, customer: { id: string; name: string }, amount: number, note?: string): DebtRecord {
    if (amount <= 0) throw new Error('ยอดชำระต้องมากกว่า 0 บาท')
    const record = { id: uid(), createdAt: new Date().toISOString(), customerId: customer.id, customerName: customer.name, amount: -amount, type: 'PAYMENT' as const, note }
    data.debts.push(record)
    return record
  }
}
export const salesService = new SalesService()
