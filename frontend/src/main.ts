import { createApp } from "vue";
import { createPinia } from "pinia";
import "remixicon/fonts/remixicon.css";
import App from "./App.vue";
import router from "./router";

// Initialize Firebase FIRST, before anything else
import { auth } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

console.log("🚀 Initializing Vue app...");

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Wait for Firebase auth to initialize
let authInitialized = false;

onAuthStateChanged(auth, (user) => {
  if (!authInitialized) {
    authInitialized = true;
    console.log("✅ Auth initialized. Mounting app...");
    app.mount("#app");
  }
});
