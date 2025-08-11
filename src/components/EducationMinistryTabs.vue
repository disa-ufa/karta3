<template>
  <div class="edu-tabs">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="error" class="tab-error"><b>Ошибка:</b> {{ error }}</div>

    <!-- Прогресс загрузки -->
    <div class="tab-content" v-if="loading">
      <LoadingBar />
    </div>

    <!-- Контент вкладок -->
    <div class="tab-content" v-else-if="activeTab === 'municipal'">
      <OrganizationTable
        v-model:columnWidths="tableProps.columnWidths"
        :organizations="municipalFiltered"
        :profileOptions="tableProps.profileOptions"
        :serviceOptions="tableProps.serviceOptions"
        :specialistOptions="tableProps.specialistOptions"
        :ageOptions="tableProps.ageOptions"
        :isOrgChanged="isOrgChanged"
        :pageSize="30"
        @saveOrg="saveOrg"
      />
    </div>

    <div class="tab-content" v-else-if="activeTab === 'correctional'">
      <OrganizationTable
        v-model:columnWidths="tableProps.columnWidths"
        :organizations="correctionalFiltered"
        :profileOptions="tableProps.profileOptions"
        :serviceOptions="tableProps.serviceOptions"
        :specialistOptions="tableProps.specialistOptions"
        :ageOptions="tableProps.ageOptions"
        :isOrgChanged="isOrgChanged"
        :pageSize="30"
        @saveOrg="saveOrg"
      />
    </div>

    <div class="tab-content" v-else-if="activeTab === 'pmpk'">
      <OrganizationTable
        v-model:columnWidths="tableProps.columnWidths"
        :organizations="pmpkFiltered"
        :profileOptions="tableProps.profileOptions"
        :serviceOptions="tableProps.serviceOptions"
        :specialistOptions="tableProps.specialistOptions"
        :ageOptions="tableProps.ageOptions"
        :isOrgChanged="isOrgChanged"
        :pageSize="30"
        @saveOrg="saveOrg"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import OrganizationTable from './AdminProfile/OrganizationTable.vue'
import LoadingBar from './AdminProfile/LoadingBar.vue'

const props = defineProps({ search: { type: String, default: '' } })
const emit = defineEmits(['count'])

/* ----- таблица ----- */
const tableProps = reactive({
  columnWidths: [48, 250, 250, 210, 160, 150, 150, 80, 80, 80, 220, 400, 350, 100],
  profileOptions: [],
  serviceOptions: [],
  specialistOptions: [],
  ageOptions: [],
})

/* ----- состояние ----- */
const municipalOrgs = ref([])
const correctionalOrgs = ref([])
const pmpkOrgs = ref([])
const loading = ref(true)
const error = ref('')

/* ----- вкладки ----- */
const tabs = [
  { key: 'municipal',    label: 'Муниципальные ОО' },
  { key: 'correctional', label: 'Коррекционные ОО' },
  { key: 'pmpk',         label: 'ПМПК' },
]
const activeTab = ref('municipal')

/* ----- утилиты нормализации ----- */
const toArr = (v) =>
  Array.isArray(v) ? v :
  (typeof v === 'string' ? v.split(/[,;|\n]+/).map(s => s.trim()).filter(Boolean) : [])

const N = (s) => (s ?? '').toString().replace(/\s+/g, ' ').trim().toLowerCase()

const parseCoords = (input) => {
  if (Array.isArray(input)) return input
  const s = (input ?? '').toString()
  const nums = s.match(/-?\d+(?:\.\d+)?/g)
  if (!nums || nums.length < 2) return []
  return [parseFloat(nums[0]), parseFloat(nums[1])]
}

function getToken() {
  // пробуем несколько ключей — вдруг логин писал в другой
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('ministry_token') ||
    localStorage.getItem('ministryToken') ||
    ''
  )
}
const authHeaders = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function normalizeOrg(org) {
  // coords -> строка
  const coords = (() => {
    const c = org.coords
    if (Array.isArray(c)) return c.filter(v => v != null).join(', ')
    if (c && typeof c === 'object') {
      const lat = c.lat ?? c.latitude ?? c[0]
      const lon = c.lng ?? c.lon ?? c.long ?? c.longitude ?? c[1]
      return (lat != null && lon != null) ? `${lat}, ${lon}` : ''
    }
    return (c ?? '').toString()
  })()

  // Нормализуем в 'да' | 'нет'
  const svo = N(org.svo) === 'да' ? 'да' : 'нет'
  const accessibility = N(org.accessibility) === 'да' ? 'да' : 'нет'

  return {
    ...org,
    id: org._id || org.id || Math.random().toString(36).slice(2),
    coords,
    ageGroups: org.ageGroups || [],
    profile: toArr(org.profile),
    services: toArr(org.services),
    specialists: toArr(org.specialists),
    svo,
    accessibility,
  }
}

function bucketKey(org) {
  const vals = toArr(org.podvedomstva ?? org.podvedomstvo).map(N).join('|')
  if (/пмпк/.test(vals)) return 'pmpk'
  if (/коррекц|специальн/.test(vals)) return 'correctional'
  if (/муницип/.test(vals)) return 'municipal'
  return 'unknown'
}

/* ----- фильтрация по поиску ----- */
function filterBySearch(list) {
  const q = props.search.trim().toLowerCase()
  if (!q) return list
  return list.filter(org => {
    const fields = [
      org.id, org.name, org.full_name, org.address, org.coords, org.phone, org.website,
      (org.ageGroups || []).join(','), org.svo, org.accessibility,
      (org.profile || []).join(','), (org.services || []).join(','), (org.specialists || []).join(','),
    ].map(x => (x ?? '').toString().toLowerCase())
    return fields.some(v => v.includes(q))
  })
}
const municipalFiltered    = computed(() => filterBySearch(municipalOrgs.value))
const correctionalFiltered = computed(() => filterBySearch(correctionalOrgs.value))
const pmpkFiltered         = computed(() => filterBySearch(pmpkOrgs.value))

/* ----- счётчик для шапки ----- */
const activeCount = computed(() => {
  switch (activeTab.value) {
    case 'municipal':    return municipalFiltered.value.length
    case 'correctional': return correctionalFiltered.value.length
    case 'pmpk':         return pmpkFiltered.value.length
    default:             return 0
  }
})
watch([activeTab, municipalFiltered, correctionalFiltered, pmpkFiltered], () => {
  emit('count', activeCount.value)
}, { immediate: true })

/* ----- change detection и save ----- */
const origFP = ref({}) // id -> fingerprint

const comparable = (org) => ({
  name: N(org.name),
  full_name: N(org.full_name),
  address: N(org.address),
  coords: N(org.coords),
  phone: N(org.phone),
  website: N(org.website),
  ageGroups: toArr(org.ageGroups).map(N).sort(),
  svo: N(org.svo),
  accessibility: N(org.accessibility),
  profile: toArr(org.profile).map(N).sort(),
  services: toArr(org.services).map(N).sort(),
  specialists: toArr(org.specialists).map(N).sort(),
})

const fp = (o) => JSON.stringify(o)
const setOrigFingerprint = (org) => { origFP.value[org.id] = fp(comparable(org)) }

function isOrgChanged(_idx, org) {
  const orig = origFP.value[org.id]
  if (orig == null) return false
  return fp(comparable(org)) !== orig
}

async function saveOrg(org) {
  const token = getToken()
  if (!token) {
    alert('Вы не авторизованы как ведомственный администратор. Войдите через /api/login и сохраните токен в localStorage (ключ "token").')
    return
  }

  try {
    const id = org._id || org.id
    if (!id) throw new Error('Нет ID организации')

    const payload = {
      name: org.name ?? '',
      full_name: org.full_name ?? '',
      address: org.address ?? '',
      coords: parseCoords(org.coords),
      phone: org.phone ?? '',
      website: org.website ?? '',
      ageGroups: toArr(org.ageGroups),
      svo: N(org.svo) === 'да' ? 'да' : 'нет',
      accessibility: N(org.accessibility) === 'да' ? 'да' : 'нет',
      profile: toArr(org.profile),
      services: toArr(org.services),
      specialists: toArr(org.specialists),
      department: org.department,
      podvedomstva: org.podvedomstva ?? org.podvedomstvo,
    }

    const res = await fetch(`/api/ministry-admin/organization/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${t || res.statusText}`)
    }

    setOrigFingerprint(org) // успех — погасить кнопку
  } catch (e) {
    alert('Не удалось сохранить: ' + (e.message || e))
  }
}

/* ----- загрузка ----- */
async function loadAllForMinistry() {
  loading.value = true
  error.value = ''
  try {
    const department = 'Министерство просвещения Р.Б.'
    const url = `/api/organizations?department=${encodeURIComponent(department)}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
    const data = await resp.json()
    const normalized = data.map(normalizeOrg)

    normalized.forEach(setOrigFingerprint)

    municipalOrgs.value    = normalized.filter(org => bucketKey(org) === 'municipal')
    correctionalOrgs.value = normalized.filter(org => bucketKey(org) === 'correctional')
    pmpkOrgs.value         = normalized.filter(org => bucketKey(org) === 'pmpk')
  } catch (e) {
    error.value = `Ошибка загрузки организаций: ${e.message || e}`
    municipalOrgs.value = correctionalOrgs.value = pmpkOrgs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadAllForMinistry)
</script>

<style scoped>
.edu-tabs { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }
.tabs { display: flex; gap: 4px; margin-bottom: 14px; flex: none; }
.tab-btn {
  padding: 7px 22px; background: #eaf2fa; border: 1px solid #b2cbe9; border-bottom: none;
  border-radius: 7px 7px 0 0; font-size: 16px; cursor: pointer; transition: background 0.15s;
}
.tab-btn.active { background: #fff; border-bottom: 2px solid #fff; font-weight: bold; color: #2474ca; }
.tab-content {
  display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;
  border: 1px solid #b2cbe9; border-radius: 0 0 8px 8px; background: #fff; padding-top: 8px;
}
.tab-error { color: #c00; padding: 8px 0; font-size: 16px; font-weight: bold; flex: none; }
</style>
