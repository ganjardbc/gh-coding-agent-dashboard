import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import NewTaskPage from '@/pages/NewTaskPage.vue'
import RepositoriesPage from '@/pages/RepositoriesPage.vue'
import JobsPage from '@/pages/JobsPage.vue'
import GitHubJobsPage from '@/pages/GitHubJobsPage.vue'
import JobDetailPage from '@/pages/JobDetailPage.vue'
import RunsPage from '@/pages/RunsPage.vue'
import RunDetailPage from '@/pages/RunDetailPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import AgentsPage from '@/pages/AgentsPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardPage },
    { path: '/new-task', component: NewTaskPage },
    { path: '/repositories', component: RepositoriesPage },
    { path: '/jobs', component: JobsPage },
    { path: '/github-jobs', component: GitHubJobsPage },
    { path: '/jobs/:id', component: JobDetailPage },
    { path: '/runs', component: RunsPage },
    { path: '/runs/:file', component: RunDetailPage },
    { path: '/settings', component: SettingsPage },
    { path: '/agents', component: AgentsPage },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
