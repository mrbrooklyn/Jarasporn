<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  duration: 3000
})

const visible = ref(false)
let timer: number | null = null

onMounted(() => {
  visible.value = true
  timer = window.setTimeout(() => {
    visible.value = false
  }, props.duration)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="`toast-${type}`">
      <div class="toast-content">
        <slot>{{ message }}</slot>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 100;
  min-width: 280px;
  max-width: 400px;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #d0e9d7;
  color: #0d5a2e;
  border: 1px solid #a5d6a7;
}

.toast-error {
  background: #ffcdd2;
  color: #a02e2e;
  border: 1px solid #ef9a9a;
}

.toast-info {
  background: #bbdefb;
  color: #1565c0;
  border: 1px solid #90caf9;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
