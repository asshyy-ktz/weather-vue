import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Register the PWA service worker (generateSW + injectRegister: false means
// we own registration). Wrapped so the app still runs fine outside of a
// built/served context where the virtual module or SW isn't available.
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true })
    })
    .catch(() => {
      // Virtual module only exists in a Vite build with vite-plugin-pwa active.
    })
}

