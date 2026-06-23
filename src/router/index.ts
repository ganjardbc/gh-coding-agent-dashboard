import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import NewTaskPage from '@/pages/NewTaskPage.vue'
import JobsPage from '@/pages/JobsPage.vue'
import JobDetailPage from '@/pages/JobDetailPage.vue'
import RunsPage from '@/pages/RunsPage.vue'
import RunDetailPage from '@/pages/RunDetailPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardPage },
    { path: '/new-task', component: NewTaskPage },
    { path: '/jobs', component: JobsPage },
    { path: '/jobs/:id', component: JobDetailPage },
    { path: '/runs', component: RunsPage },
    { path: '/runs/:file', component: RunDetailPage },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
