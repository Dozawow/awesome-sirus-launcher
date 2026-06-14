import { createApp } from 'vue'
import App from './App.vue'
import { initializeAkatsukiBackground } from './shared/akatsukiBackground'
import './styles.css'

initializeAkatsukiBackground()
createApp(App).mount('#app')
