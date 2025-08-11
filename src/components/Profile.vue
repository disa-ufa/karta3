<template>
  <div class="profile-form-outer">
    <div class="profile-form-container">
      <form class="profile-form" @submit.prevent="saveProfile">
        <button class="close-btn" @click.prevent="closeProfile" title="Закрыть">×</button>
        <h2 class="profile-title">Личный кабинет</h2>
        <!-- Основные поля -->
        <div class="form-group">
          <label>
            Наименование организации <span class="required">*</span>
            <input v-model="profile.orgName" required autocomplete="organization" @input="onInputChange" />
          </label>
        </div>
        <div class="form-group">
          <label>
            Юридический адрес <span class="required">*</span>
            <input v-model="profile.legalAddress" required autocomplete="address" @input="onInputChange" />
          </label>
        </div>
        <div class="form-group">
          <label>
            Официальный сайт
            <input v-model="profile.website" placeholder="https://example.com" autocomplete="url" @input="onInputChange" />
          </label>
        </div>
        <div class="form-group">
          <label>
            Телефон <span class="required">*</span>
            <input v-model="profile.phone" required placeholder="+7 (___) ___-__-__" autocomplete="tel" @input="onInputChange" />
          </label>
        </div>
        <div class="form-group">
          <label>
            E-mail <span class="required">*</span>
            <input v-model="profile.email" type="email" required disabled />
          </label>
        </div>
        <!-- Географические координаты -->
        <div class="form-group">
          <label>
            Географические координаты <span class="required">*</span>
            <input
              v-model="profile.coords"
              required
              placeholder="55.12345, 54.12345"
              @input="validateCoordsInput"
              :class="{ 'input-error': coordsError }"
            />
          </label>
          <div v-if="coordsError" class="form-error">
            Введите координаты в формате: 55.12345, 54.12345
          </div>
        </div>
        <!-- Возрастная группа -->
        <div class="special-block">
          <div class="block-title">Возрастная группа <span class="required">*</span></div>
          <div class="checkbox-list pretty">
            <label v-for="group in ageGroupsList" :key="group" class="checkbox-pretty">
              <input
                type="checkbox"
                :value="group"
                v-model="profile.ageGroups"
                @change="onInputChange"
              />
              <span>{{ group }}</span>
            </label>
          </div>
          <div v-if="ageGroupsError" class="form-error">Выберите хотя бы одну группу</div>
        </div>
        <!-- Доступная среда -->
        <div class="special-block">
          <div class="block-title">Доступная среда <span class="required">*</span></div>
          <div class="radio-list pretty">
            <label v-for="opt in accessibilityOptions" :key="opt" class="radio-pretty">
              <input
                type="radio"
                :value="opt"
                v-model="profile.accessibility"
                @change="onInputChange"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
          <div v-if="accessibilityError" class="form-error">Выберите вариант</div>
        </div>
        <!-- Профиль -->
        <div class="block">
          <div class="block-title">Профиль</div>
          <div class="checkbox-list vertical pretty">
            <label v-for="prof in profileList" :key="prof" class="checkbox-pretty">
              <input type="checkbox" :value="prof" v-model="profile.profile" @change="onInputChange" />
              <span>{{ prof }}</span>
            </label>
          </div>
        </div>
        <!-- Перечень услуг -->
        <div class="block">
          <div class="block-title">Перечень услуг</div>
          <div class="checkbox-list vertical pretty">
            <label v-for="service in servicesList" :key="service" class="checkbox-pretty">
              <input type="checkbox" :value="service" v-model="profile.services" @change="onInputChange" />
              <span>{{ service }}</span>
            </label>
          </div>
        </div>
        <!-- Перечень специалистов -->
        <div class="block">
          <div class="block-title">Перечень специалистов</div>
          <div class="checkbox-list vertical pretty">
            <label v-for="spec in specialistsList" :key="spec" class="checkbox-pretty">
              <input type="checkbox" :value="spec" v-model="profile.specialists" @change="onInputChange" />
              <span>{{ spec }}</span>
            </label>
          </div>
        </div>
        <button
          class="profile-save-btn"
          type="submit"
          :disabled="saving || !isChanged || coordsError"
          :class="{ 'inactive-btn': !isChanged || coordsError }"
        >Сохранить</button>
        <div v-if="success" class="form-success">Изменения сохранены!</div>
        <div v-if="error" class="form-error">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function closeProfile() {
  router.push('/')
}

const ageGroupsList = ['0-18', '18+', 'СВО']
const accessibilityOptions = ['Да', 'Нет']
const profileList = [
  'интеллектуальные нарушениями',
  'нарушения зрения',
  'нарушения слуха',
  'нарушения опорно-двигательного аппарата'
]
const servicesList = [
  'Арт-терапия',
  'Музыкотерапия',
  'Декоративно-прикладное искусство',
  'Обучение драматическому искусству',
  'Танцевально-двигательная терапия'
]
const specialistsList = [
  'Логопед',
  'Психолог',
  'Дефектолог',
  'Руководители творческих коллективов',
  'Творческий коллектив',
  'Художник',
  'Руководитель кружка'
]

const profile = ref({
  orgName: '',
  legalAddress: '',
  website: '',
  phone: '',
  email: '',
  coords: '',
  ageGroups: [],
  accessibility: '',
  profile: [],
  services: [],
  specialists: []
})
const loadedProfile = ref({}) // для отслеживания изменений

const success = ref(false)
const error = ref('')
const saving = ref(false)
const ageGroupsError = ref(false)
const accessibilityError = ref(false)
const coordsError = ref(false)
const isChanged = ref(false)

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function updateIsChanged() {
  isChanged.value = !deepEqual(
    { ...loadedProfile.value, coords: loadedProfile.value.coords?.toString() || '' },
    { ...profile.value, coords: profile.value.coords?.toString() || '' }
  )
}

function onInputChange() {
  updateIsChanged()
  success.value = false // прячем "Изменения сохранены!" если что-то поменяли
}

// Валидация координат при вводе
function validateCoordsInput(e) {
  let value = e.target.value
  value = value.replace(/[^0-9.,\s\-]/g, '')
  profile.value.coords = value
  const pattern = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/
  coordsError.value = !pattern.test(value)
  onInputChange()
}

onMounted(async () => {
  const token = localStorage.getItem('user_token')
  try {
    const res = await fetch('http://136.169.171.150:8888/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Ошибка загрузки профиля')
    const data = await res.json()
    // приводим массивы, строки и т.п.
    profile.value.orgName = data.name || ''
    profile.value.legalAddress = data.address || ''
    profile.value.website = data.website || ''
    profile.value.phone = data.phone || ''
    profile.value.email = data.email || ''
    if (Array.isArray(data.coords)) {
      profile.value.coords = data.coords.join(', ')
    } else {
      profile.value.coords = typeof data.coords === 'string' ? data.coords : ''
    }
    profile.value.ageGroups = Array.isArray(data.ageGroups) ? data.ageGroups : []
    profile.value.accessibility = data.accessibility || ''
    profile.value.profile = Array.isArray(data.profile) ? data.profile : (typeof data.profile === 'string' && data.profile ? [data.profile] : [])
    profile.value.services = Array.isArray(data.services) ? data.services : (typeof data.services === 'string' && data.services ? [data.services] : [])
    profile.value.specialists = Array.isArray(data.specialists) ? data.specialists : (typeof data.specialists === 'string' && data.specialists ? [data.specialists] : [])
    loadedProfile.value = JSON.parse(JSON.stringify(profile.value))
    updateIsChanged()
  } catch (e) {
    error.value = 'Ошибка загрузки профиля'
    console.error('[Profile] Ошибка загрузки:', e)
  }
})

async function saveProfile() {
  ageGroupsError.value = profile.value.ageGroups.length === 0
  accessibilityError.value = !profile.value.accessibility
  const pattern = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/
  coordsError.value = !pattern.test(profile.value.coords)
  if (ageGroupsError.value || accessibilityError.value || coordsError.value) {
    error.value = ''
    saving.value = false
    return
  }
  const coordsArr = profile.value.coords.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v))
  success.value = false
  error.value = ''
  saving.value = true
  const token = localStorage.getItem('user_token')
  try {
    const payload = {
      name: profile.value.orgName,
      address: profile.value.legalAddress,
      website: profile.value.website,
      phone: profile.value.phone,
      email: profile.value.email,
      coords: coordsArr,
      ageGroups: profile.value.ageGroups,
      accessibility: profile.value.accessibility,
      profile: Array.isArray(profile.value.profile) ? profile.value.profile : [],
      services: Array.isArray(profile.value.services) ? profile.value.services : [],
      specialists: Array.isArray(profile.value.specialists) ? profile.value.specialists : []
    }
    const res = await fetch('http://136.169.171.150:8888/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      success.value = true
      error.value = ''
      loadedProfile.value = JSON.parse(JSON.stringify(profile.value))
      updateIsChanged()
    } else {
      const err = await res.json()
      error.value = err?.error || 'Ошибка сохранения'
    }
  } catch (e) {
    error.value = 'Ошибка соединения с сервером'
    console.error('[Profile] Ошибка соединения:', e)
  }
  saving.value = false
}
</script>

<style scoped>
.profile-form-outer {
  overflow-y: auto;
  height: 100vh; /* важно для появления полосы прокрутки */
}
.profile-form-outer {
  min-height: 100vh;
  width: 100vw;
  background: #fafbfc;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}
.profile-form-container {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex: 1;
  margin-left: 80px;
}
.profile-form {
  position: relative;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(60,80,100,0.13);
  padding: 32px 38px 36px 38px;
  max-width: 700px;
  width: 100%;
  font-family: 'Segoe UI', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 42px 0 42px 0;
}
.close-btn {
  position: absolute;
  top: 18px;
  right: 22px;
  font-size: 28px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  z-index: 2;
  transition: color 0.16s;
}
.close-btn:hover {
  color: #f33;
}
.profile-title {
  font-weight: bold;
  font-size: 2rem;
  color: #203656;
  margin-bottom: 10px;
  text-align: left;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.form-group label {
  font-size: 1rem;
  color: #222;
}
input, select, textarea {
  border: 1px solid #e5e5e5;
  border-radius: 7px;
  padding: 8px 10px;
  font-size: 16px;
  margin-top: 3px;
  outline: none;
  transition: border .17s;
  background: #fafbfc;
  width: 100%;
}
input:focus, select:focus, textarea:focus {
  border-color: #2962ff;
}
.input-error {
  border-color: #e44 !important;
  background: #fff3f3;
}
.required {
  color: #e44;
  font-weight: 600;
  margin-left: 2px;
}
.block, .special-block {
  background: #fafbfc;
  border-radius: 8px;
  padding: 18px 14px 14px 14px;
  margin: 10px 0 0 0;
  box-shadow: 0 2px 14px #e0e5f733;
}
.block-title {
  font-weight: 600;
  font-size: 17px;
  margin-bottom: 10px;
  color: #203656;
}
.checkbox-list,
.radio-list {
  display: flex;
  gap: 22px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.checkbox-list.vertical,
.radio-list.vertical {
  flex-direction: column;
  gap: 8px;
}

/* Выровненные чекбоксы и радио */
.checkbox-pretty,
.radio-pretty {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 16px;
  user-select: none;
  cursor: pointer;
  min-height: 32px;
}

.checkbox-pretty input[type="checkbox"],
.radio-pretty input[type="radio"] {
  width: 19px;
  height: 19px;
  accent-color: #2962ff;
  margin-right: 0;
  margin-top: 0;
  cursor: pointer;
}
.checkbox-pretty input[type="checkbox"]:focus + span,
.checkbox-pretty input[type="checkbox"]:hover + span,
.radio-pretty input[type="radio"]:focus + span,
.radio-pretty input[type="radio"]:hover + span {
  text-decoration: underline;
  color: #1653f3;
}

.form-error {
  color: #e44;
  margin-top: 5px;
  font-size: 15px;
}
.form-success {
  color: #2aa600;
  margin-top: 8px;
  font-size: 16px;
}
.profile-save-btn {
  width: 100%;
  background: #36c900;
  color: #fff;
  border: none;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 18px;
  transition: background 0.18s, color 0.18s;
}
.profile-save-btn.inactive-btn,
.profile-save-btn:disabled {
  background: #d1d1d1;
  color: #888;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .profile-form {
    padding: 18px 8px;
    max-width: 99vw;
    margin: 12px 0 12px 0;
  }
  .profile-form-container {
    margin-left: 0;
  }
}
</style>
