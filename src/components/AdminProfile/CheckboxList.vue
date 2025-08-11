<script setup>
const props = defineProps({
  options: Array,
  selected: Array,
})
const emit = defineEmits(['toggle'])
</script>
<template>
  <div class="checkbox-list">
    <label v-for="opt in options" :key="opt">
      <input type="checkbox" :checked="selected.includes(opt)" @change="() => emit('toggle', opt)" />
      {{ opt }}
    </label>
  </div>
</template>
<style scoped>
.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 2px 4px;
}
.checkbox-list label {
  display: flex;
  align-items: center;
  font-size: 15px;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
</style>
