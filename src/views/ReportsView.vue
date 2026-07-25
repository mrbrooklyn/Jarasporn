<script setup lang="ts">
import { computed } from 'vue'
import * as XLSX from 'xlsx'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useAppStore } from '../stores/app'
import { dateThai, money } from '../utils/format'
import Icon from '../components/ui/Icon.vue'
const store = useAppStore()
const closed = computed(() => store.data.sessions.filter(s => s.status === 'CLOSED'))
const lines = computed(() => closed.value.flatMap(s => s.orders.flatMap(o => o.lines.map(l => ({ session: s, order: o, ...l }))))))
const total = computed(() => lines.value.reduce((sum,l) => sum + l.total, 0))
function exportExcel() {
  const rows = lines.value.map(l => ({ 'เลขรายการ': l.session.name, 'วันที่': l.session.openedAt, 'ลูกค้า': l.order.customerName, 'สินค้า': l.productName, 'จำนวน (กก.)': l.quantity, 'ราคา/กก.': l.pricePerKg, 'รวม': l.total, 'ยอดบิล': l.order.lines.reduce((s,x)=>s+x.total,0), 'สถานะ': 'ค้างชำระ', 'ยอดคงค้าง': store.outstanding(l.order.customerId) }))
  const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'รายงานขาย'); XLSX.writeFile(wb, `รายงานขาย-${new Date().toISOString().slice(0,10)}.xlsx`)
}
async function backup() {
  const filename = `pork-shop-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const content = JSON.stringify(store.data, null, 2)
  try {
    if (Capacitor.isNativePlatform()) {
      const file = await Filesystem.writeFile({
        path: `PorkShopBackups/${filename}`,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      })
      await Share.share({
        title: 'สำรองข้อมูลร้านจรัสพรหมูสด',
        text: 'ไฟล์สำรองข้อมูลร้านจรัสพรหมูสด',
        files: [file.uri],
        dialogTitle: 'บันทึกหรือส่งไฟล์สำรองข้อมูล',
      })
      alert('สร้างไฟล์สำรองข้อมูลแล้ว')
      return
    }

    const blob = new Blob([content], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) {
    alert(`สำรองข้อมูลไม่สำเร็จ: ${(error as Error).message}`)
  }
}
async function restore(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || !confirm('ข้อมูลปัจจุบันจะถูกแทนที่ ยืนยันหรือไม่?')) return; try { await store.restore(await file.text()); alert('กู้คืนข้อมูลสำเร็จ') } catch (e) { alert((e as Error).message) } }
</script>
<template>
  <section class="page"><h1>สรุปยอดขาย</h1><div class="stat-card"><span>ยอดขายรวม</span><strong>{{ money(total) }}</strong><small>{{ lines.reduce((s,l)=>s+l.quantity,0).toFixed(1) }} กิโลกรัม • {{ closed.length }} รายการ</small></div>
    <div class="button-stack" style="margin-top: 1rem;"><button class="primary" @click="exportExcel"><Icon name="Download" :size="18" /> ส่งออก Excel</button><button class="secondary" @click="backup"><Icon name="Upload" :size="18" /> สำรองข้อมูล</button><label class="secondary upload"><Icon name="FileText" :size="18" /> กู้คืนข้อมูล<input type="file" accept=".json" @change="restore"></label></div>
    <h2>ประวัติหนี้</h2><article v-for="debt in store.data.debts" class="list-card"><div><strong :class="debt.amount > 0 ? 'debt' : 'payment'">{{ debt.amount > 0 ? '+' : '' }}{{ money(debt.amount) }}</strong><small>{{ debt.type === 'DEBT' ? 'เพิ่มหนี้' : debt.type === 'PAYMENT' ? 'รับชำระเงิน' : 'ปรับยอด' }} • {{ debt.customerName }}</small><small v-if="debt.sessionName">อ้างอิง {{ debt.sessionName }}</small></div><small>{{ dateThai(debt.createdAt) }}</small></article>
    <h2>รายการขายที่ปิดแล้ว</h2><article v-for="s in closed" class="list-card"><div><strong>{{ s.name }}</strong><small>{{ s.orders.length }} ลูกค้า • {{ s.orders.flatMap(o=>o.lines).length }} รายการ</small></div><strong>{{ money(s.orders.flatMap(o=>o.lines).reduce((a,l)=>a+l.total,0)) }}</strong></article>
  </section>
</template>
