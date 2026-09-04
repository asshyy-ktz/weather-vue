import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'forecast',
      component: () => import('@/views/ForecastView.vue'),
    },
    {
      path: '/location/:id',
      name: 'forecast-location',
      component: () => import('@/views/ForecastView.vue'),
      props: true,
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/RadarView.vue'),
    },
    {
      path: '/locations',
      name: 'locations',
      component: () => import('@/views/LocationsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
