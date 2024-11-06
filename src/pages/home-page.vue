<template>
  <div v-if="isAuthenticated">
  </div>
  <PageLayout>
    <PlayerStats> </PlayerStats>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/components/page-layout.vue";
import { useAuth0 } from '@auth0/auth0-vue';
import PlayerStats from "../components/player-stats.vue";

const {isAuthenticated} = useAuth0();

</script>
