import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '../views/LoginView.vue'
import TestView from '../views/TestView.vue'
import ResultView from '../views/ResultView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
      meta: { requiresAuth: true }
    },
    {
      path: '/result/:id',
      name: 'result',
      component: ResultView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    }
  ]
})

// 인증 가드
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.restoreSession()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router