import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/wx-login',
      name: 'wx-login',
      component: () => import('@/views/WxLoginView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/TicketList.vue'),
    },
    {
      path: '/tickets/new',
      name: 'create-ticket',
      component: () => import('@/views/CreateTicket.vue'),
    },
    {
      path: '/tickets/:number',
      name: 'ticket-detail',
      component: () => import('@/views/TicketDetail.vue'),
    },
    {
      path: '/projects',
      name: 'project-management',
      component: () => import('@/views/ProjectManagement.vue'),
    },
    {
      path: '/settings/prompt-prefix',
      name: 'prompt-settings',
      component: () => import('@/views/PromptSettings.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = window.localStorage.getItem('Authorization')
  if (to.name !== 'login' && to.name !== 'wx-login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
