<template>
    <div>
      <div v-if="isConnected">Connected to WebSocket</div>
      <div v-if="!isConnected">Connecting to WebSocket...</div>
      <div>
        <h3>Messages:</h3>
        <ul>
          <li v-for="(message, index) in messages" :key="index">{{ message }}</li>
        </ul>
      </div>
    </div>
</template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { useAuth0 } from '@auth0/auth0-vue';
  
  export default {
    setup() {
      const messages = ref([]);
      const isConnected = ref(false);
      const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
      const connectToWebSocket = async () => {
        if (isAuthenticated.value) {
          try {
            // Get the Auth0 access token
            const token = await getAccessTokenSilently({
              audience: import.meta.env.VITE_API_IDENTIFIER,
            });
  
            // Add the token as a query parameter in the WebSocket URL
            // const socketUrl = `ws://127.0.0.1:8080/ws?token=${token}`;
            const socketUrl = "ws://127.0.0.1:8080/ws";
            const ws = new WebSocket(socketUrl);
  
            ws.onopen = () => {
              isConnected.value = true;
              console.log("WebSocket connection established.");
              ws.send(JSON.stringify({ type: "auth", token }));
            };
  
            ws.onmessage = (event) => {
              // Add received messages to the list
              messages.value.push(event.data);
              console.log("Received message:", event.data);
            };
  
            ws.onclose = () => {
              isConnected.value = false;
              console.log("Disconnected from WebSocket");
            };
  
          } catch (error) {
            console.error("Error while connecting to WebSocket", error);
          }
        } else {
          console.log("User is not authenticated.");
        }
      };
  
      onMounted(() => {
        connectToWebSocket();
      });
  
      return {
        messages,
        isConnected,
      };
    },
  };
  </script>
  
  <style scoped>
  /* Add your styles here */
  </style>
  