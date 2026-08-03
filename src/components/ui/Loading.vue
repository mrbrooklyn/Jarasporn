<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  text: ''
})
</script>

<template>
  <div class="loading-wrapper">
    <div class="spinner" :class="`spinner-${size}`">
      <div class="spinner-circle"></div>
    </div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<style scoped>
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner {
  position: relative;
}

.spinner-sm {
  width: 24px;
  height: 24px;
}

.spinner-md {
  width: 40px;
  height: 40px;
}

.spinner-lg {
  width: 56px;
  height: 56px;
}

.spinner-circle {
  width: 100%;
  height: 100%;
  border: 3px solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}
</style>
