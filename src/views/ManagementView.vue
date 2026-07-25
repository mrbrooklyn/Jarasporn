<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { money } from '../utils/format'
import BaseDialog from '../components/BaseDialog.vue'
import Icon from '../components/ui/Icon.vue'

const store = useAppStore()
const route = useRoute()
const kind = computed(() => String(route.params.kind))
const open = ref(false)
const editing = ref<string>()
const pricingCustomerId = ref<string>()
const pricingCategoryId = ref('')
const pricingSearch = ref('')
const form = reactive({ name: '', categoryId: '', image: '', defaultPrice: 0, phone: '', notes: '', active: true, displayOrder: 0 })
const title = computed(() => ({ products: 'สินค้า', categories: 'หมวดหมู่สินค้า', customers: 'ลูกค้า' }[kind.value] ?? 'จัดการข้อมูล'))
const items = computed(() => {
  const records = kind.value === 'products' ? store.data.products : kind.value === 'categories' ? store.data.categories : store.data.customers
  return records.filter(item => !item.deletedAt).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'th'))
})
const pricingCustomer = computed(() => store.data.customers.find(customer => customer.id === pricingCustomerId.value))
const activeProducts = computed(() => store.data.products.filter(product => product.active && !product.deletedAt))
const pricedProducts = computed(() => activeProducts.value.filter(product =>
  (!pricingCategoryId.value || product.categoryId === pricingCategoryId.value) &&
  product.name.includes(pricingSearch.value.trim()),
))

function edit(item?: any) {
  editing.value = item?.id
  Object.assign(form, { name: item?.name ?? '', categoryId: item?.categoryId ?? store.data.categories[0]?.id ?? '', image: item?.image ?? item?.photo ?? '', defaultPrice: item?.defaultPrice ?? 0, phone: item?.phone ?? '', notes: item?.notes ?? '', active: item?.active ?? true, displayOrder: item?.displayOrder ?? nextDisplayOrder() })
  open.value = true
}
async function save() {
  try {
    if (kind.value === 'products') await store.saveProduct({ name: form.name, categoryId: form.categoryId, image: form.image || undefined, defaultPrice: form.defaultPrice, displayOrder: form.displayOrder, active: form.active }, editing.value)
    else if (kind.value === 'categories') await store.saveCategory({ name: form.name, image: form.image || undefined, displayOrder: form.displayOrder, active: form.active }, editing.value)
    else await store.saveCustomer({ name: form.name, photo: form.image || undefined, phone: form.phone, notes: form.notes, displayOrder: form.displayOrder, active: form.active }, editing.value)
    open.value = false
  } catch (error) { alert((error as Error).message) }
}
async function remove(id: string) {
  if (!confirm('ยืนยันลบข้อมูลนี้?')) return
  try {
    if (kind.value === 'products') await store.deleteProduct(id)
    else if (kind.value === 'categories') await store.deleteCategory(id)
    else await store.deleteCustomer(id)
  } catch (error) { alert((error as Error).message) }
}
async function payment(item: { id: string; name: string }) {
  const value = prompt(`รับชำระเงินจาก ${item.name} (บาท)`)
  if (value) try { await store.pay(item.id, Number(value)) } catch (error) { alert((error as Error).message) }
}
function selectImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return alert('กรุณาเลือกไฟล์รูปภาพ')
  const reader = new FileReader()
  reader.onload = () => { form.image = String(reader.result) }
  reader.readAsDataURL(file)
}
function itemImage(item: { image?: string; photo?: string }) { return item.image ?? item.photo }
function itemSubtitle(item: { id: string; defaultPrice?: number; phone?: string }) {
  if (kind.value === 'products') return `${money(item.defaultPrice ?? 0)} / กก.`
  if (kind.value === 'customers') return `${item.phone || 'ไม่มีเบอร์โทร'} • ค้างชำระ ${money(store.outstanding(item.id))}`
  return ''
}
const imageLabel = computed(() => kind.value === 'products' ? 'รูปสินค้า' : kind.value === 'categories' ? 'รูปหมวดหมู่' : 'รูปลูกค้า')
function nextDisplayOrder() {
  const records = kind.value === 'products' ? store.data.products : kind.value === 'categories' ? store.data.categories : store.data.customers
  return Math.max(0, ...records.map(item => item.displayOrder ?? 0)) + 1
}
function openPricing(customerId: string) { pricingCustomerId.value = customerId; pricingCategoryId.value = ''; pricingSearch.value = '' }
function specialPrice(productId: string) {
  return store.data.specialPrices.find(item => item.customerId === pricingCustomerId.value && item.productId === productId)?.price
}
async function updateSpecialPrice(productId: string, event: Event) {
  if (!pricingCustomerId.value) return
  const value = (event.target as HTMLInputElement).value
  const price = Number(value)
  if (!value || !Number.isFinite(price) || price < 0) return
  try { await store.setSpecialPrice({ customerId: pricingCustomerId.value, productId, price }) } catch (error) { alert((error as Error).message) }
}
</script>

<template>
  <section class="page">
    <div class="title-row"><h1>{{ title }}</h1><button class="primary" @click="edit()"><Icon name="Plus" :size="18" /> เพิ่ม</button></div>
    <article v-for="item in items" :key="item.id" class="list-card" @click="edit(item)">
      <img v-if="itemImage(item)" class="product-thumb" :src="itemImage(item)" :alt="item.name">
      <div class="order-number">#{{ item.displayOrder }}</div><div class="list-main"><strong>{{ item.name }}</strong><small v-if="itemSubtitle(item)">{{ itemSubtitle(item) }}</small></div>
      <div class="list-actions"><button v-if="kind === 'customers'" class="secondary" @click.stop="openPricing(item.id)"><Icon name="Tag" :size="16" /> ตั้งราคา</button><button v-if="kind === 'customers'" class="secondary" @click.stop="payment(item)"><Icon name="Download" :size="16" /> รับชำระเงิน</button><button class="icon" @click.stop="remove(item.id)"><Icon name="Trash2" :size="18" /></button></div>
    </article>
    <div v-if="!items.length" class="empty">ยังไม่มี{{ title }}<br>กด “เพิ่ม” เพื่อเริ่มต้น</div>

    <BaseDialog :title="`${editing ? 'แก้ไข' : 'เพิ่ม'}${title}`" :open="open" @close="open = false">
      <form @submit.prevent="save">
        <label>ชื่อ<input v-model.trim="form.name" required></label>
        <template v-if="kind === 'products' || kind === 'categories' || kind === 'customers'">
          <label>{{ imageLabel }}<input type="file" accept="image/*" @change="selectImage"></label>
          <img v-if="form.image" class="product-preview" :src="form.image" :alt="`ตัวอย่าง${imageLabel}`"><button v-if="form.image" class="secondary" type="button" @click="form.image = ''"><Icon name="X" :size="16" /> ลบ{{ imageLabel }}</button>
        </template>
        <template v-if="kind === 'products'">
          <label>หมวดหมู่<select v-model="form.categoryId" required><option v-for="category in store.data.categories.filter(item => !item.deletedAt)" :key="category.id" :value="category.id">{{ category.name }}</option></select></label>
          <label>ราคา/กิโลกรัม<input v-model.number="form.defaultPrice" type="number" min="0" step=".01"></label>
        </template>
        <label v-if="kind === 'customers'">เบอร์โทร<input v-model="form.phone" inputmode="tel"></label><label v-if="kind === 'customers'">หมายเหตุ<textarea v-model="form.notes"/></label>
        <label>ลำดับแสดง<input v-model.number="form.displayOrder" type="number"></label><button class="primary wide">บันทึก</button>
      </form>
    </BaseDialog>

    <BaseDialog :title="`ตั้งราคาพิเศษ: ${pricingCustomer?.name ?? ''}`" :open="Boolean(pricingCustomer)" @close="pricingCustomerId = undefined">
      <p class="dialog-description">เว้นว่างไว้เพื่อใช้ราคาปกติของสินค้า ระบบจะบันทึกราคาพิเศษทันทีเมื่อกรอกตัวเลข</p>
      <input v-model.trim="pricingSearch" placeholder="ค้นหาสินค้า">
      <div class="category-filters" aria-label="กรองตามหมวดหมู่"><button :class="{ selected: !pricingCategoryId }" @click="pricingCategoryId = ''">ทั้งหมด</button><button v-for="category in store.data.categories.filter(item => item.active && !item.deletedAt)" :key="category.id" :class="{ selected: pricingCategoryId === category.id }" @click="pricingCategoryId = category.id"><img v-if="category.image" class="category-thumb" :src="category.image" :alt="category.name"><span>{{ category.name }}</span></button></div>
      <article v-for="product in pricedProducts" :key="product.id" class="price-row"><img v-if="product.image" class="product-thumb" :src="product.image" :alt="product.name"><div><strong>{{ product.name }}</strong><small>ราคาปกติ {{ money(product.defaultPrice) }} / กก.</small></div><label>ราคาพิเศษ<input :value="specialPrice(product.id) ?? ''" type="number" inputmode="decimal" min="0" step=".01" placeholder="ปกติ" @change="updateSpecialPrice(product.id, $event)"></label></article>
      <p v-if="!pricedProducts.length" class="history-empty">ไม่มีสินค้าในหมวดหมู่นี้</p>
    </BaseDialog>
  </section>
</template>
