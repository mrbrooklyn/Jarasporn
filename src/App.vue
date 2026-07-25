<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAppStore } from './stores/app'
import Icon from './components/ui/Icon.vue'
import Loading from './components/ui/Loading.vue'
const store = useAppStore()
const dark = ref(localStorage.getItem('theme') === 'dark')
onMounted(() => { document.documentElement.classList.toggle('dark', dark.value); store.init() })
function toggleTheme() { dark.value = !dark.value; localStorage.setItem('theme', dark.value ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', dark.value) }
</script>
<template>
  <main v-if="store.ready" class="app-shell">
    <header class="topbar">
      <RouterLink to="/" class="brand">
        <Icon name="PiggyBank" :size="24" />
        <span>จรัสพรหมูสด</span>
      </RouterLink>
      <button class="theme-toggle" :aria-label="dark ? 'ใช้โหมดสว่าง' : 'ใช้โหมดมืด'" @click="toggleTheme">
        <Icon :name="dark ? 'Sun' : 'Moon'" :size="20" />
      </button>
    </header>
    <RouterView />
    <nav class="bottom-nav">
      <RouterLink to="/">
        <Icon name="Home" :size="20" />
        <span>หน้าแรก</span>
      </RouterLink>
      <RouterLink to="/sales">
        <Icon name="ShoppingBasket" :size="20" />
        <span>ขาย</span>
      </RouterLink>
      <RouterLink to="/manage/customers">
        <Icon name="Users" :size="20" />
        <span>ลูกค้า</span>
      </RouterLink>
      <RouterLink to="/reports">
        <Icon name="BarChart3" :size="20" />
        <span>รายงาน</span>
      </RouterLink>
    </nav>
  </main>
  <div v-else class="loading">
    <Loading size="lg" text="กำลังเปิดข้อมูล..." />
  </div>
</template>