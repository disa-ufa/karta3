<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AuthModal from './AuthModal.vue'
import { API_BASE } from '@/apiBase'

const LAYER_GROUPS = [
  {
    label: 'Министерство просвещения Р.Б.',
    key: 'min_prosvesh',
    children: [
      { key: 'layer1_1', label: 'Муниципальные ОО' },
      { key: 'layer1_2', label: 'Коррекционные ОО' },
      { key: 'layer1_3', label: 'ПМПК' }
    ]
  },
  { key: 'layer2', label: 'Министерство спорта Р.Б.' },
  { key: 'layer3', label: 'Министерство культуры Р.Б.' },
  { key: 'layer4', label: 'Министерство здравоохранения Р.Б.' },
  { key: 'layer5', label: 'Министерство семьи, труда и социальной защиты населения Р.Б.' }
]
const MINISTRIES = [
  'Министерство просвещения Р.Б.',
  'Министерство спорта Р.Б.',
  'Министерство культуры Р.Б.',
  'Министерство здравоохранения Р.Б.',
  'Министерство семьи, труда и социальной защиты населения Р.Б.'
]
const ageGroupsOptions = ['0-18', '18+']

const props = defineProps({
  visibleLayers: { type: Object, required: true },
  ageGroups: { type: [Array, Object], default: () => [] },
  accessibility: { type: [Array, Object], default: () => [] },
  allAgeGroups: { type: Array, required: true },
  allOrganizations: { type: Array, default: () => [] },
  svo: { type: [Array, Object], default: () => [] }
})

const emit = defineEmits([
  'update:ageGroups',
  'update:accessibility',
  'update:svo',
  'search',
  'selectOrg',
  'collapse'
])

/* ---------- фильтры ---------- */
const localAgeGroups = ref([...props.ageGroups])
const localAccessibilityEnabled = ref(props.accessibility.includes('Да'))
const svoEnabled = ref(!!(props.svo && props.svo.includes('Да')))

watch(() => props.ageGroups, val => { localAgeGroups.value = [...val] })
watch(() => props.accessibility, val => { localAccessibilityEnabled.value = val.includes('Да') })
watch(() => props.svo, val => { svoEnabled.value = !!(val && val.includes('Да')) })

function toggleLocalAgeGroup(val) {
  const arr = [...localAgeGroups.value]
  if (arr.includes(val)) { if (arr.length > 1) arr.splice(arr.indexOf(val), 1) }
  else { arr.push(val) }
  localAgeGroups.value = arr
}
const toggleAccessibility = () => { localAccessibilityEnabled.value = !localAccessibilityEnabled.value }
const toggleSvo = () => { svoEnabled.value = !svoEnabled.value }
function applyFilters() {
  if (localAgeGroups.value.length === 0) localAgeGroups.value = [...ageGroupsOptions]
  emit('update:ageGroups', localAgeGroups.value)
  emit('update:accessibility', localAccessibilityEnabled.value ? ['Да'] : [])
  emit('update:svo', svoEnabled.value ? ['Да'] : [])
}
function resetFilters() {
  localAgeGroups.value = [...ageGroupsOptions]
  localAccessibilityEnabled.value = false
  svoEnabled.value = false
  applyFilters()
}
const hasChanges = computed(() => {
  const originalAge = [...props.ageGroups].sort().join(',')
  const localAge = [...localAgeGroups.value].sort().join(',')
  const originalAcc = props.accessibility.includes('Да')
  const localAcc = localAccessibilityEnabled.value
  const originalSvo = (props.svo || []).includes('Да')
  const localSvoVal = svoEnabled.value
  return originalAge !== localAge || originalAcc !== localAcc || originalSvo !== localSvoVal
})

/* ---------- авторизация ---------- */
const router = useRouter()

const token = ref('')
const userEmail = ref('')
const userType = ref('')
const isLoggedIn = computed(() => !!token.value)

function loadUser() {
  token.value = localStorage.getItem('user_token') || localStorage.getItem('token') || ''
  userEmail.value = localStorage.getItem('user_email') || ''
  userType.value = localStorage.getItem('auth_type') || localStorage.getItem('user_type') || ''
}
onMounted(loadUser)

const showAuthModal = ref(false)
const isLoginTab = ref(true)
const authError = ref('')
const authLoading = ref(false)

const openAuth = () => { showAuthModal.value = true; isLoginTab.value = true }
const closeAuth = () => { showAuthModal.value = false; authError.value = '' }

async function handleLogin({ email, password }) {
  authLoading.value = true
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    if (!response.ok) {
      authError.value = data?.error || 'Ошибка входа'
    } else {
      localStorage.setItem('user_token', data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('auth_type', data.type || '')
      localStorage.setItem('user_type', data.type || '')
      localStorage.setItem('user_email', email)
      if (data.ministry) localStorage.setItem('user_ministry', data.ministry)
      else localStorage.removeItem('user_ministry')

      loadUser()
      showAuthModal.value = false
      authError.value = ''

      if (data.type === 'ministry-admin') router.push('/ministry-admin-profile')
      else router.push('/profile')
    }
  } catch {
    authError.value = 'Ошибка соединения с сервером'
  } finally {
    authLoading.value = false
  }
}
const handleRegister = () => { showAuthModal.value = false }
const switchAuthTab = (val) => { isLoginTab.value = val; authError.value = '' }

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user_token')
  localStorage.removeItem('auth_type')
  localStorage.removeItem('user_type')
  localStorage.removeItem('user_email')
  localStorage.removeItem('user_ministry')
  loadUser()
  router.push('/')
}
function goToProfile() {
  if (userType.value === 'ministry-admin') router.push('/ministry-admin-profile')
  else router.push('/profile')
}

/* ---------- поиск ---------- */
const searchInput = ref('')
const showDropdown = ref(false)
const searchResults = computed(() => {
  if (!searchInput.value.trim()) return []
  const query = searchInput.value.trim().toLowerCase()
  return props.allOrganizations
    .filter(org =>
      (org.name || '').toLowerCase().includes(query) ||
      (org.address || '').toLowerCase().includes(query)
    )
    .slice(0, 12)
})
function handleSearchInput(e) {
  searchInput.value = e.target.value
  emit('search', searchInput.value)
  showDropdown.value = !!searchInput.value.trim()
}
function clearSearch() { searchInput.value = ''; emit('search', ''); showDropdown.value = false }
function onFocusSearch() { if (searchInput.value.trim()) showDropdown.value = true }
function selectOrgFromDropdown(org) {
  emit('selectOrg', org)
  showDropdown.value = false
  searchInput.value = org.name
}

/* ---------- чекбоксы ведомства ---------- */
const LAYER1_KEYS = ['layer1_1', 'layer1_2', 'layer1_3']
const allLayer1Checked = computed(() => LAYER1_KEYS.every(key => props.visibleLayers[key]))
const someLayer1Checked = computed(() => LAYER1_KEYS.some(key => props.visibleLayers[key]))
function toggleAllLayer1(e) {
  const val = e.target.checked
  LAYER1_KEYS.forEach(key => { props.visibleLayers[key] = val })
}
</script>

<template>
  <transition name="fade">
    <div class="panel" v-show="true">
      <button class="collapse-btn" @click="$emit('collapse')" title="Свернуть панель">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M13 5l-6 5 6 5" stroke="#666" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <template v-if="!isLoggedIn">
        <button class="reset-btn auth-link" @click="openAuth">Вход / Регистрация</button>
      </template>
      <template v-else>
        <div class="profile-bar-minimal">
          <button class="profile-icon-btn" @click="goToProfile" title="Личный кабинет">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8.25" r="4.25" stroke="#23222B" stroke-width="2"/>
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="#23222B" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="logout-icon-btn" @click="logout" title="Выйти">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M17 16l4-4-4-4" stroke="#23222B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12H9" stroke="#23222B" stroke-width="2" stroke-linecap="round"/>
              <path d="M15 4v2a4 4 0 0 1-4 4H9" stroke="#23222B" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </template>

      <!-- Поиск -->
      <div class="search-bar" @click.stop>
        <input
          class="search-input"
          type="text"
          :placeholder="'Поиск и выбор мест'"
          v-model="searchInput"
          @input="handleSearchInput"
          @focus="onFocusSearch"
          @keydown.esc="showDropdown=false"
        />
        <span class="search-icon">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="10" cy="10" r="7" stroke="#3a3a3a" stroke-width="2"/>
            <rect x="15" y="15" width="5" height="2" rx="1" transform="rotate(45 15 15)" fill="#3a3a3a"/>
          </svg>
        </span>
        <span class="search-clear" v-if="searchInput" @click="clearSearch">&#10005;</span>
        <div v-if="showDropdown && searchResults.length" class="search-dropdown">
          <div
            v-for="org in searchResults"
            :key="org.id"
            class="search-item"
            @mousedown.prevent="selectOrgFromDropdown(org)"
          >
            <span class="search-item-title">{{ org.name }}</span>
            <span class="search-item-address">{{ org.address }}</span>
          </div>
        </div>
      </div>

      <!-- Ведомства -->
      <div class="panel-section">
        <div class="section-title">Ведомства</div>
        <div class="checkbox-row parent-checkbox">
          <input
            type="checkbox"
            :checked="allLayer1Checked"
            :indeterminate.prop="someLayer1Checked && !allLayer1Checked"
            @change="toggleAllLayer1"
            id="min-prosvesh"
          />
          <label for="min-prosvesh">Министерство просвещения Р.Б.</label>
        </div>
        <div class="checkbox-children">
          <label v-for="child in LAYER_GROUPS[0].children" :key="child.key" class="checkbox-row child-checkbox">
            <input type="checkbox" v-model="visibleLayers[child.key]" />
            {{ child.label }}
          </label>
        </div>
        <label v-for="group in LAYER_GROUPS.slice(1)" :key="group.key" class="checkbox-row">
          <input type="checkbox" v-model="visibleLayers[group.key]" />
          {{ group.label }}
        </label>
      </div>

      <hr class="panel-divider" />

      <!-- Фильтры -->
      <div class="panel-section">
        <div class="panel-header">
          <span class="panel-title">Фильтры</span>
          <button class="reset-btn" @click="resetFilters">Сбросить</button>
        </div>

        <div class="section-title">Возрастная группа</div>
        <div class="age-checkbox-row">
          <label v-for="val in props.allAgeGroups" :key="val" class="checkbox-inline">
            <input
              type="checkbox"
              :value="val"
              :checked="localAgeGroups.includes(val)"
              :disabled="localAgeGroups.length === 1 && localAgeGroups[0] === val"
              @change="toggleLocalAgeGroup(val)"
            />
            {{ val }}
          </label>
        </div>
      </div>

      <div class="panel-section">
        <br />
        <div class="section-title">Доступная среда</div>
        <button @click="toggleAccessibility" :class="['accessibility-btn', { selected: localAccessibilityEnabled }]" type="button">
          Да
        </button>
      </div>

      <div class="panel-section">
        <br />
        <div class="section-title">Участник СВО</div>
        <button @click="toggleSvo" :class="['svo-btn', { selected: svoEnabled }]" type="button">
          Да
        </button>
      </div>

      <div class="actions">
        <button class="btn-apply" :class="{ disabled: !hasChanges }" :disabled="!hasChanges" @click="applyFilters">
          Применить
        </button>
      </div>

      <AuthModal
        :show="showAuthModal"
        :isLogin="isLoginTab"
        :ministries="MINISTRIES"
        :loading="authLoading"
        :error="authError"
        @close="closeAuth"
        @login="handleLogin"
        @register="handleRegister"
        @switchTab="switchAuthTab"
        @logged-in="() => { loadUser(); closeAuth() }"
      />
    </div>
  </transition>
</template>

<style scoped>
/* стили как были */
.svo-btn{border:1.5px solid #a1aeb8;border-radius:8px;padding:5px 16px;background:#f5f6fa;color:#333;font-size:15px;cursor:pointer;margin-top:6px;outline:none;transition:background .15s,border-color .15s,color .15s}
.svo-btn.selected{background:#e5ffe6;color:#36c900;border-color:#36c900;font-weight:bold}
.profile-bar-minimal{display:flex;align-items:center;gap:5px;margin-bottom:14px}
.profile-icon-btn,.logout-icon-btn{background:none;border:none;padding:3px 4px;border-radius:8px;cursor:pointer;display:flex;align-items:center;transition:background .14s}
.profile-icon-btn:hover{background:#eaf2ff}.logout-icon-btn:hover{background:#ffeaea}
.profile-icon-btn svg,.logout-icon-btn svg{display:block}
.panel{position:absolute;top:20px;left:20px;width:320px;background:#fff;border-radius:16px;box-shadow:0 4px 24px 0 rgba(51,61,81,.07);padding:22px 20px 20px;font-family:'Segoe UI','Arial',sans-serif;z-index:20;border:1px solid #e5e5e5;transition:all .3s ease-in-out}
.fade-enter-active,.fade-leave-active{transition:opacity .25s}.fade-enter-from,.fade-leave-to{opacity:0}
.collapse-btn{position:absolute;top:12px;right:12px;background:#fff;border-radius:9px;border:1px solid #ddd;width:36px;height:36px;z-index:2001;box-shadow:0 2px 12px #0001;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
.collapse-btn:hover{background:#f3f6ff}
.parent-checkbox{font-weight:600;margin-bottom:4px}
.child-checkbox{margin-left:22px;font-weight:400}
.checkbox-children{margin-bottom:5px}
input[type="checkbox"]:indeterminate{accent-color:#a5a5a5!important}
.section-title{font-weight:500;font-size:15px;margin-bottom:4px}
.checkbox-row{display:block;margin-bottom:3px;font-size:15px}
.age-checkbox-row{display:flex;gap:16px}
.checkbox-inline{display:flex;align-items:center;gap:5px;font-size:15px}
.accessibility-btn{border:1.5px solid #a1aeb8;border-radius:8px;padding:5px 16px;background:#f5f6fa;color:#333;font-size:15px;cursor:pointer;margin-top:6px;outline:none;transition:background .15s,border-color .15s,color .15s}
.accessibility-btn.selected{background:#e5ffe6;color:#36c900;border-color:#36c900;font-weight:bold}
.panel-divider{border:none;border-top:1px solid #eaeaea;margin:12px 0}
.actions{margin-top:16px;display:flex;justify-content:space-between}
.btn-apply{padding:8px 16px;font-size:15px;cursor:pointer;border-radius:8px;border:none;background-color:#36c900;color:white;opacity:1;transition:opacity .2s,background .15s}
.btn-apply.disabled,.btn-apply:disabled{background-color:#e5e5e5!important;color:#aaa!important;cursor:not-allowed;opacity:1}
.search-bar{position:relative;display:flex;align-items:center;background:#fafbfc;border-radius:22px;padding:0 14px;margin:16px;height:44px;box-shadow:0 2px 8px 0 #24252912}
.search-input{border:none;outline:none;background:transparent;font-size:16px;flex:1;height:40px;padding-left:0}
.search-icon{display:flex;align-items:center;justify-content:center;margin-left:8px;margin-right:2px;cursor:pointer}
.search-clear{cursor:pointer;font-size:18px;color:#bbb;margin-left:3px}
.search-clear:hover{color:#ff3b3b}
.search-dropdown{position:absolute;left:0;top:44px;background:#fff;border-radius:13px;box-shadow:0 2px 12px rgba(0,0,0,.09);width:100%;z-index:30;max-height:520px;overflow-y:auto}
.search-item{padding:9px 14px;cursor:pointer;border-bottom:1px solid #f1f1f1}
.search-item:last-child{border-bottom:none}
.search-item:hover{background:#f4f9fd}
.search-item-title{font-weight:500;display:block;color:#222;font-size:15px}
.search-item-address{display:block;font-size:13px;color:#888}
.panel-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.panel-title{font-weight:600;font-size:18px}
.reset-btn{font-size:14px;background:none;border:none;color:#999;cursor:pointer;transition:color .18s;margin-left:8px;padding:0}
.reset-btn:hover{color:#36c900;text-decoration:underline}
</style>
