import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import directives from './directives';
import './assets/styles/main.css';

const app = createApp(App);

// Install plugins
app.use(createPinia());
app.use(router);
app.use(directives);

app.mount('#app');
