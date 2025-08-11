<script setup>
defineProps({ text: String })
</script>
<template>
  <div class="modal-error">{{ text }}</div>
</template>
<style scoped>
.modal-error { color: #f33; font-size: 15px; margin: 14px 0; text-align: center; }
</style>
