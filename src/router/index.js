import { createRouter, createWebHistory } from 'vue-router'
import YandexMap from '../components/YandexMap.vue'
import Profile from '../components/Profile.vue'
import MinistryAdminProfile from '@/components/MinistryAdminProfile.vue'
import AdminPanel from '../components/AdminPanel.vue' // добавь этот импорт

const routes = [
  { path: '/', component: YandexMap },
  { path: '/profile', component: Profile },
  { path: '/ministry-admin-profile', component: MinistryAdminProfile },
  { path: '/admin', component: AdminPanel } // новый роут
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
