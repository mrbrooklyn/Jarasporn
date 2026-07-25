<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'success' | 'danger' | 'warning'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md'
})

const classes = computed(() => [
  'badge',
  `badge-${props.variant}`,
  `badge-${props.size}`
])
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 99px;
}

.badge-sm {
  padding: 3px 8px;
  font-size: 11px;
}

.badge-md {
  padding: 4px 10px;
  font-size: 12px;
}

.badge-default {
  color: #14683c;
  background: #d0e9d7;
}

.badge-success {
  color: #0d5a2e;
  background: #c8e6c9;
}

.badge-danger {
  color: #a02e2e;
  background: #ffcdd2;
}

.badge-warning {
  color: #b76e00;
  background: #ffe0b2;
}
</style>
