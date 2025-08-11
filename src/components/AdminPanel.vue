<template>
  <div class="admin-panel-outer">
    <div class="admin-panel">
      <!-- Панель действий -->
      <div class="panel-actions">
        <button class="close-btn" @click="goHome" title="Закрыть">×</button>
        <button v-if="isLoggedIn" class="logout-btn" @click="logout" title="Выйти">Выйти</button>
      </div>

      <h2>Админ-панель</h2>
      <div v-if="!isLoggedIn" class="login-form">
        <input v-model="login" placeholder="Логин" />
        <input v-model="password" type="password" placeholder="Пароль" />
        <button @click="loginAdmin">Войти</button>
        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div v-else>
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-btn', {active: activeTab === tab.value}]"
            @click="activeTab = tab.value"
          >{{ tab.label }}</button>
        </div>

        <div class="filters">
          <label>Министерство:&nbsp;
            <select v-model="selectedMinistry">
              <option value="">Все</option>
              <option v-for="ministry in ministries" :key="ministry" :value="ministry">
                {{ ministry }}
              </option>
            </select>
          </label>
        </div>

        <table v-if="filteredRequests.length" class="requests-table">
          <thead>
            <tr>
              <th>Организация</th>
              <th>Министерство</th>
              <th>Контактное лицо</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Пароль (hash)</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req._id">
              <td><b>{{ req.orgName }}</b></td>
              <td>{{ req.ministry }}</td>
              <td>{{ req.contactName }}</td>
              <td>{{ req.contactPhone }}</td>
              <td>{{ req.email }}</td>
              <td style="font-size:11px; color:#555;">{{ req.passwordHash }}</td>
              <td>
                <span :style="{ color: statusColor(req.status) }">{{ req.status }}</span>
              </td>
              <td>
                <template v-if="req.status==='pending'">
                  <button class="approve-btn" @click="approve(req._id)">✅</button>
                  <button class="reject-btn" @click="reject(req._id)">❌</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-requests">Нет заявок</div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_BASE } from '@/apiBase'

const MINISTRIES = [
  'Министерство просвещения Р.Б.',
  'Министерство спорта Р.Б.',
  'Министерство культуры Р.Б.',
  'Министерство здравоохранения Р.Б.',
  'Министерство семьи, труда и социальной защиты населения Р.Б.'
];

export default {
  data() {
    return {
      login: "",
      password: "",
      isLoggedIn: false,
      error: "",
      requests: [],
      token: "",
      tabs: [
        { label: "Заявки", value: "pending" },
        { label: "Подтвержденные", value: "approved" },
        { label: "Отклонённые", value: "rejected" }
      ],
      activeTab: "pending",
      ministries: MINISTRIES,
      selectedMinistry: ""
    };
  },
  computed: {
    filteredRequests() {
      return this.requests.filter(req =>
        req.status === this.activeTab &&
        (this.selectedMinistry === "" || req.ministry === this.selectedMinistry)
      );
    }
  },
  methods: {
    async loginAdmin() {
      this.error = "";
      try {
        const res = await fetch(`${API_BASE}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: this.login, password: this.password }),
        });
        const data = await res.json();
        if (res.ok) {
          this.isLoggedIn = true;
          this.token = data.token;
          this.fetchRequests();
        } else {
          this.error = data.error || "Ошибка входа";
        }
      } catch {
        this.error = "Нет соединения с сервером";
      }
    },
    async fetchRequests() {
      try {
        const res = await fetch(`${API_BASE}/admin/registration-requests`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (!res.ok) throw new Error("Ошибка загрузки заявок");
        this.requests = await res.json();
      } catch {
        this.error = "Ошибка получения заявок";
      }
    },
    async approve(id) {
      try {
        await fetch(`${API_BASE}/admin/registration-request/${id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.fetchRequests();
      } catch {
        this.error = "Ошибка подтверждения";
      }
    },
    async reject(id) {
      try {
        await fetch(`${API_BASE}/admin/registration-request/${id}/reject`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.fetchRequests();
      } catch {
        this.error = "Ошибка отклонения";
      }
    },
    statusColor(status) {
      return status === "approved" ? "green" : status === "rejected" ? "red" : "gray";
    },
    logout() {
      this.isLoggedIn = false;
      this.token = "";
      this.requests = [];
      this.login = "";
      this.password = "";
      this.selectedMinistry = "";
    },
    goHome() {
      this.$router.push("/");
    }
  },
};
</script>

<style scoped>
/* стили без изменений */
.admin-panel-outer { height: 100vh; min-height: 100vh; overflow-y: auto; background: #fafbfc; display:flex; align-items:flex-start; justify-content:center; }
.admin-panel { max-width:1100px; margin:32px 0 0 0; padding:18px 20px 40px 20px; background:#fff; border-radius:16px; box-shadow:0 4px 16px #0001; font-family:"Segoe UI","Arial",sans-serif; min-height:80vh; position:relative; width:100%; }
.panel-actions { position:absolute; top:20px; right:30px; display:flex; gap:12px; z-index:10; }
.logout-btn { background:#eee; border:none; padding:7px 18px; border-radius:6px; cursor:pointer; font-size:15px; transition:background .16s, color .16s; }
.logout-btn:hover { background:#ffeaea; color:#e41; }
.close-btn { font-size:23px; padding:0 14px; background:#eaf2ff; border:none; border-radius:7px; color:#444; cursor:pointer; font-weight:bold; transition:background .15s, color .15s; }
.close-btn:hover { background:#f6dada; color:#e41; }
h2 { margin-bottom:18px; }
.tabs { display:flex; gap:7px; margin-bottom:15px; margin-top:7px; }
.tab-btn { background:#f5f8fa; border:1px solid #e0e8ee; border-radius:7px 7px 0 0; padding:7px 26px; font-size:16px; font-weight:500; color:#888; cursor:pointer; transition:background .13s, color .13s; }
.tab-btn.active { background:#fff; color:#2987f5; border-bottom:2px solid #fff; font-weight:bold; }
.filters { margin-bottom:13px; margin-top:3px; }
.filters select { border-radius:6px; border:1px solid #c3d4e2; padding:6px 12px; font-size:15px; background:#f9fbff; }
.login-form input { margin:0 8px 8px 0; padding:7px; border-radius:5px; border:1px solid #bbb; }
.login-form button { padding:7px 17px; border-radius:5px; border:none; background:#359; color:#fff; cursor:pointer; }
.error { color:#e55; margin-top:7px; }
.requests-table { width:100%; border-collapse:collapse; margin-top:18px; background:#fff; border-radius:7px; overflow:hidden; box-shadow:0 2px 6px #0002; }
.requests-table th, .requests-table td { border:1px solid #eaeaea; padding:7px 10px; text-align:left; }
.requests-table th { background:#f0f3f7; font-weight:600; }
.approve-btn, .reject-btn { font-size:18px; margin:0 3px; padding:3px 7px; border:1px solid #bbb; border-radius:4px; cursor:pointer; }
.approve-btn { background:#d7f9d7; } .reject-btn { background:#ffd5d5; }
.no-requests { text-align:center; margin-top:28px; color:#666; font-size:18px; }
</style>
