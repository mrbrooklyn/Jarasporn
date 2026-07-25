<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAppStore } from './stores/app'
const store = useAppStore()
const dark = ref(localStorage.getItem('theme') === 'dark')
onMounted(() => { document.documentElement.classList.toggle('dark', dark.value); store.init() })
function toggleTheme() { dark.value = !dark.value; localStorage.setItem('theme', dark.value ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', dark.value) }
</script>
<template>
  <main v-if="store.ready" class="app-shell">
    <header class="topbar"><RouterLink to="/" class="brand">🐷 จรัสพรหมูสด</RouterLink><button class="theme-toggle" :aria-label="dark ? 'ใช้โหมดสว่าง' : 'ใช้โหมดมืด'" @click="toggleTheme">{{ dark ? '☼' : '☾' }}</button></header>
    <RouterView />
    <nav class="bottom-nav">
      <RouterLink to="/">หน้าแรก</RouterLink>
      <RouterLink to="/sales">ขาย</RouterLink>
      <RouterLink to="/manage/customers">ลูกค้า</RouterLink>
      <RouterLink to="/reports">รายงาน</RouterLink>
    </nav>
  </main>
  <div v-else class="loading">กำลังเปิดข้อมูล...</div>
</template>