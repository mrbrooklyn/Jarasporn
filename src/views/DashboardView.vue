<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { money } from '../utils/format'
import BaseDialog from '../components/BaseDialog.vue'
import Icon from '../components/ui/Icon.vue'
const store = useAppStore(); const router = useRouter()
const todayTotal = computed(() => store.data.sessions.filter(s => s.openedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).flatMap(s => s.orders).flatMap(o => o.lines).reduce((sum, l) => sum + l.total, 0))
const opening = ref(false)
const resetDialogOpen = ref(false)
const resetPassword = ref('')
const totalPigs = ref<number | undefined>()
const averageWeightKg = ref<number | undefined>()
const estimatedWeight = computed(() => (totalPigs.value ?? 0) * (averageWeightKg.value ?? 0))
function start() { if (store.activeSession) return router.push('/sales'); opening.value = true }
async function confirmStart() {
  try {
    await store.createSession(totalPigs.value ?? 0, averageWeightKg.value ?? 0)
    opening.value = false
    router.push('/sales')
  } catch (e) { alert((e as Error).message) }
}
async function resetSalesData() {
  if (resetPassword.value !== import.meta.env.VITE_RESET_PASSWORD) {
    alert('รหัสผ่านไม่ถูกต้อง')
    return
  }
  try {
    await store.resetSalesData()
    resetPassword.value = ''
    resetDialogOpen.value = false
    alert('ล้างข้อมูลการขายสำหรับทดสอบเรียบร้อยแล้ว')
  } catch (error) { alert((error as Error).message) }
}
</script>
<template>
  <section class="page hero-page">
    <p class="eyebrow">ระบบขายและบัญชี • ใช้งานออฟไลน์</p><h1>พร้อมขายวันนี้</h1>
    <div class="stat-card"><span>ยอดขายวันนี้</span><strong>{{ money(todayTotal) }}</strong></div>
    <button class="primary giant" @click="start">
      <Icon v-if="!store.activeSession" name="Plus" :size="24" />
      <Icon v-else name="ArrowLeft" :size="24" />
      {{ store.activeSession ? 'กลับไปขาย ' + store.activeSession.name : 'เริ่มขายวันนี้' }}
    </button>
    <div class="grid-actions">
      <RouterLink to="/manage/products" class="action">
        <Icon name="Package" :size="32" />
        <span>สินค้า</span>
      </RouterLink>
      <RouterLink to="/manage/categories" class="action">
        <Icon name="Tag" :size="32" />
        <span>หมวดหมู่</span>
      </RouterLink>
      <RouterLink to="/manage/customers" class="action">
        <Icon name="Users" :size="32" />
        <span>ลูกค้า</span>
      </RouterLink>
      <RouterLink to="/reports" class="action">
        <Icon name="BarChart3" :size="32" />
        <span>สรุปยอด</span>
      </RouterLink>
      <RouterLink to="/sales/history" class="action">
        <Icon name="Clock" :size="32" />
        <span>ประวัติ</span>
      </RouterLink>
    </div>
    <button class="danger-outline wide reset-sales-button" @click="resetDialogOpen = true"><Icon name="RotateCcw" :size="18" /> รีเซ็ตข้อมูลขายทดสอบ</button>
    <BaseDialog title="เริ่มขายวันนี้" :open="opening" @close="opening = false">
      <p class="dialog-description">กรอกจำนวนหมูและน้ำหนักเฉลี่ยก่อนเริ่มขาย เพื่อใช้ติดตามสต็อกของวันนี้</p>
      <form @submit.prevent="confirmStart">
        <label>จำนวนหมูวันนี้ (ตัว)
          <input v-model.number="totalPigs" type="number" inputmode="numeric" min="1" step="1" placeholder="เช่น 12" required autofocus>
        </label>
        <label>น้ำหนักเฉลี่ยต่อตัว (กิโลกรัม)
          <input v-model.number="averageWeightKg" type="number" inputmode="decimal" min="0.1" step="0.1" placeholder="เช่น 85.5" required>
        </label>
        <div class="estimate" aria-live="polite"><span>น้ำหนักรวมโดยประมาณ</span><strong>{{ estimatedWeight.toLocaleString('th-TH', { maximumFractionDigits: 1 }) }} กก.</strong></div>
        <button class="primary wide">เริ่มขาย</button>
      </form>
    </BaseDialog>
    <BaseDialog title="รีเซ็ตข้อมูลขายทดสอบ" :open="resetDialogOpen" @close="resetDialogOpen = false">
      <p class="dialog-description">การดำเนินการนี้จะลบรายการขายและประวัติหนี้ทั้งหมด แต่จะเก็บสินค้า หมวดหมู่ และลูกค้าไว้</p>
      <form @submit.prevent="resetSalesData">
        <label>รหัสผ่านยืนยัน<input v-model="resetPassword" type="password" autocomplete="off" placeholder="กรอกรหัสผ่าน" required autofocus></label>
        <button class="danger wide"><Icon name="Trash2" :size="18" /> ยืนยันรีเซ็ตข้อมูลขาย</button>
      </form>
    </BaseDialog>
  </section>
</template>
