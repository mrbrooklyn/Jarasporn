<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SalesSession } from '../types/domain'
import { useAppStore } from '../stores/app'
import { dateThai, money, thaiQuantity } from '../utils/format'
import BaseDialog from '../components/BaseDialog.vue'
import Icon from '../components/ui/Icon.vue'

const store = useAppStore()
const selected = ref<SalesSession>()
const sessions = computed(() => store.data.sessions.filter(session => session.status === 'CLOSED').sort((a, b) => b.openedAt.localeCompare(a.openedAt)))
function total(session: SalesSession) { return session.orders.flatMap(order => order.lines).reduce((sum, line) => sum + line.total, 0) }
function quantity(session: SalesSession) { return session.orders.flatMap(order => order.lines).reduce((sum, line) => sum + line.quantity, 0) }
function printReceipt() { window.print() }
</script>
<template>
  <section class="page">
    <p class="eyebrow">รายการที่ปิดแล้ว</p><h1>ประวัติการขาย</h1>
    <button v-for="session in sessions" :key="session.id" class="history-card" @click="selected = session"><div><strong>{{ session.name }}</strong><small>{{ dateThai(session.openedAt) }} · {{ session.orders.length }} ลูกค้า · {{ thaiQuantity(quantity(session)) }}</small></div><div class="history-total"><strong>{{ money(total(session)) }}</strong><small><Icon name="ArrowRight" :size="16" /> ดูรายละเอียด</small></div></button>
    <div v-if="!sessions.length" class="empty">ยังไม่มีประวัติการขายที่ปิดแล้ว</div>
    <BaseDialog :title="`รายละเอียด ${selected?.name ?? ''}`" :open="Boolean(selected)" @close="selected = undefined">
      <div v-if="selected" class="history-detail"><p class="dialog-description">{{ dateThai(selected.openedAt) }}</p><div v-if="selected.totalPigs" class="history-stock">หมู {{ selected.totalPigs }} ตัว · น้ำหนักเฉลี่ย {{ selected.averageWeightKg }} กก.</div><section v-for="order in selected.orders" :key="order.id" class="history-order"><div class="title-row"><strong>{{ order.customerName }}</strong><strong>{{ money(order.lines.reduce((sum, line) => sum + line.total, 0)) }}</strong></div><article v-for="line in order.lines" :key="line.id" class="line"><div><strong>{{ line.productName }}</strong><small>{{ thaiQuantity(line.quantity) }} × {{ money(line.pricePerKg) }}<template v-if="line.notes"> · {{ line.notes }}</template></small></div><strong>{{ money(line.total) }}</strong></article></section><div class="history-grand-total"><span>รวมทั้งรายการ</span><strong>{{ money(total(selected)) }}</strong></div><button class="secondary wide" @click="printReceipt"><Icon name="Printer" :size="18" /> พิมพ์ / บันทึก PDF</button></div>
    </BaseDialog>
  </section>
</template>
