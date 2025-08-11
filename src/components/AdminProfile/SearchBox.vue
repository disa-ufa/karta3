<script setup>
const props = defineProps({
  modelValue: String,
  count: Number
})
const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div style="padding: 0 36px 5px 36px; display: flex; gap: 14px; align-items: center;">
    <input
      :value="modelValue"
      @input="e => emit('update:modelValue', e.target.value)"
      type="text"
      class="org-search"
      placeholder="Поиск по организациям..."
      style="margin-bottom: 6px; width: 340px; font-size: 16px; border-radius: 7px; border: 1.2px solid #c5e0e9; padding: 8px 15px;"
    >
    <span style="color:#888; font-size:14px;">Всего: {{ count }}</span>
  </div>
</template>
