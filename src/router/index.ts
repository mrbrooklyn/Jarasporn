import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import SalesView from '../views/SalesView.vue'
import SalesHistoryView from '../views/SalesHistoryView.vue'
import ManagementView from '../views/ManagementView.vue'
import ReportsView from '../views/ReportsView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/sales', component: SalesView },
    { path: '/sales/history', component: SalesHistoryView },
    { path: '/manage/:kind', component: ManagementView, props: true },
    { path: '/reports', component: ReportsView },
  ],
})
