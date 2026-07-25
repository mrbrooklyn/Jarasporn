<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'number' | 'tel' | 'email' | 'password' | 'search'
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
  min?: number
  max?: number
  step?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputClasses = computed(() => [
  'input',
  { 'input-error': props.error }
])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <input
      :type="type"
      :class="inputClasses"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      @input="handleInput"
    >
    <span v-if="error" class="input-error-text">{{ error }}</span>
  </div>
</template>

<style scoped>
.input-wrapper {
  width: 100%;
}

.input-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.input-required {
  color: var(--danger);
}

.input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(18, 107, 59, 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--danger);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(185, 53, 53, 0.1);
}

.input-error-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--danger);
}
</style>
