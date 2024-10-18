<template>
  <div @click="mobileMenuStore.closeMobileMenu" class="mobile-nav-bar__brand">
    <router-link to="/">
      <img
        class="mobile-nav-bar__logo"
        src="../../../assets/logo.png"
        width="32"
        height="32"
      />
    </router-link>
  </div>
</template>

<script setup>
import { mobileMenuStore } from "./mobile-menu.store.js";
</script>
