<!-- C:\Google-Hack\Projects\AnalystIQ\frontend\src\App.vue -->

<template>
  <div id="app">
    <!-- Add navbar to all pages -->
    <Navbar v-if="showNavbar" />
    <AppHeader v-if="showAppHeader" />

    <!-- Router content -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "./components/Organisms/Navbar.vue";
import AppHeader from "./components/Organisms/AppHeader.vue";

const route = useRoute();

// Show landing navbar on home and public pages
const showNavbar = computed(() => {
  const publicPages = ["/", "/about", "/login"];
  return publicPages.includes(route.path);
});

// Show app header on application pages
const showAppHeader = computed(() => {
  return route.path.startsWith("/app");
});
</script>

<style lang="scss">
@import "@/styles/global.scss";

#app {
  min-height: 100vh;
  background-color: $color-background;
}
</style>
