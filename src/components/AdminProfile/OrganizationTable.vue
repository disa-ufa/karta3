<script setup>
import { computed, ref, watch } from 'vue'
import OrganizationRow from './OrganizationRow.vue'

const props = defineProps({
  organizations: Array,
  columnWidths: Array,        // v-model:columnWidths
  profileOptions: Array,
  serviceOptions: Array,
  specialistOptions: Array,
  ageOptions: Array,
  isOrgChanged: Function,
  ministry: String,
  pageSize: { type: Number, default: 25 },
})

const emit = defineEmits(['saveOrg', 'update:columnWidths'])

// Локальная копия ширин, чтобы не мутировать props
const localWidths = ref([...(props.columnWidths || [])])
watch(() => props.columnWidths, (nw) => {
  localWidths.value = [...(nw || [])]
}, { deep: true })

const currentPage = ref(1)
const totalPages = computed(() =>
  Math.max(1, Math.ceil((props.organizations?.length || 0) / props.pageSize))
)
const pagedOrgs = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return (props.organizations || []).slice(start, start + props.pageSize)
})

function gotoPage(page) {
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  currentPage.value = page
}
watch(() => props.organizations, () => { currentPage.value = 1 })

function startResize(index, event) {
  const startX = event.clientX
  const startWidth = localWidths.value[index] || 0
  const onMouseMove = e => {
    const w = Math.max(startWidth + e.clientX - startX, 50)
    // обновляем локально и пробрасываем вверх
    localWidths.value[index] = w
    emit('update:columnWidths', localWidths.value.slice())
  }
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function getColumnTitle(index) {
  return [
    'ID', 'Краткое наименование', 'Полное наименование',
    'Адрес', 'Координаты', 'Телефон', 'Сайт', 'Возрастные группы', 'СВО',
    'Доступная среда', 'Профиль', 'Услуги', 'Специалисты', ''
  ][index] || ''
}

// Пагинация с многоточием
const pageNumbers = computed(() => {
  const total = totalPages.value
  const curr = currentPage.value
  const pages = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (curr > 4) pages.push('...')
    for (let i = Math.max(2, curr - 2); i <= Math.min(total - 1, curr + 2); i++) {
      if (i > 1 && i < total) pages.push(i)
    }
    if (curr < total - 3) pages.push('...')
    if (total > 1) pages.push(total)
  }
  return pages
})
</script>

<template>
  <div class="table-container-flex">
    <div class="table-scroll-sticky">
      <table class="org-table"
        :style="{ minWidth: (localWidths.reduce((a,b)=>a+b,0)+24) + 'px', width: 'max-content' }">
        <thead>
          <tr>
            <th v-for="(width, colIndex) in localWidths" :key="colIndex" :style="{ width: width + 'px', position: 'relative' }">
              {{ getColumnTitle(colIndex) }}
              <span class="col-resize" @mousedown="startResize(colIndex, $event)"></span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(org, rowIdx) in pagedOrgs" :key="org._id || org.id || rowIdx" class="virtual-row">
            <OrganizationRow
              :org="org"
              :rowIdx="(currentPage-1)*pageSize + rowIdx"
              :columnWidths="localWidths"
              :profileOptions="profileOptions"
              :serviceOptions="serviceOptions"
              :specialistOptions="specialistOptions"
              :ageOptions="ageOptions"
              :ministry="ministry"
              :isChanged="isOrgChanged"
              @save="(org, idx) => emit('saveOrg', org, idx)"
            />
          </tr>
        </tbody>
      </table>
    </div>
    <div class="org-pagination" v-if="totalPages > 1">
      <button @click="gotoPage(currentPage-1)" :disabled="currentPage <= 1">&lt;</button>
      <template v-for="page in pageNumbers" :key="page+'pg'">
        <button
          v-if="page !== '...'"
          :class="['page-btn', { active: currentPage === page }]"
          :disabled="currentPage === page"
          @click="gotoPage(page)"
        >{{ page }}</button>
        <span v-else class="page-dots">...</span>
      </template>
      <button @click="gotoPage(currentPage+1)" :disabled="currentPage >= totalPages">&gt;</button>
      <span class="page-info">Стр. {{currentPage}} из {{totalPages}}</span>
    </div>
  </div>
</template>

<style scoped>
.table-container-flex {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
.table-scroll-sticky {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: #fafbfc;
  border-radius: 9px;
  box-shadow: 0 2px 14px #0001;
}
.org-pagination {
  margin-top: auto;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}
.org-pagination button, .org-pagination .page-btn {
  font-size: 15px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid #c0c0c0;
  background: #f7fafc;
  cursor: pointer;
}
.org-pagination .page-btn.active {
  background: #2474ca;
  color: #fff;
  border-color: #2474ca;
  font-weight: bold;
}
.page-dots { color: #aaa; padding: 0 4px; }
.page-info { margin-left: 10px; color: #6d7890; font-size: 15px; }
</style>
