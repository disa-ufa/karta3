<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import CheckboxList from './CheckboxList.vue'

/* -------- фолбэки -------- */
const DEFAULT_AGE_OPTIONS = ['0-18', '18+']
const DEFAULT_PROFILE_OPTIONS = [
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
const DEFAULT_SERVICE_OPTIONS = [
  'Получение начального общего образования',
  'Получение основного общего образования',
  'Получение среднего общего образования',
  'Профессиональная ориентация и социальная адаптация',
  'Содействие в получении общего образования',
  '3D моделирование и конструирование',
  'Адаптивная физкультура',
  'Арт-терапия и музыкотерапия',
  'Диагностика',
  'ЛФК',
  'Медицинский массаж',
  'Моделирование и конструирование',
  'Получение дошкольного и начального общего образования',
  'Получение дошкольного, начального общего, основного общего и среднего общего образования',
  'Получение начального общего и основного общего образования',
  'Получение начального общего образования',
  'Получение начального общего, основного общего и среднего общего образования',
  'Прием врача-невролог, Прием врача-ортопед, Прием врача-педиатр, Прием врача-физиотерапевт',
  'Прием врача-педиатр',
  'Прием врача-педиатр, Прием врача-фтизиатр',
  'Производственная адаптация',
  'Профессиональная ориентация и социальная адаптация',
  'Профессиональное обучение',
  'Профессиональное обучение и трудоустройство',
  'Ресурсная поддержка/консультирование педагогов и родителей',
  'Социальная адаптация',
  'Услуги педагога-психолога, логопеда',
  'Услуги педагога-психолога, логопеда, социального педагога',
  'Услуги педагога-психолога, социального педагога',
  'Услуги учителя-дефектолога, педагога-психолога, логопеда',
  'Услуги учителя-дефектолога, педагога-психолога, логопеда, социального педагога',
  'Услуги учителя-дефектолога, педагога-психолога, логопеда, сурдопедагога',
  'Услуги учителя-дефектолога, педагога-психолога, социального педагога',
  'Услуги учителя-дефектолога, педагога-психолога, учителя-логопеда, социального педагога',
  'Физиотерапия',
  'Художественный труд и лепка',
]
const DEFAULT_SPECIALIST_OPTIONS = [
  'Педагог-психолог', 'Учитель логопед', 'Социальный педагог',
  'врач-невролог', 'врач-отоларинголог', 'врач-офтальмолог', 'врач-педиатр',
  'врач-психиатр', 'врач-стоматолог', 'врач-физиотерапевт', 'врач-фтизиатр',
  'инструктор по адаптивной физической культуре', 'инструктор по лечебной физкультуре',
  'инструктор по физкультуре', 'медицинская сестра', 'медицинская сестра (диетсестра)',
  'медицинская сестра по физиотерапии', 'медицинская сестра/брат по массажу',
  'медицинский брат', 'педагог по гончарному делу', 'социальный педагог', 'сурдопедагог',
  'учитель физической культуры', 'учитель-дефектолог', 'учитель-логопед', 'учитель-сурдопедагог',
]

const props = defineProps({
  org: Object,
  rowIdx: Number,
  columnWidths: Array,
  ageOptions: Array,
  profileOptions: Array,
  serviceOptions: Array,
  specialistOptions: Array,
  isChanged: Function,
})
const emit = defineEmits(['save', 'delete', 'create', 'cancel'])

/* -------- утилы -------- */
const N = s => (s ?? '').toString().replace(/\s+/g, ' ').trim().toLowerCase()
function arrHasCI(arr, val) {
  if (!Array.isArray(arr)) return false
  const needle = N(val)
  return arr.some(x => N(x) === needle)
}
function arrToggleCI(obj, key, val, canonicalVal = val) {
  if (!Array.isArray(obj[key])) obj[key] = []
  const needle = N(val)
  const idx = obj[key].findIndex(x => N(x) === needle)
  if (idx === -1) obj[key].push(canonicalVal)
  else obj[key].splice(idx, 1)
}

/* -------- опции -------- */
const ageOpts        = computed(() => (props.ageOptions?.length ? props.ageOptions : DEFAULT_AGE_OPTIONS))
const profileOpts    = computed(() => (props.profileOptions?.length ? props.profileOptions : DEFAULT_PROFILE_OPTIONS))
const serviceOpts    = computed(() => (props.serviceOptions?.length ? props.serviceOptions : DEFAULT_SERVICE_OPTIONS))
const specialistOpts = computed(() => (props.specialistOptions?.length ? props.specialistOptions : DEFAULT_SPECIALIST_OPTIONS))

/* -------- возраст/сво/доступность -------- */
function isAgeGroupChecked(age) { return arrHasCI(props.org.ageGroups, age) }
function toggleAgeGroup(age) { arrToggleCI(props.org, 'ageGroups', age, age) }
function getSvo() { return N(props.org.svo) === 'да' ? 'да' : 'нет' }
function setSvo(val) { props.org.svo = val }
function getAccessibility() { return N(props.org.accessibility) === 'да' ? 'да' : 'нет' }
function setAccessibility(val) { props.org.accessibility = val }
function isProfileChecked(opt) { return arrHasCI(props.org.profile, opt) }
function toggleProfile(opt) { arrToggleCI(props.org, 'profile', opt, opt) }
function isServiceChecked(opt) { return arrHasCI(props.org.services, opt) }
function toggleService(opt) { arrToggleCI(props.org, 'services', opt, opt) }
function isSpecialistChecked(opt) { return arrHasCI(props.org.specialists, opt) }
function toggleSpecialist(opt) { arrToggleCI(props.org, 'specialists', opt, opt) }

/* -------- маски/валидации -------- */
const coordsLocal  = ref('')
const phoneLocal   = ref('')
const websiteLocal = ref('')
const addressLocal = ref('')

const addressRef = ref(null)

const coordsError  = ref(false)
const phoneError   = ref(false)
const websiteError = ref(false)
const addressError = ref(false)
const addressErrors = ref([])

const hasInvalid = computed(() =>
  coordsError.value || phoneError.value || websiteError.value || addressError.value
)

/* --- init --- */
onMounted(async () => {
  coordsLocal.value  = (props.org.coords ?? '').toString()
  phoneLocal.value   = formatPhone((props.org.phone ?? '').toString())
  websiteLocal.value = (props.org.website ?? '').toString()
  addressLocal.value = (props.org.address ?? '').toString()

  validateCoords(); validatePhone(); validateWebsite(); validateAddress()
  await nextTick(); autoResizeAddress()
})

watch(() => props.org.coords,  v => { coordsLocal.value  = (v ?? '').toString(); validateCoords() })
watch(() => props.org.phone,   v => { phoneLocal.value   = formatPhone((v ?? '').toString()); validatePhone() })
watch(() => props.org.website, v => { websiteLocal.value = (v ?? '').toString(); validateWebsite() })
watch(() => props.org.address, async v => {
  addressLocal.value = (v ?? '').toString()
  validateAddress(); await nextTick(); autoResizeAddress()
})

/* --- coords --- */
const COORD_RE = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/
function onCoordsInput(e) {
  const raw = e.target.value.replace(/[^0-9,\.\-\s]/g, '')
  coordsLocal.value = raw
  props.org.coords = raw
  validateCoords()
}
function validateCoords() {
  coordsError.value = !!coordsLocal.value && !COORD_RE.test(coordsLocal.value)
}

/* --- phone --- */
function formatPhone(v) {
  const digits = v.replace(/\D/g, '').replace(/^7/, '')
  const d = digits.slice(0, 10)
  let out = '+7'
  if (d.length) out += ' (' + d.slice(0,3)
  if (d.length >= 3) out += ') ' + d.slice(3,6)
  if (d.length >= 6) out += '-' + d.slice(6,8)
  if (d.length >= 8) out += '-' + d.slice(8,10)
  return out
}
function onPhoneInput(e) {
  phoneLocal.value = formatPhone(e.target.value)
  props.org.phone = phoneLocal.value
  validatePhone()
}
function validatePhone() {
  const digits = phoneLocal.value.replace(/\D/g, '').replace(/^7/, '')
  phoneError.value = digits.length > 0 && digits.length !== 10
}

/* --- website (IDN ok) --- */
function isLikelyUrl(u) {
  let val = (u || '').trim()
  if (!val) return false
  try { new URL(val); return true } catch {}
  try { new URL('https://' + val); return true } catch {}
  return false
}
function onWebsiteInput(e) {
  websiteLocal.value = e.target.value.trim()
  props.org.website = websiteLocal.value
  validateWebsite()
}
function validateWebsite() {
  websiteError.value = !!websiteLocal.value && !isLikelyUrl(websiteLocal.value)
}

/* --- address + авто-рост --- */
function autoResizeAddress() {
  const el = addressRef.value
  if (!el) return
  el.style.height = 'auto'
  const maxPx = 260
  const h = Math.min(el.scrollHeight, maxPx)
  el.style.height = h + 'px'
}
function onAddressInput(e) {
  addressLocal.value = e.target.value
  props.org.address = addressLocal.value
  validateAddress()
  nextTick().then(autoResizeAddress)
}
function onAddressBlur() { validateAddress() }

function validateAddress() {
  const s = (addressLocal.value || '').trim()
  const errs = []
  if (!/^\d{6}\s*,/.test(s)) errs.push('Начните с индекса: 6 цифр, затем запятая (например, 450075, …)')
  if (!/^\d{6}\s*,\s*Р\.?\s*Б\.?/.test(s)) errs.push('После индекса должна идти «Р.Б.» (через запятую)')
  if (!/Р\.?\s*Б\.?.*?,\s*[^,]+?\s+р-он\s*,/.test(s)) errs.push('Укажите район в формате «<Название> р-он,»')
  if (!/р-он\s*,\s*(г\.|с\.)\s*[^,]+,\s*/.test(s)) errs.push('После района укажите населённый пункт: «г. …,» или «с. …,»')
  if (!/(г\.|с\.)\s*[^,]+,\s*ул\.\s*[^,]+,\s*/.test(s)) errs.push('После населённого пункта укажите улицу: «ул. …,»')
  if (!/ул\.\s*[^,]+,\s*д\.\s*\S+\s*$/.test(s)) errs.push('В конце укажите дом: «д. …»')
  addressErrors.value = errs
  addressError.value = errs.length > 0
}

/* -------- обязательность для НОВОЙ строки -------- */
const isNew = computed(() => !!(props.org && (props.org._isNew || props.rowIdx < 0)))

const requiredMissing = computed(() => {
  const phoneDigits = phoneLocal.value.replace(/\D/g, '').replace(/^7/, '')
  return {
    name: isNew.value && !(props.org.name && props.org.name.trim()),
    address: isNew.value && !(addressLocal.value && addressLocal.value.trim()),
    coords: isNew.value && !(coordsLocal.value && coordsLocal.value.trim()),
    phone: isNew.value && phoneDigits.length !== 10
  }
})

const canCreate = computed(() => {
  if (!isNew.value) return false
  const phoneDigits = phoneLocal.value.replace(/\D/g, '').replace(/^7/, '')
  const nameOk = !!(props.org.name && props.org.name.trim())
  const addressOk = !!addressLocal.value && !addressError.value
  const coordsOk = !!coordsLocal.value && !coordsError.value && COORD_RE.test(coordsLocal.value)
  const phoneOk = phoneDigits.length === 10 && !phoneError.value
  const siteOk = !websiteLocal.value || !websiteError.value
  return nameOk && addressOk && coordsOk && phoneOk && siteOk
})

/* -------- ресайз строки -------- */
function startRowResize(event) {
  const tr = event.target.closest('tr')
  const startY = event.clientY
  const startHeight = tr.offsetHeight
  const onMouseMove = e => { tr.style.height = `${Math.max(startHeight + e.clientY - startY, 40)}px` }
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <!-- 1) ID -->
  <td style="text-align:center;position:relative">
    <template v-if="!isNew">{{ rowIdx + 1 }}</template>
    <template v-else>Новая</template>
    <span class="row-resize" @mousedown="startRowResize"></span>
  </td>

  <!-- 2) Краткое наименование -->
  <td class="editable-cell">
    <textarea v-model="props.org.name" class="cell-area"></textarea>
    <div v-if="isNew && requiredMissing.name" class="field-error">Обязательное поле</div>
  </td>

  <!-- 3) Полное наименование -->
  <td class="editable-cell">
    <textarea v-model="props.org.full_name" class="cell-area"></textarea>
  </td>

  <!-- 4) Адрес -->
  <td class="editable-cell">
    <div class="cell-vert">
      <textarea
        ref="addressRef"
        class="cell-area no-abs"
        :class="{ 'input-error': addressError }"
        :placeholder="'450000, Р.Б., Иглинский р-он, г. Уфа, ул. Ленина, д. 10'"
        v-model="addressLocal"
        @input="onAddressInput"
        @blur="onAddressBlur"
      />
      <div v-if="addressError" class="field-error">
        <div><b>Проверьте адрес:</b></div>
        <ul>
          <li v-for="(msg,i) in addressErrors" :key="i">{{ msg }}</li>
        </ul>
      </div>
      <div v-else-if="isNew && requiredMissing.address" class="field-error">Обязательное поле</div>
    </div>
  </td>

  <!-- 5) Координаты -->
  <td class="editable-cell">
    <input
      class="cell-input"
      :class="{ 'input-error': coordsError }"
      :placeholder="'55.12345, 54.12345'"
      v-model="coordsLocal"
      @input="onCoordsInput"
    />
    <div v-if="coordsError" class="field-error">Формат: 55.12345, 54.12345</div>
    <div v-else-if="isNew && requiredMissing.coords" class="field-error">Обязательное поле</div>
  </td>

  <!-- 6) Телефон -->
  <td class="editable-cell">
    <input
      class="cell-input"
      :class="{ 'input-error': phoneError }"
      :placeholder="'+7 (___) ___-__-__'"
      v-model="phoneLocal"
      @input="onPhoneInput"
    />
    <div v-if="phoneError" class="field-error">Укажите 10 цифр номера (формат: +7 (xxx) xxx-xx-xx)</div>
    <div v-else-if="isNew && requiredMissing.phone" class="field-error">Обязательное поле</div>
  </td>

  <!-- 7) Сайт -->
  <td class="editable-cell">
    <input
      class="cell-input"
      :class="{ 'input-error': websiteError }"
      :placeholder="'https://site.ru'"
      v-model="websiteLocal"
      @input="onWebsiteInput"
    />
    <div v-if="websiteError" class="field-error">Нужен валидный URL, например: https://site.ru</div>
  </td>

  <!-- 8) Возрастные группы -->
  <td class="editable-cell">
    <div class="age-group-box">
      <label v-for="age in ageOpts" :key="age" class="agelabel">
        <input type="checkbox" :checked="isAgeGroupChecked(age)" @change="toggleAgeGroup(age)" />
        {{ age }}
      </label>
    </div>
  </td>

  <!-- 9) СВО -->
  <td class="editable-cell">
    <div class="acc-radio-box">
      <label :class="{ 'active-radio': getSvo() === 'да' }">
        <input type="radio" value="да" :checked="getSvo() === 'да'" @change="setSvo('да')" />Да
      </label>
      <label :class="{ 'active-radio': getSvo() === 'нет' }">
        <input type="radio" value="нет" :checked="getSvo() === 'нет'" @change="setSvo('нет')" />Нет
      </label>
    </div>
  </td>

  <!--10) Доступная среда -->
  <td class="editable-cell">
    <div class="acc-radio-box">
      <label :class="{ 'active-radio': getAccessibility() === 'да' }">
        <input type="radio" value="да" :checked="getAccessibility() === 'да'" @change="setAccessibility('да')" />Да
      </label>
      <label :class="{ 'active-radio': getAccessibility() === 'нет' }">
        <input type="radio" value="нет" :checked="getAccessibility() === 'нет'" @change="setAccessibility('нет')" />Нет
      </label>
    </div>
  </td>

  <!--11) Профиль -->
  <td class="editable-cell">
    <div class="checkbox-list">
      <label v-for="opt in profileOpts" :key="opt">
        <input type="checkbox" :checked="isProfileChecked(opt)" @change="toggleProfile(opt)" />
        {{ opt }}
      </label>
    </div>
  </td>

  <!--12) Услуги -->
  <td class="editable-cell">
    <div class="checkbox-list">
      <label v-for="opt in serviceOpts" :key="opt">
        <input type="checkbox" :checked="isServiceChecked(opt)" @change="toggleService(opt)" />
        {{ opt }}
      </label>
    </div>
  </td>

  <!--13) Специалисты -->
  <td class="editable-cell">
    <div class="checkbox-list">
      <label v-for="opt in specialistOpts" :key="opt">
        <input type="checkbox" :checked="isSpecialistChecked(opt)" @change="toggleSpecialist(opt)" />
        {{ opt }}
      </label>
    </div>
  </td>

  <!-- 14) Действия -->
  <td style="text-align:center">
    <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
      <template v-if="isNew">
        <button class="save-btn" :disabled="!canCreate" @click="emit('create', props.org)">Создать</button>
        <button class="danger-btn" @click="emit('cancel')">Отмена</button>
      </template>
      <template v-else>
        <button class="save-btn" :disabled="!isChanged(rowIdx, props.org) || hasInvalid" @click="emit('save', props.org, rowIdx)">Сохранить</button>
        <button class="danger-btn" title="Удалить" @click="emit('delete', props.org)">Удалить</button>
      </template>
    </div>
  </td>
</template>

<style scoped>
.checkbox-list { display: flex; flex-direction: column; gap: 2px; padding: 2px 0 2px 4px; }
.checkbox-list label { display: flex; align-items: center; font-size: 13px; gap: 6px; cursor: pointer; user-select: none; }
.age-group-box, .acc-radio-box { display: flex; gap: 7px; flex-wrap: wrap; align-items: center; padding: 2px; }
.agelabel { font-size: 13px; white-space: nowrap; }
.acc-radio-box label { padding: 2px 10px; border-radius: 6px; cursor: pointer; transition: background 0.17s; }
.acc-radio-box label.active-radio { background: #cbefff; font-weight: 500; }

.field-error { color: #e33; font-size: 12.5px; line-height: 1.35; padding: 2px 0 4px 0; }

.cell-vert { display: flex; flex-direction: column; gap: 4px; }

.no-abs {
  position: static !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  min-height: 84px;
  padding: 6px 8px !important;
  resize: none !important;
  overflow: hidden !important;
}

.save-btn {
  padding: 7px 15px; border-radius: 6px; background: #36c900; border: none; color: #fff;
  font-size: 15px; cursor: pointer; font-weight: 500; transition: background 0.16s, opacity 0.15s;
}
.save-btn:disabled { background: #b9e4b9; opacity: .62; cursor: not-allowed; }

.danger-btn{
  padding: 7px 12px; border-radius: 6px; background:#ffe8e8; border:1px solid #ffb4b4; color:#c61f1f; font-size: 14px; cursor:pointer;
}
.danger-btn:hover{ background:#ffdcdc; }

.row-resize { width: 100%; height: 6px; bottom: 0; left: 0; cursor: row-resize; position: absolute; }
.input-error { background: #fff0f0 !important; border-color: #e66 !important; }
</style>
