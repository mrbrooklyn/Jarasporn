<script setup lang="ts">
defineProps<{ title: string; open: boolean }>()
defineEmits<{ close: [] }>()
</script>
<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="$emit('close')">
      <section class="dialog"><header><h2>{{ title }}</h2><button class="icon" @click="$emit('close')">×</button></header><slot /></section>
    </div>
  </Teleport>
</template>
