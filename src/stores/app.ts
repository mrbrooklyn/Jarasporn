import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { appRepository } from '../data/repositories/AppRepository'
import { salesService } from '../services/SalesService'
import type { AppData, Category, Customer, Product, SpecialPrice } from '../types/domain'
import { lineTotal, uid } from '../utils/format'

export const useAppStore = defineStore('app', () => {
  const ready = ref(false)
  const data = ref<AppData>(awaitableEmpty())
  const activeSession = computed(() => data.value.sessions.find(s => s.status === 'OPEN'))
  const outstanding = (customerId: string) => data.value.debts.filter(d => d.customerId === customerId).reduce((sum, d) => sum + d.amount, 0)

  async function init() {
    data.value = await appRepository.initialize()
    // Compatible with backups made before daily stock tracking was introduced.
    data.value.sessions.forEach(session => {
      session.totalPigs ??= 0
      session.averageWeightKg ??= 0
    })
    data.value.customers.forEach((customer, index) => { customer.displayOrder ??= index + 1 })
    ready.value = true
  }
  async function persist() { await appRepository.save(data.value) }
  async function mutate(action: () => void) { action(); await persist() }
  async function createSession(totalPigs: number, averageWeightKg: number) { await mutate(() => {
    if (activeSession.value) throw new Error('มีรายการขายที่เปิดอยู่แล้ว')
    if (!Number.isInteger(totalPigs) || totalPigs <= 0) throw new Error('กรุณาระบุจำนวนหมูเป็นจำนวนเต็มที่มากกว่า 0')
    if (!Number.isFinite(averageWeightKg) || averageWeightKg <= 0) throw new Error('กรุณาระบุน้ำหนักเฉลี่ยที่มากกว่า 0 กิโลกรัม')
    data.value.sessions.unshift(salesService.createSession(data.value.sessions, totalPigs, averageWeightKg))
  }) }
  async function saveCategory(payload: Omit<Category, 'id'>, id?: string) { await mutate(() => {
    if (!payload.name.trim()) throw new Error('กรุณาระบุชื่อหมวดหมู่')
    if (data.value.categories.some(c => c.name === payload.name && c.id !== id && !c.deletedAt)) throw new Error('มีหมวดหมู่นี้อยู่แล้ว')
    const old = data.value.categories.find(c => c.id === id); old ? Object.assign(old, payload) : data.value.categories.push({ ...payload, id: uid() })
  }) }
  async function deleteCategory(id: string) { await mutate(() => {
    if (data.value.products.some(p => p.categoryId === id && !p.deletedAt)) throw new Error('ลบไม่ได้ เพราะมีสินค้าอ้างอิงหมวดหมู่นี้อยู่')
    const item = data.value.categories.find(c => c.id === id); if (item) item.deletedAt = new Date().toISOString()
  }) }
  async function saveProduct(payload: Omit<Product, 'id'>, id?: string) { await mutate(() => {
    if (!payload.name.trim() || payload.defaultPrice < 0 || !payload.categoryId) throw new Error('กรุณากรอกข้อมูลสินค้าให้ครบถ้วน')
    const old = data.value.products.find(p => p.id === id); old ? Object.assign(old, payload) : data.value.products.push({ ...payload, id: uid() })
  }) }
  async function deleteProduct(id: string) { await mutate(() => { const item = data.value.products.find(p => p.id === id); if (item) item.deletedAt = new Date().toISOString() }) }
  async function saveCustomer(payload: Omit<Customer, 'id'>, id?: string) { await mutate(() => {
    if (!payload.name.trim()) throw new Error('กรุณาระบุชื่อลูกค้า')
    const old = data.value.customers.find(c => c.id === id); old ? Object.assign(old, payload) : data.value.customers.push({ ...payload, id: uid() })
  }) }
  async function deleteCustomer(id: string) { await mutate(() => { const item = data.value.customers.find(c => c.id === id); if (item) item.deletedAt = new Date().toISOString() }) }
  async function toggleCustomerFavorite(id: string) { await mutate(() => { const item = data.value.customers.find(customer => customer.id === id); if (!item) throw new Error('ไม่พบลูกค้า'); item.favorite = !item.favorite }) }
  async function setSpecialPrice(price: SpecialPrice) { await mutate(() => { const old = data.value.specialPrices.find(p => p.customerId === price.customerId && p.productId === price.productId); old ? old.price = price.price : data.value.specialPrices.push(price) }) }
  const priceFor = (customerId: string, product: Product) => data.value.specialPrices.find(p => p.customerId === customerId && p.productId === product.id)?.price ?? product.defaultPrice
  async function addCustomer(customerId: string) { await mutate(() => { const c = data.value.customers.find(x => x.id === customerId); if (!activeSession.value || !c) throw new Error('ไม่พบรายการขายหรือลูกค้า'); salesService.addCustomer(activeSession.value, c) }) }
  async function removeCustomerFromSession(orderId: string) { await mutate(() => { if (!activeSession.value) throw new Error('ไม่พบรายการขาย'); salesService.removeCustomer(activeSession.value, orderId) }) }
  async function addLine(orderId: string, productId: string, quantity = 0) { await mutate(() => { const s = activeSession.value; const o = s?.orders.find(x => x.id === orderId); const p = data.value.products.find(x => x.id === productId); if (!s || !o || !p) throw new Error('ไม่พบข้อมูล'); salesService.addLine(o, p, priceFor(o.customerId, p), quantity) }) }
  async function updateLine(orderId: string, lineId: string, patch: Partial<{ quantity: number; pricePerKg: number; notes: string }>) { await mutate(() => { const line = activeSession.value?.orders.find(o => o.id === orderId)?.lines.find(l => l.id === lineId); if (!line) return; if (patch.quantity !== undefined && (!Number.isFinite(patch.quantity) || patch.quantity < 0)) throw new Error('จำนวนสินค้าต้องไม่ติดลบ'); if (patch.pricePerKg !== undefined && (!Number.isFinite(patch.pricePerKg) || patch.pricePerKg < 0)) throw new Error('ราคาต้องไม่ติดลบ'); Object.assign(line, patch); line.total = lineTotal(line.quantity, line.pricePerKg) }) }
  async function removeLine(orderId: string, lineId: string) { await mutate(() => { const order = activeSession.value?.orders.find(o => o.id === orderId); if (order && !order.closed) order.lines = order.lines.filter(l => l.id !== lineId) }) }
  async function closeOrder(orderId: string) { await mutate(() => { const s = activeSession.value; const o = s?.orders.find(x => x.id === orderId); if (!s || !o) throw new Error('ไม่พบรายการ'); salesService.closeOrder(data.value, s, o) }) }
  async function reopenOrder(orderId: string) { await mutate(() => { const s = activeSession.value; const o = s?.orders.find(x => x.id === orderId); if (!s || !o) throw new Error('ไม่พบรายการ'); salesService.reopenOrder(data.value, s, o) }) }
  async function closeSession() { await mutate(() => { if (!activeSession.value) return; salesService.closeSession(activeSession.value) }) }
  async function cancelActiveSession() { await mutate(() => {
    const session = activeSession.value
    if (!session) throw new Error('ไม่พบรายการขายที่เปิดอยู่')
    data.value.debts = data.value.debts.filter(debt => debt.sessionId !== session.id)
    data.value.sessions = data.value.sessions.filter(item => item.id !== session.id)
  }) }
  async function pay(customerId: string, amount: number, note?: string) { await mutate(() => { const c = data.value.customers.find(x => x.id === customerId); if (!c) throw new Error('ไม่พบลูกค้า'); salesService.payment(data.value, c, amount, note) }) }
  async function adjustDebt(customerId: string, type: 'DEBT' | 'PAYMENT', amount: number, note?: string) { await mutate(() => { const customer = data.value.customers.find(item => item.id === customerId); if (!customer) throw new Error('ไม่พบลูกค้า'); salesService.adjustDebt(data.value, customer, type, amount, note) }) }
  async function resetSalesData() { await mutate(() => {
    data.value.sessions = []
    data.value.debts = []
  }) }
  async function restore(json: string) { await appRepository.restore(json); data.value = await appRepository.initialize() }
  return { ready, data, activeSession, outstanding, init, createSession, saveCategory, deleteCategory, saveProduct, deleteProduct, saveCustomer, deleteCustomer, toggleCustomerFavorite, setSpecialPrice, priceFor, addCustomer, removeCustomerFromSession, addLine, removeLine, updateLine, closeOrder, reopenOrder, closeSession, cancelActiveSession, pay, adjustDebt, resetSalesData, persist, restore }
})
function awaitableEmpty() { return { categories: [], products: [], customers: [], specialPrices: [], sessions: [], debts: [] } }
