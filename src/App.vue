<template>
  <router-view />

  <div style="position: fixed; bottom: 8px; right: 16px; opacity: 0.5;">
  
</div>

  <!-- Модалка или оверлей для админки -->
  <div v-if="showAdmin" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background:#fff; z-index:1000;">
    <button style="float:right; margin:8px;" @click="showAdmin = false">Закрыть</button>
    <AdminPanel />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminPanel from './components/AdminPanel.vue'
const showAdmin = ref(false)
</script>
