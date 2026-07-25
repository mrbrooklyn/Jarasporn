<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'stat' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  clickable: false
})

const classes = computed(() => [
  'card',
  `card-${props.variant}`,
  `card-padding-${props.padding}`,
  { 'card-clickable': props.clickable }
])
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<style scoped>
.card {
  border-radius: 16px;
  transition: all 0.2s ease;
}

.card-default {
  background: var(--card);
  border: 1px solid var(--line);
}

.card-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: clamp(18px, 5vw, 24px);
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  border-radius: 20px;
}

.card-stat strong {
  font-size: clamp(29px, 9vw, 39px);
}

.card-elevated {
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-padding-none {
  padding: 0;
}

.card-padding-sm {
  padding: 12px;
}

.card-padding-md {
  padding: 16px;
}

.card-padding-lg {
  padding: 24px;
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
</style>
