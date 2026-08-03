<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useAppStore } from '../stores/app'
import { money, thaiQuantity } from '../utils/format'
import { shareReceiptPdf } from '../utils/receipt'
import BaseDialog from '../components/BaseDialog.vue'
import Icon from '../components/ui/Icon.vue'

const store = useAppStore()
const session = computed(() => store.activeSession)
const activeOrderId = ref('')
const customerPicker = ref(false)
const productPicker = ref(false)
const openingSession = ref(false)
const search = ref('')
const selectedCategoryId = ref('')
const totalPigs = ref<number | undefined>()
const averageWeightKg = ref<number | undefined>()
const cancelHoldProgress = ref(0)
let cancelHoldTimer: ReturnType<typeof setTimeout> | undefined
let cancelProgressTimer: ReturnType<typeof setInterval> | undefined
const activeOrder = computed(() => session.value?.orders.find(order => order.id === activeOrderId.value) ?? session.value?.orders[0])
const allLines = computed(() => session.value?.orders.flatMap(order => order.lines.map(line => ({ ...line, customerName: order.customerName }))) ?? [])
const total = computed(() => allLines.value.reduce((sum, line) => sum + line.total, 0))
const totalQty = computed(() => allLines.value.reduce((sum, line) => sum + line.quantity, 0))
const estimatedWeight = computed(() => (totalPigs.value ?? 0) * (averageWeightKg.value ?? 0))
const productSummary = computed(() => {
  const summary = new Map<string, { quantity: number; count: number; customers: Set<string> }>()
  allLines.value.forEach(line => {
    const current = summary.get(line.productName) ?? { quantity: 0, count: 0, customers: new Set() }
    current.quantity += line.quantity
    current.count += 1
    current.customers.add(line.customerName)
    summary.set(line.productName, current)
  })
  return [...summary].sort(([a], [b]) => a.localeCompare(b, 'th'))
})
const estimatedStockKg = computed(() => session.value ? session.value.totalPigs * session.value.averageWeightKg : 0)
const remainingEstimateKg = computed(() => Math.max(0, estimatedStockKg.value - totalQty.value))
const availableCustomers = computed(() => store.data.customers.filter(customer => customer.active && !customer.deletedAt && customer.name.includes(search.value) && !session.value?.orders.some(order => order.customerId === customer.id)))
const availableProducts = computed(() => store.data.products.filter(product => product.active && !product.deletedAt && product.name.includes(search.value) && (!selectedCategoryId.value || product.categoryId === selectedCategoryId.value)))

async function call(fn: () => Promise<void>) { try { await fn() } catch (error) { alert((error as Error).message) } }
async function selectCustomer(id: string) { await call(() => store.addCustomer(id)); activeOrderId.value = session.value?.orders.at(-1)?.id ?? ''; customerPicker.value = false }
async function addProduct(id: string) { if (activeOrder.value) { await call(() => store.addLine(activeOrder.value!.id, id)); productPicker.value = false } }
function openProductPicker() { search.value = ''; selectedCategoryId.value = ''; productPicker.value = true }
function updateQuantity(lineId: string, event: Event) { const quantity = Number((event.target as HTMLInputElement).value); if (activeOrder.value) call(() => store.updateLine(activeOrder.value!.id, lineId, { quantity })) }
function updatePrice(lineId: string, event: Event) { const pricePerKg = Number((event.target as HTMLInputElement).value); if (activeOrder.value) call(() => store.updateLine(activeOrder.value!.id, lineId, { pricePerKg })) }
function confirmCloseOrder() { if (activeOrder.value && confirm('ยืนยันปิดการขาย? หลังจากนี้แก้ไขไม่ได้')) call(() => store.closeOrder(activeOrder.value!.id)) }
function confirmReopenOrder() { if (activeOrder.value && confirm('เปิดแก้ไขการขายอีกครั้ง? ระบบจะลบรายการหนี้ของลูกค้ารายนี้และอนุญาตให้แก้ไขสินค้าได้')) call(() => store.reopenOrder(activeOrder.value!.id)) }
function confirmCloseSession() { if (confirm('ยืนยันปิดรายการขายทั้งหมด?')) call(() => store.closeSession()) }
function confirmCancelSession() {
  if (confirm('ยืนยันยกเลิกรายการขายนี้? รายการลูกค้า สินค้า และยอดหนี้ที่สร้างจากรายการนี้จะถูกลบทั้งหมด')) {
    call(() => store.cancelActiveSession())
  }
}
function startCancelHold() {
  if (cancelHoldTimer) return
  const startedAt = Date.now()
  cancelHoldProgress.value = 0
  cancelProgressTimer = setInterval(() => {
    cancelHoldProgress.value = Math.min(100, ((Date.now() - startedAt) / 1200) * 100)
  }, 16)
  cancelHoldTimer = setTimeout(() => {
    clearCancelHold()
    confirmCancelSession()
  }, 1200)
}
function clearCancelHold() {
  if (cancelHoldTimer) clearTimeout(cancelHoldTimer)
  if (cancelProgressTimer) clearInterval(cancelProgressTimer)
  cancelHoldTimer = undefined
  cancelProgressTimer = undefined
  cancelHoldProgress.value = 0
}
onBeforeUnmount(clearCancelHold)
async function confirmRemoveCustomer(orderId: string, customerName: string) {
  if (!confirm(`ลบลูกค้า "${customerName}" และรายการสินค้าที่ยังไม่ปิดการขายทั้งหมดหรือไม่?`)) return
  try {
    await store.removeCustomerFromSession(orderId)
    if (activeOrderId.value === orderId) activeOrderId.value = session.value?.orders[0]?.id ?? ''
  } catch (error) { alert((error as Error).message) }
}
async function printReceipt() {
  if (!session.value || !activeOrder.value) return
  try { await shareReceiptPdf(session.value, activeOrder.value) } catch (error) { alert(`สร้างใบเสร็จไม่สำเร็จ: ${(error as Error).message}`) }
}
const selectedProduct = ref<string>()
const productDetails = computed(() => {
  if (!selectedProduct.value || !session.value) return null
  const lines = allLines.value.filter(line => line.productName === selectedProduct.value)
  const customerMap = new Map<string, { quantity: number; total: number }>()
  lines.forEach(line => {
    const current = customerMap.get(line.customerName) ?? { quantity: 0, total: 0 }
    current.quantity += line.quantity
    current.total += line.total
    customerMap.set(line.customerName, current)
  })
  return [...customerMap].map(([customer, data]) => ({ customer, quantity: data.quantity, total: data.total }))
})
function openSessionDialog() { openingSession.value = true }
function openProductDetails(productName: string) { selectedProduct.value = productName }
async function confirmStartSession() {
  try {
    await store.createSession(totalPigs.value ?? 0, averageWeightKg.value ?? 0)
    openingSession.value = false
  } catch (e) { alert((e as Error).message) }
}
</script>

<template>
  <section class="page">
    <template v-if="session">
      <div class="title-row"><div><p class="eyebrow">เปิดร้าน</p><h1>{{ session.name }}</h1></div><div class="list-actions"><button class="hold-cancel" :style="{ '--hold-progress': `${cancelHoldProgress}%` }" @pointerdown="startCancelHold" @pointerup="clearCancelHold" @pointerleave="clearCancelHold" @pointercancel="clearCancelHold" @contextmenu.prevent><Icon name="X" :size="18" />ยกเลิก</button><button class="danger" @click="confirmCloseSession">ปิดการขาย</button></div></div>
      <div class="sales-summary"><span>ลูกค้า {{ session.orders.length }} ราย</span><span>ขายแล้ว {{ thaiQuantity(totalQty) }}</span><strong>{{ money(total) }}</strong><small v-if="session.totalPigs">หมู {{ session.totalPigs }} ตัว × เฉลี่ย {{ session.averageWeightKg }} กก. · คงเหลือโดยประมาณ {{ thaiQuantity(remainingEstimateKg) }}</small></div>
      <section v-if="productSummary.length" class="product-summary-overview"><div class="title-row"><h2><Icon name="Package" :size="20" /> รายการทั้งหมด</h2><strong>{{ thaiQuantity(totalQty) }}</strong></div><div class="summary-grid"><div v-for="[name, summary] in productSummary" :key="name" class="summary-item clickable" @click="openProductDetails(name)"><span>{{ name }}</span><strong>{{ thaiQuantity(summary.quantity) }}</strong><small>{{ summary.count }} รายการ</small></div></div></section>
      <div class="tabs"><div v-for="order in session.orders" :key="order.id" class="customer-tab" :class="{ selected: activeOrder?.id === order.id }"><button class="customer-tab-select" @click="activeOrderId = order.id"><img v-if="order.customerPhoto" class="tab-customer-photo" :src="order.customerPhoto" :alt="order.customerName"><span v-else class="tab-customer-placeholder"><Icon name="User" :size="16" /></span><span>{{ order.customerName }} {{ order.closed ? '✓' : '' }}</span></button></div><button class="add-tab" @click="customerPicker = true"><Icon name="Plus" :size="20" /> ลูกค้า</button></div>
      <div v-if="activeOrder" class="order">
        <div class="title-row"><h2>{{ activeOrder.customerName }}</h2><span v-if="activeOrder.closed" class="badge">ปิดแล้ว</span></div>
        <div v-if="!activeOrder.lines.length" class="empty">ยังไม่มีสินค้า<br><button class="primary" @click="openProductPicker"><Icon name="Plus" :size="18" /> เพิ่มสินค้า</button></div>
        <article v-for="line in activeOrder.lines" :key="line.id" class="sale-line">
          <div class="sale-line-header">
            <div class="sale-item-info"><img v-if="line.productImage" class="sale-item-image" :src="line.productImage" :alt="line.productName"><div><strong>{{ line.productName }}</strong><small v-if="line.quantity">{{ thaiQuantity(line.quantity) }} × {{ money(line.pricePerKg) }}</small><small v-else class="required-text">กรุณาระบุจำนวน</small></div></div>
            <strong class="line-total">{{ money(line.total) }}</strong>
            <button v-if="!activeOrder.closed" class="icon" aria-label="ลบสินค้า" @click="call(() => store.removeLine(activeOrder!.id, line.id))"><Icon name="X" :size="18" /></button>
          </div>
          <div v-if="!activeOrder.closed" class="line-inputs">
            <label>จำนวน (กก.)<input :value="line.quantity || ''" type="number" inputmode="decimal" min="0" step=".1" placeholder="0.0" @change="updateQuantity(line.id, $event)"></label>
            <label>ราคา/กก.<input :value="line.pricePerKg" type="number" inputmode="decimal" min="0" step=".01" @change="updatePrice(line.id, $event)"></label>
          </div>
        </article>
        <button v-if="!activeOrder.closed" class="secondary wide add-item-button" @click="openProductPicker"><Icon name="Plus" :size="18" /> เพิ่มสินค้า</button><button v-if="!activeOrder.closed" class="primary wide" @click="confirmCloseOrder"><Icon name="Check" :size="18" /> ปิดการขาย {{ money(activeOrder.lines.reduce((sum, line) => sum + line.total, 0)) }}</button><button v-if="!activeOrder.closed" class="danger-outline wide" @click="confirmRemoveCustomer(activeOrder.id, activeOrder.customerName)"><Icon name="Trash2" :size="18" /> ลบลูกค้าออกจากรายการ</button><template v-else><button class="secondary wide" @click="confirmReopenOrder"><Icon name="RotateCcw" :size="18" /> เปิดแก้ไขการขาย</button><button class="secondary wide" @click="printReceipt"><Icon name="Printer" :size="18" /> พิมพ์ใบเสร็จ / บันทึก PDF</button></template>
      </div>
      <div v-else class="empty">กด “ลูกค้า” เพื่อเริ่มขาย</div>
    </template>
    <div v-else class="empty compact-empty">
      <h1>ยังไม่มีรายการขายที่เปิดอยู่</h1>
      <button class="primary giant" @click="openSessionDialog">
        <Icon name="Plus" :size="24" />
        เปิดรายการขายใหม่วันนี้
      </button>
      <RouterLink class="secondary" to="/">
        <Icon name="Home" :size="18" />
        กลับหน้าแรก
      </RouterLink>
    </div>
    <BaseDialog title="เลือกลูกค้า" :open="customerPicker" @close="customerPicker = false"><input v-model="search" placeholder="ค้นหาชื่อลูกค้า"><button v-for="customer in availableCustomers" :key="customer.id" class="picker-row customer-picker" @click="selectCustomer(customer.id)"><img v-if="customer.photo" class="customer-thumb" :src="customer.photo" :alt="customer.name"><span v-else class="customer-placeholder"><Icon name="User" :size="24" /></span><span>{{ customer.name }}<small>{{ customer.phone }}</small></span></button></BaseDialog>
    <BaseDialog title="เลือกสินค้า" :open="productPicker" @close="productPicker = false"><input v-model="search" placeholder="ค้นหาสินค้า"><div class="category-filters" aria-label="กรองตามหมวดหมู่"><button :class="{ selected: !selectedCategoryId }" @click="selectedCategoryId = ''">ทั้งหมด</button><button v-for="category in store.data.categories.filter(item => item.active && !item.deletedAt)" :key="category.id" :class="{ selected: selectedCategoryId === category.id }" @click="selectedCategoryId = category.id"><img v-if="category.image" class="category-thumb" :src="category.image" :alt="category.name"><span>{{ category.name }}</span></button></div><button v-for="product in availableProducts" :key="product.id" class="picker-row product-picker" @click="addProduct(product.id)"><img v-if="product.image" class="product-thumb" :src="product.image" :alt="product.name"><span>{{ product.name }}<small>{{ money(store.priceFor(activeOrder!.customerId, product)) }} / กก.</small></span></button><p v-if="!availableProducts.length" class="history-empty">ไม่พบสินค้าในหมวดหมู่นี้</p></BaseDialog>
    <BaseDialog :title="`รายละเอียด: ${selectedProduct}`" :open="Boolean(selectedProduct)" @close="selectedProduct = undefined">
      <div v-if="productDetails && productDetails.length" class="product-details-list">
        <p class="dialog-description">สินค้าชิ้นนี้ถูกขายให้ลูกค้าดังนี้:</p>
        <div v-for="detail in productDetails" :key="detail.customer" class="detail-item">
          <div class="detail-main"><strong>{{ detail.customer }}</strong><small>{{ thaiQuantity(detail.quantity) }}</small></div>
          <strong>{{ money(detail.total) }}</strong>
        </div>
      </div>
    </BaseDialog>
    <BaseDialog title="เริ่มขายวันนี้" :open="openingSession" @close="openingSession = false">
      <p class="dialog-description">กรอกจำนวนหมูและน้ำหนักเฉลี่ยก่อนเริ่มขาย เพื่อใช้ติดตามสต็อกของวันนี้</p>
      <form @submit.prevent="confirmStartSession">
        <label>จำนวนหมูวันนี้ (ตัว)
          <input v-model.number="totalPigs" type="number" inputmode="numeric" min="1" step="1" placeholder="เช่น 12" required autofocus>
        </label>
        <label>น้ำหนักเฉลี่ยต่อตัว (กิโลกรัม)
          <input v-model.number="averageWeightKg" type="number" inputmode="decimal" min="0.1" step="0.1" placeholder="เช่น 85.5" required>
        </label>
        <div class="estimate" aria-live="polite"><span>น้ำหนักรวมโดยประมาณ</span><strong>{{ estimatedWeight.toLocaleString('th-TH', { maximumFractionDigits: 1 }) }} กก.</strong></div>
        <div class="button-stack">
          <button type="button" class="secondary" @click="openingSession = false"><Icon name="X" :size="18" /> ยกเลิก</button>
          <button type="submit" class="primary"><Icon name="Check" :size="18" /> เริ่มขาย</button>
        </div>
      </form>
    </BaseDialog>
  </section>
</template>
