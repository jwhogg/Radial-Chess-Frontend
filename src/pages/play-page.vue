<template>
    <PageLayout>
      <div class="chessboard-container">
        <div v-if="loading">
          <PageLoader />
        </div>
        <div v-else>
          <TheChessboard @move="handleMove" :player-color="playerColor" @board-created="(api) => (boardAPI = api)"/>
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
  
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const loading = ref(true);  // Show loading spinner initially
  const messages = ref([]);
  const isConnected = ref(false);
  const pollingInterval = ref(null);
  const ws = ref(null);
  const playerColor = ref('white');

  let boardAPI;

  
  function handleMove(move) {
    console.log(move);
    let promotion = move.promotion ?? "None";
    let captured = move.captured ?? "None";
    let message = JSON.stringify({
        event: "game_move",
        data: {
            player: playerColor.value,
            this_move: {
                from: move.from,
                to: move.to,
                flags: move.flags,
                captured: captured,
                promotion: promotion,
            },
            status: "ClientMessage",
        }
    });

    console.log("message: ", message);

    // Ensure WebSocket is in OPEN state before sending the message
    if (ws.value.readyState === WebSocket.OPEN) {
        ws.value.send(message);
    } else {
        console.error("WebSocket connection is not open. Current state:", ws.value.readyState);
    }
}

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
      console.log("polling...");
      const response = await fetch('http://127.0.0.1:8080/matchmaking', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        // Matchmaking is complete, stop polling and open WebSocket
        clearInterval(pollingInterval.value);
        connectToWebSocket(token);
      }
    } catch (error) {
      console.error("Polling failed:", error);
    }
  };
  
  const connectToWebSocket = async (token) => {
    try {
      const socketUrl = "ws://127.0.0.1:8080/ws"; // Static WebSocket URL
      ws.value = new WebSocket(socketUrl);
  
      ws.value.onopen = () => {
        isConnected.value = true;
        console.log("WebSocket connection established.");
        ws.value.send(JSON.stringify({ type: "auth", token })); // Send token after opening
      };
  
      ws.value.onmessage = (event) => {
        console.log(event.data);
        messages.value.push(event.data);  // Store received messages
        const message = JSON.parse(event.data);
        console.log("Received message:", message);
  
        if (message.event === "game_initiated") {
          playerColor.value = message.playercolour;
          if (playerColor.value == "black") {boardAPI?.toggleOrientation()};
          console.log("set playerColour to: ", playerColor.value);
          loading.value = false;  // Stop loading spinner and show the chessboard
        }

        if (message.event === "game_move") {
            if (message.data.status == "EchoFailure") {
                boardAPI.undoLastMove();
            }
            else if (message.data.status == "EchoSuccess") {
                console.log("move validated!");
            }
            else if (message.data.status == "UpdateNewMove") {
                let opponent_move = message.data.this_move;
                console.log("opponent move: ", opponent_move)
                did_move = boardAPI.move({
                    from: opponent_move.from,
                    to: opponent_move.to,
                    promotion: (opponent_move.promotion !== "None" ? opponent_move.promotion : null)
                });

                console.log("move made? ", did_move);
            }
        }
      };
  
      ws.value.onclose = () => {
        isConnected.value = false;
        console.log("Disconnected from WebSocket");
      };
    } catch (error) {
      console.error("Error while connecting to WebSocket", error);
    }
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
  