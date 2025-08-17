<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/apiBase'

import OrganizationTable from './AdminProfile/OrganizationTable.vue'
import SearchBox from './AdminProfile/SearchBox.vue'
import ErrorBar from './AdminProfile/ErrorBar.vue'
import LoadingBar from './AdminProfile/LoadingBar.vue'
import EducationMinistryTabs from './EducationMinistryTabs.vue'

function ensureYMaps() {
  if (typeof window === 'undefined' || window.ymaps) return
  const key = import.meta.env.VITE_YA_GEOCODER_KEY || '9dda63a0-a400-4fa1-bed5-024c6ad2056d'
  const s = document.createElement('script')
  s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(key)}&lang=ru_RU`
  s.async = true
  document.head.appendChild(s)
}

const AGE_OPTIONS = ['0-18', '18+']

const PROFILE_OPTIONS = [
  'Инклюзивное образование',
  'Лица с интеллектуальными нарушениями',
  'Лица с нарушениями зрения',
  'Лица с нарушениями слуха',
  'Лица с нарушениями опорно-двигательного аппарата',
  'Лица с задержкой психического развития',
  'Лица с нарушениями функций дыхательной системыя',
  'Лица с расстройством аутистического спектра',
  'Лица с синдромом Дауна',
  'Лица с тяжелым нарушением речи',
]

const SERVICE_OPTIONS = {
  'Министерство культуры Р.Б.': [
    'Арт-терапия', 'Музыкотерапия', 'Декоративно-прикладное искусство', 'Обучение драматическому искусству',
    'Танцевально-двигательная терапия', 'Библиотерапия', 'Музыко-терапия', 'Кинотерапия',
    'Занятия лепкой', 'Игровая терапия', 'Занятие лепкой'
  ],
  'Министерство спорта Р.Б.': [
    'Организация мероприятий по подготовке спортивных сборных команд',
    'Организация и проведение официальных спортивных мероприятий',
    'Обеспечение участия спортивных сборных команд в официальных спортивных мероприятиях',
    'Спортивная подготовка по спорту лиц с интеллектуальными нарушениями',
    'Спортивная подготовка по спорту слепых',
    'Спортивная подготовка по спорту глухих',
    'Спортивная подготовка по спорту лиц с поражением опорно-двигательного аппарата',
    'Плавание (спорт ПОДА, слепых, глухих, ЛИН)',
    'Настольный теннис (спорт ПОДА, ЛИН)',
    'Настольный теннис (шоудаун) (спорт слепых)'
  ],
}

const SPECIALIST_OPTIONS = {
  'Министерство культуры Р.Б.': [
    'Руководители творческих коллективов', 'Руководитель кружка', 'Библиотекарь', 'Психолог',
    'Тифлопедагог', 'Мастера декоративно-прикладного искусства',
    'Руководитель студии народных ремесел "Возрождение наследия"',
    'Заведующий методическим кабинетом МАУ "Бураевский РДК им. Р. Галиевой"',
    'Культорганизатор', 'Художественный руководитель', 'Приглашенные психологи'
  ],
  'Министерство спорта Р.Б.': ['Тренер-преподаватель', 'Инструктор-методист', 'Педагог-психолог']
}

const admin = ref({
  ministry: localStorage.getItem('user_ministry') || 'Министерство культуры Р.Б.'
})

const organizations = ref([])
const error = ref('')
const loading = ref(false)
const search = ref('')

//            ID  Кратк  Полное  Адрес  Коорд  Тел   Сайт  Возр  СВО  Дост  Проф  Услуги  Спец  Действия
const columnWidths = ref([48, 250, 250, 210, 160, 105, 120, 80, 80, 90, 220, 250, 350, 130])

const originalOrgs = ref([])
const origFP = ref({})

const router = useRouter()
const goHome = () => router.push('/')

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

function normalizeCoords(c) {
  if (Array.isArray(c)) return c.filter(v => v != null).join(', ')
  if (c && typeof c === 'object') {
    const lat = c.lat ?? c.latitude ?? c[0]
    const lon = c.lng ?? c.lon ?? c.long ?? c.longitude ?? c[1]
    return (lat != null && lon != null) ? `${lat}, ${lon}` : ''
  }
  return (c ?? '').toString().trim()
}

function getToken() {
  return (
    localStorage.getItem('user_token') ||
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

const rowKey = (o) => o && (o._id ?? o.id)
function comparable(org) {
  return {
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
    specialists: toArr(org.specialists).map(N).sort()
  }
}
const fp = (obj) => JSON.stringify(obj)
function setOrigFingerprint(org) {
  const key = String(rowKey(org))
  origFP.value[key] = fp(comparable(org))
}

function isOrgChanged(_idx, org) {
  const key = rowKey(org)
  if (key == null) return false
  const original = origFP.value[String(key)]
  if (original == null) return false
  return fp(comparable(org)) !== original
}

async function saveOrg(org) {
  const token = getToken()
  if (!token) {
    alert('Вы не авторизованы как ведомственный администратор. Войдите и сохраните токен в localStorage (ключ "user_token").')
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
    }
    const res = await fetch(`${API_BASE}/ministry-admin/organization/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${t || res.statusText}`)
    }
    setOrigFingerprint(org)
    const k = rowKey(org)
    const i = originalOrgs.value.findIndex(o => rowKey(o) === k)
    if (i !== -1) originalOrgs.value[i] = JSON.parse(JSON.stringify(org))
    const j = organizations.value.findIndex(o => rowKey(o) === k)
    if (j !== -1) organizations.value[j] = { ...organizations.value[j] }
  } catch (e) {
    alert('Не удалось сохранить: ' + (e.message || e))
  }
}

async function createOrg(draft) {
  const token = getToken()
  if (!token) {
    alert('Вы не авторизованы как ведомственный администратор. Войдите и сохраните токен в localStorage (ключ "user_token").')
    return
  }
  try {
    const payload = {
      name: draft.name ?? '',
      full_name: draft.full_name ?? '',
      address: draft.address ?? '',
      coords: parseCoords(draft.coords),
      phone: draft.phone ?? '',
      website: draft.website ?? '',
      ageGroups: (draft.ageGroups || []),
      svo: N(draft.svo) === 'да' ? 'да' : 'нет',
      accessibility: N(draft.accessibility) === 'да' ? 'да' : 'нет',
      profile: (draft.profile || []),
      services: (draft.services || []),
      specialists: (draft.specialists || []),
      department: admin.value.ministry,
    }
    const res = await fetch(`${API_BASE}/ministry-admin/organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${t || res.statusText}`)
    }
    const created = await res.json()
    const normalized = {
      ...created,
      id: created._id || created.id,
      coords: normalizeCoords(created.coords),
      profile: created.profile || [],
      services: created.services || [],
      specialists: created.specialists || [],
      ageGroups: created.ageGroups || [],
      svo: N(created.svo) === 'да' ? 'да' : 'нет',
      accessibility: N(created.accessibility) === 'да' ? 'да' : 'нет',
    }
    organizations.value = [normalized, ...organizations.value]
    originalOrgs.value = [JSON.parse(JSON.stringify(normalized)), ...originalOrgs.value]
    setOrigFingerprint(normalized)
  } catch (e) {
    alert('Не удалось создать: ' + (e.message || e))
  }
}

async function deleteOrg(org) {
  if (!org) return
  if (!confirm(`Удалить организацию «${org.name || '(без названия)'}»?`)) return
  const token = getToken()
  if (!token) {
    alert('Вы не авторизованы как ведомственный администратор. Войдите и сохраните токен в localStorage (ключ "user_token").')
    return
  }
  try {
    const id = org._id || org.id
    if (!id) throw new Error('Нет ID организации')
    const res = await fetch(`${API_BASE}/ministry-admin/organization/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() },
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}: ${t || res.statusText}`)
    }
    const k = String(id)
    organizations.value = organizations.value.filter(o => String(rowKey(o)) !== k)
    originalOrgs.value = originalOrgs.value.filter(o => String(rowKey(o)) !== k)
    delete origFP.value[k]
  } catch (e) {
    alert('Не удалось удалить: ' + (e.message || e))
  }
}

async function loadOrganizationsForMinistry(ministry) {
  organizations.value = []
  error.value = ''
  loading.value = true
  try {
    const url = `${API_BASE}/organizations?department=${encodeURIComponent(ministry)}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`)
    const json = await resp.json()
    organizations.value = json.map((org, i) => ({
      ...org,
      id: org._id || org.id || (i + 1),
      coords: normalizeCoords(org.coords),
      profile: org.profile || [],
      services: org.services || [],
      specialists: org.specialists || [],
      ageGroups: org.ageGroups || [],
      svo: N(org.svo) === 'да' ? 'да' : 'нет',
      accessibility: N(org.accessibility) === 'да' ? 'да' : 'нет',
    }))
    originalOrgs.value = organizations.value.map(o => JSON.parse(JSON.stringify(o)))
    origFP.value = {}
    organizations.value.forEach(setOrigFingerprint)
  } catch (e) {
    error.value = 'Ошибка загрузки организаций: ' + (e.message || e)
    organizations.value = []
  } finally {
    loading.value = false
  }
}

const filteredOrgs = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return organizations.value
  return organizations.value.filter(org => {
    const fields = [
      org.id, org.name, org.full_name, org.address, org.coords, org.phone, org.website,
      (org.ageGroups || []).join(','), org.svo, org.accessibility,
      (org.profile || []).join(','), (org.services || []).join(','), (org.specialists || []).join(',')
    ].map(x => (x || '').toString().toLowerCase())
    return fields.some(val => val.includes(q))
  })
})

const eduCount = ref(0)
const onTabCount = (n) => { eduCount.value = n }
const countToShow = computed(() =>
  admin.value.ministry === 'Министерство просвещения Р.Б.'
    ? eduCount.value
    : filteredOrgs.value.length
)

onMounted(async () => {
  ensureYMaps()
  if (admin.value.ministry !== 'Министерство просвещения Р.Б.') {
    await loadOrganizationsForMinistry(admin.value.ministry)
  } else {
    organizations.value = []
  }
})
</script>

<template>
  <div class="admin-profile-full">
    <button class="close-btn-modern" @click="goHome" title="На главную">
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="15" fill="white" />
        <path d="M10 10 L20 20 M20 10 L10 20" stroke="#e04141" stroke-width="2.3" stroke-linecap="round"/>
      </svg>
    </button>

    <ErrorBar v-if="error" :text="error" />

    <div v-if="admin" class="ministry-line">
      <b>Ведомство:</b> {{ admin.ministry }}
    </div>

    <SearchBox v-model="search" :count="countToShow" />

    <div class="table-container-flex">
      <EducationMinistryTabs
        v-if="admin.ministry === 'Министерство просвещения Р.Б.'"
        :search="search"
        @count="onTabCount"
      />
      <template v-else>
        <LoadingBar v-if="loading" />
        <OrganizationTable
          v-else
          :organizations="filteredOrgs"
          v-model:columnWidths="columnWidths"
          :profileOptions="PROFILE_OPTIONS"
          :serviceOptions="SERVICE_OPTIONS[admin.ministry] || []"
          :specialistOptions="SPECIALIST_OPTIONS[admin.ministry] || []"
          :ageOptions="AGE_OPTIONS"
          :isOrgChanged="isOrgChanged"
          @saveOrg="saveOrg"
          @createOrg="createOrg"
          @deleteOrg="deleteOrg"
          :pageSize="30"
        />
      </template>
    </div>
  </div>
</template>

<style src="./AdminProfile/styles.css"></style>
