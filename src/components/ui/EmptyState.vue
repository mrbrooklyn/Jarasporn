<script setup lang="ts">
import Icon from './Icon.vue'
import Button from './Button.vue'

interface Props {
  icon?: string
  title: string
  description?: string
  actionText?: string
}

defineProps<Props>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-icon">
      <Icon :name="icon" :size="48" />
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <Button v-if="actionText" variant="primary" @click="emit('action')">
      {{ actionText }}
    </Button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  color: var(--muted);
  background: var(--soft);
  border-radius: 50%;
}

.empty-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}

.empty-description {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--muted);
  max-width: 280px;
}
</style>
