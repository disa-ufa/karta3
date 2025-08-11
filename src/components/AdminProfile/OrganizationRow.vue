<script setup>
import { computed } from 'vue'
import CheckboxList from './CheckboxList.vue'

/* -------- фолбэки (на случай, если пропы пустые) -------- */
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
  'Педагог-психолог',
  'Учитель логопед',
  'Социальный педагог',

'врач-невролог',
'врач-отоларинголог',
'врач-офтальмолог',
'врач-педиатр',
'врач-психиатр',
'врач-стоматолог',
'врач-физиотерапевт',
'врач-фтизиатр',
'инструктор по адаптивной физической культуре',
'инструктор по лечебной физкультуре',
'инструктор по физкультуре',
'медицинская сестра',
'медицинская сестра (диетсестра)',
'медицинская сестра по физиотерапии',
'медицинская сестра/брат по массажу',
'медицинский брат',
'педагог по гончарному делу',
'социальный педагог',
'сурдопедагог',
'учитель физической культуры',
'учитель-дефектолог',
'учитель-логопед',
'учитель-сурдопедагог',

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

const emit = defineEmits(['save'])

/* -------- нормализаторы / сравнение без регистра -------- */
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

/* -------- нормализованные списки опций -------- */
const ageOpts        = computed(() => (props.ageOptions?.length ? props.ageOptions : DEFAULT_AGE_OPTIONS))
const profileOpts    = computed(() => (props.profileOptions?.length ? props.profileOptions : DEFAULT_PROFILE_OPTIONS))
const serviceOpts    = computed(() => (props.serviceOptions?.length ? props.serviceOptions : DEFAULT_SERVICE_OPTIONS))
const specialistOpts = computed(() => (props.specialistOptions?.length ? props.specialistOptions : DEFAULT_SPECIALIST_OPTIONS))

/* -------- возрастные группы -------- */
function isAgeGroupChecked(age) { return arrHasCI(props.org.ageGroups, age) }
function toggleAgeGroup(age) { arrToggleCI(props.org, 'ageGroups', age, age) }

/* -------- СВО -------- */
function getSvo() { return N(props.org.svo) === 'да' ? 'да' : 'нет' }
function setSvo(val) { props.org.svo = val }

/* -------- Доступная среда -------- */
function getAccessibility() { return N(props.org.accessibility) === 'да' ? 'да' : 'нет' }
function setAccessibility(val) { props.org.accessibility = val }

/* -------- Профиль -------- */
function isProfileChecked(opt) { return arrHasCI(props.org.profile, opt) }
function toggleProfile(opt) { arrToggleCI(props.org, 'profile', opt, opt) }

/* -------- Услуги -------- */
function isServiceChecked(opt) { return arrHasCI(props.org.services, opt) }
function toggleService(opt) { arrToggleCI(props.org, 'services', opt, opt) }

/* -------- Специалисты -------- */
function isSpecialistChecked(opt) { return arrHasCI(props.org.specialists, opt) }
function toggleSpecialist(opt) { arrToggleCI(props.org, 'specialists', opt, opt) }

/* -------- высота строки перетягиванием -------- */
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
    {{ rowIdx + 1 }}
    <span class="row-resize" @mousedown="startRowResize"></span>
  </td>

  <!-- 2) Краткое наименование -->
  <td class="editable-cell">
    <textarea v-model="org.name" class="cell-area"></textarea>
  </td>

  <!-- 3) Полное наименование -->
  <td class="editable-cell">
    <textarea v-model="org.full_name" class="cell-area"></textarea>
  </td>

  <!-- 4) Адрес -->
  <td class="editable-cell">
    <textarea v-model="org.address" class="cell-area"></textarea>
  </td>

  <!-- 5) Координаты -->
  <td class="editable-cell">
    <input v-model="org.coords" class="cell-input" placeholder="55.75, 37.62" />
  </td>

  <!-- 6) Телефон -->
  <td class="editable-cell">
    <input v-model="org.phone" class="cell-input" />
  </td>

  <!-- 7) Сайт -->
  <td class="editable-cell">
    <input v-model="org.website" class="cell-input" />
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

  <!-- 14) Кнопка -->
  <td style="text-align:center">
    <button class="save-btn" :disabled="!isChanged(rowIdx, org)" @click="emit('save', org, rowIdx)">
      Сохранить
    </button>
  </td>
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
  font-size: 13px;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.age-group-box,
.acc-radio-box {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  align-items: center;
  padding: 2px;
}
.agelabel { font-size: 13px; white-space: nowrap; }
.acc-radio-box label {
  padding: 2px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.17s;
}
.acc-radio-box label.active-radio { background: #cbefff; font-weight: 500; }
.save-btn {
  padding: 7px 15px;
  border-radius: 6px;
  background: #36c900;
  border: none;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.16s, opacity 0.15s;
}
.save-btn:disabled { background: #b9e4b9; opacity: .62; cursor: not-allowed; }
.row-resize { width: 100%; height: 6px; bottom: 0; left: 0; cursor: row-resize; position: absolute; }
</style>
