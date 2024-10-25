<!-- <template>
    <PageLayout>
        <div class="chessboard-container">
            <TheChessboard />
        </div>
    </PageLayout>
</template>
  
<script setup>
import PageLayout from "@/components/page-layout.vue";
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
</script>

<style scoped>
/* More specific selector */
.vue3-chessboard {
    color: red;
}
</style> -->

<template>
    <PageLayout>
      <div class="chessboard-container">
        <div v-if="loading">
          <PageLoader />
        </div>
        <div v-else>
          <TheChessboard />
        </div>
      </div>
    </PageLayout>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import PageLayout from "@/components/page-layout.vue";
  import { TheChessboard } from 'vue3-chessboard';
  import 'vue3-chessboard/style.css';
  import PageLoader from "@/components/page-loader.vue";
  
  import { useAuth0 } from '@auth0/auth0-vue';
import PageLoader from '../components/page-loader.vue';
  
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const loading = ref(true);  // Show loading spinner initially
  const pollingInterval = ref(null);
  const ws = ref(null);
  
  const postMatchmaking = async () => {
  if (!isAuthenticated.value) return;

  try {
    const token = await getAccessTokenSilently({
      audience: import.meta.env.VITE_API_IDENTIFIER,
    });

    // POST request to initiate matchmaking
    const response = await fetch('http://127.0.0.1:8080/matchmaking', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Matchmaking initiated.');
      // Start polling for matchmaking status
      pollingInterval.value = setInterval(() => pollMatchmaking(token), 2000);
    } else {
      console.error('Failed to initiate matchmaking:', response.status);
    }
  } catch (error) {
    console.error('Error during POST /matchmaking:', error);
  }
};

const pollMatchmaking = async (token) => {
  try {
    const response = await fetch('http://127.0.0.1:8080/matchmaking', {
      headers: { //this is a GET
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
        // Matchmaking is complete, stop polling and open WebSocket
        clearInterval(pollingInterval.value);
        openWebSocket(token);
    }
  } catch (error) {
    console.error("Polling failed:", error);
  }
};

const openWebSocket = (token) => {
  const socketUrl = `ws://127.0.0.1:8080/ws?token=${token}`;
  ws.value = new WebSocket(socketUrl);

  ws.value.onopen = () => {
    console.log("WebSocket connection established.");
  };

  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("message from server:", message);
    if (message.type === "game_initiated") {
      // Stop loading spinner and display the chessboard
      loading.value = false;
    }
  };

  ws.value.onclose = () => {
    console.log("Disconnected from WebSocket");
  };
};

onMounted(() => {
  postMatchmaking();  // Send POST request to initiate matchmaking
});

onUnmounted(() => {
  // Clean up when the component is unmounted
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<style scoped>
.chessboard-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;  /* Full page height */
}

.vue3-chessboard {
  color: red;
}
</style>