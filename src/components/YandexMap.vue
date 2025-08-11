<template>
  <div>
    <LeftPanel
      v-show="!isPanelCollapsed"
      class="map-panel"
      :visibleLayers="visibleLayers"
      :ageGroups="ageGroups"
      :accessibility="accessibility"
      :svo="svo"
      :allAgeGroups="allAgeGroups"
      :allOrganizations="allOrganizations"
      @update:ageGroups="val => ageGroups.splice(0, ageGroups.length, ...val)"
      @update:accessibility="val => accessibility.splice(0, accessibility.length, ...val)"
      @update:svo="val => svo.splice(0, svo.length, ...val)"
      @selectOrg="handleSelectOrganization"
      @collapse="isPanelCollapsed = true"
    />

    <button
      v-if="isPanelCollapsed"
      class="panel-toggle-btn"
      @click="isPanelCollapsed = false"
      title="Показать панель"
    >
      <svg width="22" height="22" viewBox="0 0 20 20">
        <path d="M7 5l6 5-6 5" stroke="#666" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div id="map" ref="mapRef" style="width: 100vw; height: 100vh; position: relative;"></div>

    <div v-if="loadError" class="map-error">
      <div>{{ loadError }}</div>
      <button class="retry-btn" @click="loadOrganizationsFromApi">Повторить</button>
    </div>
    <div v-if="isLoading" class="map-loader">Загрузка организаций...</div>

    <transition name="sidebar">
      <SidebarCard v-if="selectedOrg" :org="selectedOrg" @close="selectedOrg = null" />
    </transition>

    <div
      v-if="hoveredOrg"
      :style="previewCardStyle"
      class="preview-card"
      @mouseenter="isPreviewHovered = true"
      @mouseleave="handlePreviewLeave"
    >
      <div><b>{{ hoveredOrg.name }}</b></div>
      <div>Адрес: {{ hoveredOrg.address }}</div>
      <div>Телефон: {{ hoveredOrg.phone }}</div>
      <div>
        Сайт:
        <a :href="hoveredOrg.website" target="_blank" style="color: #1aaf5d;">
          {{ hoveredOrg.website }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue'
import LeftPanel from './LeftPanel.vue'
import SidebarCard from './SidebarCard.vue'
import { API_BASE } from '@/apiBase'

const MINISTRY_SOCIAL = "Министерство семьи, труда и социальной защиты населения Р.Б."

const isPanelCollapsed = ref(false)
const allAgeGroups = ['0-18', '18+']
const ageGroups = reactive([...allAgeGroups])
const accessibility = reactive([])
const svo = reactive([])

const visibleLayers = reactive({
  layer1_1: true,
  layer1_2: true,
  layer1_3: true,
  layer2: true,
  layer3: true,
  layer4: true,
  layer5: true
})

const layerPresets = {
  layer1_1: 'islands#redIcon',
  layer1_2: 'islands#orangeIcon',
  layer1_3: 'islands#brownIcon',
  layer2: 'islands#blueIcon',
  layer3: 'islands#greenIcon',
  layer4: 'islands#violetIcon',
  layer5: 'islands#yellowIcon'
}

const mapRef = ref(null)
const objectManagers = {}
let mapInstance = null

const selectedOrg = ref(null)
const hoveredOrg = ref(null)
const previewCoords = ref({ x: 0, y: 0 })
const isPreviewHovered = ref(false)
const allOrganizations = ref([])

const isLoading = ref(false)
const loadError = ref(null)

function debugLog(...args) { if (import.meta.env.DEV) console.log(...args) }

function getLayerIdByOrg(org) {
  const dep = (org.department || org.vedomstva || '').trim();
  if (dep === 'Министерство просвещения Р.Б.') {
    let podvList = [];
    if (Array.isArray(org.podvedomstva)) podvList = podvList.concat(org.podvedomstva);
    else if (typeof org.podvedomstva === 'string') podvList.push(org.podvedomstva);
    if (Array.isArray(org.profile)) podvList = podvList.concat(org.profile);
    else if (typeof org.profile === 'string') podvList.push(org.profile);
    podvList = podvList.map(x => (x || '').toLowerCase());
    if (podvList.some(v => v.includes('коррекц'))) return 'layer1_2';
    if (podvList.some(v => v.includes('пмпк'))) return 'layer1_3';
    if (podvList.some(v => v.includes('муницип'))) return 'layer1_1';
    return null;
  }
  if (dep === 'Министерство спорта Р.Б.') return 'layer2';
  if (dep === 'Министерство культуры Р.Б.') return 'layer3';
  if (dep === 'Министерство здравоохранения Р.Б.') return 'layer4';
  if (dep === MINISTRY_SOCIAL) return 'layer5';
  return null;
}

async function loadOrganizationsFromApi() {
  isLoading.value = true
  loadError.value = null
  try {
    const res = await fetch(`${API_BASE}/organizations`)
    if (!res.ok) throw new Error('Ошибка сервера: ' + res.status)

    const data = await res.json()
    allOrganizations.value = []
    for (const key in objectManagers) {
      if (mapInstance) mapInstance.geoObjects.remove(objectManagers[key])
      delete objectManagers[key]
    }

    const layersData = {
      layer1_1: [], layer1_2: [], layer1_3: [],
      layer2: [], layer3: [], layer4: [], layer5: []
    }

    data.forEach(org => {
      const layer = getLayerIdByOrg(org)
      if (!layer) return
      layersData[layer].push({ ...org, layer, coords: org.coords })
      allOrganizations.value.push({ ...org, layer, coords: org.coords })
    })

    for (const layerId in layersData) {
      if (!objectManagers[layerId]) {
        objectManagers[layerId] = new window.ymaps.ObjectManager({ clusterize: true })
      }
      const features = layersData[layerId]
        .filter(org => Array.isArray(org.coords) && org.coords.length === 2)
        .map((org, idx) => ({
          type: 'Feature',
          id: org._id || `${layerId}-${idx}`,
          geometry: { type: 'Point', coordinates: org.coords },
          properties: { ...org }
        }))

      offsetDuplicateCoords(features)
      objectManagers[layerId].removeAll && objectManagers[layerId].removeAll()
      objectManagers[layerId].add({ type: 'FeatureCollection', features })
      objectManagers[layerId].objects.options.set('preset', layerPresets[layerId])
      objectManagers[layerId].objects.options.set('hasBalloon', false)
      objectManagers[layerId].objects.options.set('openBalloonOnClick', false)
      objectManagers[layerId].objects.options.set('hasHint', false)

      objectManagers[layerId].objects.events.add('mouseenter', (e) => {
        const objectId = e.get('objectId')
        const geoObject = objectManagers[layerId].objects.getById(objectId)
        const props = geoObject.properties
        const coords = geoObject.geometry.coordinates
        const pixel = mapInstance.options.get('projection').toGlobalPixels(coords, mapInstance.getZoom())
        const mapPx = mapInstance.converter.globalToPage(pixel)
        openPreviewCard(props, { x: mapPx[0], y: mapPx[1] })
      })
      objectManagers[layerId].objects.events.add('mouseleave', () => {
        setTimeout(() => { if (!isPreviewHovered.value) hoveredOrg.value = null }, 150)
      })
      objectManagers[layerId].objects.events.add('click', (e) => {
        const objectId = e.get('objectId')
        const props = objectManagers[layerId].objects.getById(objectId).properties
        selectedOrg.value = { ...props }
      })
      if (visibleLayers[layerId]) mapInstance.geoObjects.add(objectManagers[layerId])
      objectManagers[layerId].setFilter(obj => filterFeature(obj))
    }
    applyFiltersToAllLayers()
    loadError.value = null
  } catch (e) {
    debugLog('[loadOrganizationsFromApi ERROR]:', e)
    loadError.value = 'Ошибка загрузки организаций с сервера!'
  } finally {
    isLoading.value = false
  }
}

function offsetDuplicateCoords(features) {
  const coordGroups = new Map()
  const OFFSET = 0.0002
  features.forEach(feature => {
    const coordStr = JSON.stringify(feature.geometry.coordinates)
    if (!coordGroups.has(coordStr)) coordGroups.set(coordStr, [])
    coordGroups.get(coordStr).push(feature)
  })
  for (const group of coordGroups.values()) {
    if (group.length > 1) {
      const [lon, lat] = group[0].geometry.coordinates
      for (let i = 1; i < group.length; i++) {
        const angle = (i * 30) * Math.PI / 180
        const dx = Math.cos(angle) * OFFSET
        const dy = Math.sin(angle) * OFFSET
        group[i].geometry.coordinates = [lon + dx, lat + dy]
      }
    }
  }
}

function filterFeature(obj) {
  let ageArr = []
  if (Array.isArray(obj.properties.ageGroups)) {
    ageArr = obj.properties.ageGroups.map(a => a?.toString().toLowerCase().trim())
  } else if (typeof obj.properties.ageGroups === 'string') {
    ageArr = obj.properties.ageGroups.split(/[,\n;]/).map(a => a.trim().toLowerCase())
  } else if (typeof obj.properties.age_group === 'string') {
    ageArr = obj.properties.age_group.split(/[,\n;]/).map(a => a.trim().toLowerCase())
  }
  const accVal = (obj.properties.accessibility || '').toLowerCase().trim()
  const svoVal = (obj.properties.svo || '').toLowerCase().trim()

  const ageFilter = Array.isArray(ageGroups) ? [...ageGroups] : []
  const accFilter = Array.isArray(accessibility) ? [...accessibility] : []
  const svoFilter = Array.isArray(svo) ? [...svo] : []

  const ageOk = ageFilter.length > 0 ? ageFilter.some(group => ageArr.includes(group.toLowerCase())) : true
  const accOk = accFilter.length > 0 ? accFilter.some(val => accVal === val.toLowerCase().trim()) : true
  const svoOk  = svoFilter.length  > 0 ? (svoFilter.includes('Да') ? (svoVal === 'да') : true) : true

  return ageOk && accOk && svoOk
}
function applyFiltersToAllLayers() {
  for (const layerId in objectManagers) {
    const manager = objectManagers[layerId]
    if (manager?.objects?.getLength && manager.objects.getLength() > 0) {
      manager.setFilter(obj => filterFeature(obj))
    }
  }
}
function addLayerWithFilter(layerId) {
  if (objectManagers[layerId]) {
    objectManagers[layerId].setFilter(obj => filterFeature(obj))
    mapInstance.geoObjects.add(objectManagers[layerId])
  }
}
function removeLayer(layerId) {
  if (objectManagers[layerId]) mapInstance.geoObjects.remove(objectManagers[layerId])
}
watch([ageGroups, accessibility, svo], applyFiltersToAllLayers, { deep: true })
watch(visibleLayers, (newValues) => {
  for (const id in newValues) {
    removeLayer(id)
    if (newValues[id]) addLayerWithFilter(id)
  }
}, { deep: true })

function handlePreviewLeave() {
  isPreviewHovered.value = false
  setTimeout(() => { if (!isPreviewHovered.value) hoveredOrg.value = null }, 150)
}
const previewCardStyle = computed(() => ({
  position: 'fixed',
  top: previewCoords.value.y + 10 + 'px',
  left: previewCoords.value.x + 10 + 'px',
  zIndex: 20000,
  minWidth: '280px'
}))
function openPreviewCard(props, coords) {
  hoveredOrg.value = { name: props.name, address: props.address, website: props.website, phone: props.phone }
  previewCoords.value = coords
}
function handleSelectOrganization(org) {
  let foundFeature = null, foundLayer = null
  for (const layerId in objectManagers) {
    const om = objectManagers[layerId]
    const feats = om.objects.getAll()
    foundFeature = feats.find(f => f.properties.name === org.name && f.properties.address === org.address)
    if (foundFeature) { foundLayer = om; break }
  }
  if (foundFeature && foundLayer && mapInstance) {
    const coords = foundFeature.geometry.coordinates
    mapInstance.setCenter(coords, 17, { duration: 400 })
    selectedOrg.value = { ...foundFeature.properties }
  }
}

function initMap() {
  window.ymaps.ready(async () => {
    await nextTick()
    if (!mapRef.value) return
    mapInstance = new window.ymaps.Map(mapRef.value, {
      center: [54.7, 56.0],
      zoom: 7,
      controls: ['zoomControl']
    })
    await loadOrganizationsFromApi()
  })
}

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://api-maps.yandex.ru/2.1/?apikey=9dda63a0-a400-4fa1-bed5-024c6ad2056d&lang=ru_RU'
  script.onload = initMap
  document.head.appendChild(script)
})
</script>



<style scoped>
.panel-toggle-btn {
  position: absolute;
  top: 22px;
  left: 12px;
  background: #fff;
  border-radius: 9px;
  border: 1px solid #ddd;
  width: 36px; height: 36px;
  z-index: 2001;
  box-shadow: 0 2px 12px #0001;
  display: flex;
  align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.panel-toggle-btn:hover { background: #f3f6ff; }

.LeftPanel {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  width: 280px;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  font-family: 'Segoe UI', sans-serif;
}
.LeftPanel h3 {
  font-size: 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.LeftPanel .reset-button {
  font-size: 13px;
  color: #888;
  cursor: pointer;
}
.LeftPanel .reset-button:hover {
  text-decoration: underline;
}
.LeftPanel label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}
.apply-button {
  background-color: #04b;
  color: white;
  padding: 8px 16px;
  border: none;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 12px;
}
.apply-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.sidebar-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
  width: 350px;
  max-height: 90vh;
  overflow-y: auto;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1500;
}
.preview-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  padding: 12px;
  font-size: 13px;
  pointer-events: auto;
}
.map-loader, .map-error {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  background: white;
  border: 1.5px solid #eee;
  border-radius: 12px;
  padding: 26px 35px;
  font-size: 19px;
  color: #222;
  text-align: center;
  box-shadow: 0 2px 24px #0001;
}
.map-error {
  color: #d70000;
}
.retry-btn {
  background: #36c900;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 22px;
  font-size: 15px;
  cursor: pointer;
  margin-top: 14px;
}
.retry-btn:hover { background: #259a00; }
</style>
