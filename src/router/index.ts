import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue')
    },
    {
      path: '/kanban',
      name: 'kanban',
      component: () => import('@/views/KanbanView.vue')
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: () => import('@/views/PomodoroView.vue')
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('@/views/HabitView.vue')
    },
    {
      path: '/quadrant',
      name: 'quadrant',
      component: () => import('@/views/QuadrantView.vue')
    },
    {
      path: '/countdowns',
      name: 'countdowns',
      component: () => import('@/views/CountdownView.vue')
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/StatisticsView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router