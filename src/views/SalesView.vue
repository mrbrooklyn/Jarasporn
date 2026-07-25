<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '../stores/app'
import { money, thaiQuantity } from '../utils/format'
import BaseDialog from '../components/BaseDialog.vue'
import Icon from '../components/ui/Icon.vue'

const store = useAppStore()
const session = computed(() => store.activeSession)
const activeOrderId = ref('')
const customerPicker = ref(false)
const productPicker = ref(false)
const search = ref('')
const selectedCategoryId = ref('')
const activeOrder = computed(() => session.value?.orders.find(order => order.id === activeOrderId.value) ?? session.value?.orders[0])
const allLines = computed(() => session.value?.orders.flatMap(order => order.lines) ?? [])
const total = computed(() => allLines.value.reduce((sum, line) => sum + line.total, 0))
const totalQty = computed(() => allLines.value.reduce((sum, line) => sum + line.quantity, 0))
const productSummary = computed(() => {
  const summary = new Map<string, { quantity: number; count: number }>()
  allLines.value.forEach(line => {
    const current = summary.get(line.productName) ?? { quantity: 0, count: 0 }
    summary.set(line.productName, { quantity: current.quantity + line.quantity, count: current.count + 1 })
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
async function confirmRemoveCustomer(orderId: string, customerName: string) {
  if (!confirm(`ลบลูกค้า "${customerName}" และรายการสินค้าที่ยังไม่ปิดการขายทั้งหมดหรือไม่?`)) return
  try {
    await store.removeCustomerFromSession(orderId)
    if (activeOrderId.value === orderId) activeOrderId.value = session.value?.orders[0]?.id ?? ''
  } catch (error) { alert((error as Error).message) }
}
function printReceipt() { window.print() }
</script>

<template>
  <section class="page">
    <template v-if="session">
      <div class="title-row"><div><p class="eyebrow">เปิดร้าน</p><h1>{{ session.name }}</h1></div><button class="danger" @click="confirmCloseSession">ปิดรายการ</button></div>
      <div class="sales-summary"><span>ลูกค้า {{ session.orders.length }} ราย</span><span>ขายแล้ว {{ thaiQuantity(totalQty) }}</span><strong>{{ money(total) }}</strong><small v-if="session.totalPigs">หมู {{ session.totalPigs }} ตัว × เฉลี่ย {{ session.averageWeightKg }} กก. · คงเหลือโดยประมาณ {{ thaiQuantity(remainingEstimateKg) }}</small></div>
      <section v-if="productSummary.length" class="product-summary"><div class="title-row"><h2>รายการทั้งหมด</h2><strong>{{ thaiQuantity(totalQty) }}</strong></div><div class="summary-grid"><div v-for="[name, summary] in productSummary" :key="name" class="summary-item"><span>{{ name }}</span><strong>{{ thaiQuantity(summary.quantity) }}</strong><small>{{ summary.count }} รายการ</small></div></div></section>
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
    <div v-else class="empty compact-empty"><h1>ยังไม่มีรายการขายที่เปิดอยู่</h1><RouterLink class="primary" to="/">เปิดรายการขายใหม่</RouterLink></div>
    <BaseDialog title="เลือกลูกค้า" :open="customerPicker" @close="customerPicker = false"><input v-model="search" placeholder="ค้นหาชื่อลูกค้า"><button v-for="customer in availableCustomers" :key="customer.id" class="picker-row customer-picker" @click="selectCustomer(customer.id)"><img v-if="customer.photo" class="customer-thumb" :src="customer.photo" :alt="customer.name"><span v-else class="customer-placeholder"><Icon name="User" :size="24" /></span><span>{{ customer.name }}<small>{{ customer.phone }}</small></span></button></BaseDialog>
    <BaseDialog title="เลือกสินค้า" :open="productPicker" @close="productPicker = false"><input v-model="search" placeholder="ค้นหาสินค้า"><div class="category-filters" aria-label="กรองตามหมวดหมู่"><button :class="{ selected: !selectedCategoryId }" @click="selectedCategoryId = ''">ทั้งหมด</button><button v-for="category in store.data.categories.filter(item => item.active && !item.deletedAt)" :key="category.id" :class="{ selected: selectedCategoryId === category.id }" @click="selectedCategoryId = category.id"><img v-if="category.image" class="category-thumb" :src="category.image" :alt="category.name"><span>{{ category.name }}</span></button></div><button v-for="product in availableProducts" :key="product.id" class="picker-row product-picker" @click="addProduct(product.id)"><img v-if="product.image" class="product-thumb" :src="product.image" :alt="product.name"><span>{{ product.name }}<small>{{ money(store.priceFor(activeOrder!.customerId, product)) }} / กก.</small></span></button><p v-if="!availableProducts.length" class="history-empty">ไม่พบสินค้าในหมวดหมู่นี้</p></BaseDialog>
  </section>
</template>
