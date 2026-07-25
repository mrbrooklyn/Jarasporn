<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
  variant: 'danger'
})

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const isLoading = ref(false)

async function handleConfirm() {
  isLoading.value = true
  emit('confirm')
  isLoading.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <div class="dialog">
          <header class="dialog-header">
            <h2>{{ title }}</h2>
            <button class="icon-btn" @click="emit('close')" aria-label="ปิด">
              <Icon name="X" :size="20" />
            </button>
          </header>
          <p class="dialog-description">{{ message }}</p>
          <div class="dialog-actions">
            <Button variant="ghost" @click="emit('close')" :disabled="isLoading">
              {{ cancelText }}
            </Button>
            <Button :variant="variant" @click="handleConfirm" :disabled="isLoading">
              <Loading v-if="isLoading" size="sm" />
              <span v-else>{{ confirmText }}</span>
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'
import Button from './Button.vue'
import Loading from './Loading.vue'
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 16px;
}

.dialog {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  background: var(--card);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--muted);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--soft);
  color: var(--ink);
}

.dialog-description {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog,
.dialog-leave-to .dialog {
  transform: scale(0.95);
}
</style>
