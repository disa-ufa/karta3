<script setup>
import { ref, watch } from 'vue'
import { API_BASE } from '@/apiBase'

const props = defineProps({
  show: Boolean,
  isLogin: Boolean,
  loading: Boolean,
  error: String,
  ministries: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'switchTab', 'logged-in'])

const loginEmail = ref('')
const loginPassword = ref('')
const localError = ref('')

const registrationTab = ref('org') // org | ministry

const regName = ref('')
const regMinistry = ref('')
const regContactName = ref('')
const regContactPhone = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regPasswordRepeat = ref('')
const registrationSuccess = ref(false)

watch(() => props.show, show => {
  if (!show) {
    loginEmail.value = ''
    loginPassword.value = ''
    localError.value = ''
    registrationTab.value = 'org'
    regName.value = ''
    regMinistry.value = ''
    regContactName.value = ''
    regContactPhone.value = ''
    regEmail.value = ''
    regPassword.value = ''
    regPasswordRepeat.value = ''
    registrationSuccess.value = false
  }
})

function onPhoneInput(e) {
  let value = e.target.value.replace(/\D/g, '')
  if (value.startsWith('7')) value = value.slice(1)
  if (value.length > 10) value = value.slice(0, 10)
  let masked = '+7 ('
  if (value.length) masked += value.substring(0, 3)
  if (value.length >= 3) masked += ') '
  if (value.length >= 4) masked += value.substring(3, 6)
  if (value.length >= 6) masked += '-' + value.substring(6, 8)
  if (value.length >= 8) masked += '-' + value.substring(8, 10)
  regContactPhone.value = masked
}

const isStrongPassword = (p) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(p)

/* ---------------- ВХОД ---------------- */
async function handleLogin() {
  localError.value = ''
  if (!loginEmail.value || !loginPassword.value) {
    localError.value = 'Введите логин и пароль'
    return
  }
  try {
    const resp = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.value.trim(), password: loginPassword.value })
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      localError.value = data?.error || 'Ошибка входа'
      return
    }

    // сохраняем во всех совместимых ключах
    localStorage.setItem('user_token', data.token || '')
    localStorage.setItem('token', data.token || '')
    localStorage.setItem('auth_type', data.type || '')
    localStorage.setItem('user_type', data.type || '')
    localStorage.setItem('user_email', loginEmail.value.trim())
    if (data.type === 'ministry-admin' && data.ministry) {
      localStorage.setItem('user_ministry', data.ministry)
    }

    emit('logged-in', { type: data.type, ministry: data.ministry || null })
    emit('close')
    location.reload()
  } catch {
    localError.value = 'Ошибка соединения с сервером'
  }
}

/* --------------- РЕГИСТРАЦИЯ ---------------- */
async function handleRegister() {
  localError.value = ''
  registrationSuccess.value = false

  if (registrationTab.value === 'org' && !regName.value) {
    localError.value = 'Введите наименование организации'
    return
  }
  if (!regMinistry.value) {
    localError.value = 'Выберите ведомство'
    return
  }
  if (!regContactName.value || !regEmail.value || !regPassword.value || !regPasswordRepeat.value) {
    localError.value = 'Заполните все поля'
    return
  }
  if (regPassword.value !== regPasswordRepeat.value) {
    localError.value = 'Пароли не совпадают'
    return
  }
  if (!isStrongPassword(regPassword.value)) {
    localError.value = 'Пароль должен быть не менее 6 символов и содержать буквы и цифры'
    return
  }

  const body = {
    ministry: regMinistry.value,
    contactName: regContactName.value,
    contactPhone: regContactPhone.value,
    email: regEmail.value,
    password: regPassword.value,
    isMinistryAdmin: registrationTab.value === 'ministry'
  }
  if (registrationTab.value === 'org') body.orgName = regName.value

  try {
    const response = await fetch(`${API_BASE}/register-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (response.ok) {
      registrationSuccess.value = true
    } else {
      const err = await response.json().catch(() => ({}))
      localError.value = err?.error || 'Ошибка при отправке заявки'
    }
  } catch {
    localError.value = 'Ошибка соединения с сервером'
  }
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="auth-modal">
      <div class="tabs">
        <button :class="{active: isLogin}" @click="$emit('switchTab', true)">Вход</button>
        <button :class="{active: !isLogin}" @click="$emit('switchTab', false)">Регистрация</button>
      </div>
      <div class="modal-content">
        <!-- Вход -->
        <form v-if="isLogin" @submit.prevent="handleLogin" autocomplete="on">
          <input type="email" v-model="loginEmail" placeholder="E-mail" autocomplete="username" required />
          <input type="password" v-model="loginPassword" placeholder="Пароль" autocomplete="current-password" required />
          <button type="submit" class="modal-btn">Войти</button>
          <div v-if="localError" class="modal-error">{{ localError }}</div>
          <div v-else-if="error" class="modal-error">{{ error }}</div>
        </form>

        <!-- Регистрация -->
        <template v-else>
          <div class="register-tabs">
            <button :class="['reg-tab', {active: registrationTab === 'org'}]" @click="registrationTab = 'org'" type="button">
              Организация
            </button>
            <button :class="['reg-tab', {active: registrationTab === 'ministry'}]" @click="registrationTab = 'ministry'" type="button">
              Администратор ведомства
            </button>
          </div>
          <form @submit.prevent="handleRegister" v-if="!registrationSuccess">
            <input v-if="registrationTab === 'org'" type="text" v-model="regName" placeholder="Наименование организации" required />
            <select v-model="regMinistry" required>
              <option value="" disabled>Выберите ведомство</option>
              <option v-for="m in ministries" :key="m" :value="m">{{ m }}</option>
            </select>
            <input type="text" v-model="regContactName" placeholder="ФИО контактного лица" required />
            <input type="tel" v-model="regContactPhone" @input="onPhoneInput" maxlength="18" placeholder="+7 (___) ___-__-__" required autocomplete="tel" />
            <input type="email" v-model="regEmail" placeholder="E-mail" required />
            <input type="password" v-model="regPassword" placeholder="Пароль" required />
            <input type="password" v-model="regPasswordRepeat" placeholder="Повторите пароль" required />
            <button type="submit" class="modal-btn">Зарегистрироваться</button>
            <div v-if="localError" class="modal-error">{{ localError }}</div>
            <div v-else-if="error" class="modal-error">{{ error }}</div>
          </form>
          <div v-if="registrationSuccess" class="modal-success">
            Заявка принята и будет рассмотрена модератором.<br>
            Результат будет отправлен на email.
          </div>
        </template>
      </div>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>
  </div>
</template>

<style scoped>
/* стили без изменений */
.register-tabs{display:flex;gap:10px;margin-bottom:12px;justify-content:center}
.reg-tab{background:#e7eef6;border:none;border-radius:7px;padding:7px 16px;font-size:15px;color:#797c8a;font-weight:500;cursor:pointer}
.reg-tab.active{background:#f2faff;color:#2962ff}
.reg-tab[disabled]{pointer-events:none;opacity:.45}
.modal-overlay{position:fixed;inset:0;background:rgba(51,61,81,.20);z-index:9999;display:flex;align-items:center;justify-content:center}
.auth-modal{background:#fff;border-radius:14px;box-shadow:0 8px 48px rgba(60,80,100,.19);padding:28px 28px 20px;width:370px;position:relative}
.tabs{display:flex;justify-content:center;margin-bottom:18px;gap:10px}
.tabs button{background:none;border:none;font-size:16px;color:#999;padding:5px 12px;border-radius:7px;cursor:pointer;transition:background .17s,color .17s}
.tabs button.active{background:#f2faff;color:#2962ff;font-weight:bold}
.modal-content input,.modal-content select{width:100%;margin-bottom:13px;padding:8px 11px;border:1.2px solid #e5e5e5;border-radius:6px;font-size:15px}
.modal-content select:invalid{color:#a7a7a7}
.modal-btn{width:100%;background:#36c900;color:#fff;border:none;padding:10px 0;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;margin-top:2px;transition:background .17s}
.close-btn{position:absolute;top:12px;right:13px;font-size:22px;border:none;background:none;color:#888;cursor:pointer;padding:0}
.modal-error{color:#f33;font-size:14px;margin-top:8px;text-align:center}
.modal-success{color:#36c900;font-size:16px;text-align:center;margin:26px 0 12px;font-weight:500;line-height:1.5}
</style>
