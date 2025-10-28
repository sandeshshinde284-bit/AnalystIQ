// C:\Google-Hack\Projects\AnalystIQ\frontend\src\main.ts

import { createApp } from "vue";
import { createPinia } from "pinia";
import "remixicon/fonts/remixicon.css";
import App from "./App.vue";
import router from "./router";
import { initializeApp } from "firebase/app";

// ✅ Initialize Firebase (Vue CLI uses process.env)
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);

const app = createApp(App);

app.use(createPinia()); // Use Pinia
app.use(router);

app.mount("#app");
