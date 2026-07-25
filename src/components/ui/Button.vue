<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  disabled: false,
  type: 'button'
})

const classes = computed(() => [
  'btn',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  { 'btn-full': props.fullWidth, 'btn-disabled': props.disabled }
])
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  min-height: 36px;
  padding: 8px 12px;
  font-size: 14px;
}

.btn-md {
  min-height: 44px;
  padding: 10px 16px;
  font-size: 15px;
}

.btn-lg {
  min-height: 52px;
  padding: 12px 20px;
  font-size: 16px;
}

.btn-xl {
  min-height: 64px;
  padding: 16px 24px;
  font-size: 18px;
}

.btn-primary {
  color: #fff;
  background: var(--brand);
}

.btn-primary:hover:not(:disabled) {
  background: var(--brand-2);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  color: var(--brand);
  background: var(--soft);
  border: 1px solid var(--line);
}

.btn-secondary:hover:not(:disabled) {
  background: #d0e9d7;
  border-color: var(--brand);
}

.btn-danger {
  color: #fff;
  background: var(--danger);
}

.btn-danger:hover:not(:disabled) {
  background: #a02e2e;
  transform: translateY(-1px);
}

.btn-ghost {
  color: var(--ink);
  background: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--soft);
}

.btn-danger-outline {
  color: var(--danger);
  background: #fce8e8;
  border: 1px solid #f5d0d0;
}

.btn-danger-outline:hover:not(:disabled) {
  background: #f5d0d0;
}

.btn-full {
  width: 100%;
}
</style>
