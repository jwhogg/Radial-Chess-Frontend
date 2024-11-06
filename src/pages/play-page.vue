<template>
    <PageLayout>
      <div class="chessboard-container">
        <div v-if="loading">
          <PageLoader />
        </div>
        <div v-else>
          <TheChessboard @move="handleMove" :player-color="playerColor" @board-created="(api) => (boardAPI = api)" :board-config="boardConfig" @checkmate="handleCheckmate"/>
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
  import router from '../router';
  
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const loading = ref(true);
  const messages = ref([]);
  const isConnected = ref(false);
  const pollingInterval = ref(null);
  const ws = ref(null);
  const playerColor = ref('white');
  
  let boardAPI;
  
  let boardConfig = {
    coordinates: true,
    autoCastle: false,
    orientation: 'white',
  };
  
  // Function to wait for the server response with a timeout
  async function waitForResponse(expectedStatus, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const messageHandler = (event) => {
        const message = JSON.parse(event.data);
        if (message.event === "game_move" && message.data.status === expectedStatus) {
          ws.value.removeEventListener("message", messageHandler);  // Cleanup listener
          resolve(message);  // Resolve the promise with the message
        }
      };
  
      ws.value.addEventListener("message", messageHandler);
  
      // Set up a timeout
      const timer = setTimeout(() => {
        ws.value.removeEventListener("message", messageHandler);  // Cleanup listener
        reject(new Error("Timeout: No response from server within 5 seconds."));
      }, timeout);
    });
  }
  
  async function handleMove(move) {
    console.log(move);
    if (move.color !== playerColor.value.charAt(0).toLowerCase()) {
      return; // Return early if the move triggered is the opponent's
    }
    let promotion = move.promotion ?? "None";
    let captured = move.captured ?? "None";
    let message = JSON.stringify({
      event: "game_move",
      data: {
        player: playerColor.value,
        thisMove: {
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
  
      try {
        // Wait for the server response with timeout
        const response = await waitForResponse("EchoSuccess");
        console.log("Received response:", response);
      } catch (error) {
        console.error("Error waiting for response:", error.message);
        boardAPI.undoLastMove();
        loading.value = true;
        // Handle timeout error (e.g., notify the user, revert move, etc.)
      }
    } else {
      console.error("WebSocket connection is not open. Current state:", ws.value.readyState);
    }
  }

async function handleCheckmate(isMated) {
    alert(`${isMated} is mated`);
    if (playerColor.value == isMated) {
        let message = JSON.stringify({
        event: "game_surrender",
        data: {
            player: playerColor.value,
            status: "ClientMessage",
        }
        });

        if (ws.value.readyState === WebSocket.OPEN) {
            ws.value.send(message);
        
            try {
                // const response = await waitForResponse("ConfirmSurrendered");
                console.log("Received response:", response);
                alert("Game Over- Checkmate!");
                ws.value.close(1000, 'Closing connection normally');
            } catch (error) {
                console.error("Error waiting for response:", error.message);
                loading.value = true;
      }
        
        } else {
            console.log('cant send game surredner, ws isnt ready/open');
        }
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
      console.log('going to poll anyway..');
      pollingInterval.value = setInterval(() => pollMatchmaking(token), 2000);
    }
  };
  
  const pollMatchmaking = async (token) => {
    try {
      console.log("polling...");
      const response = await fetch('http://127.0.0.1:8080/matchmaking', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.status === 200) {
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

        // Send pings every 1 seconds to keep the connection alive
        setInterval(() => {
            if (ws.value.readyState === WebSocket.OPEN) {
                // const pingFrame = new Uint8Array([0x9]); // PING frame
                ws.value.send(0);
                // ws.value.send(JSON.stringify({ type: 'ping' })); // Send a ping message
                console.log('Ping sent');
            }
        }, 1000); // 1 seconds interval

        ws.value.addEventListener('close', function (event) {
            console.log("connection closed (caught by event listener):, ", event);
            router.push({ path: '/' });
        });
    };
  
      ws.value.onmessage = (event) => {
        console.log(event.data);
        messages.value.push(event.data);  // Store received messages
        if (event.data == "PONG") { return; }
        const message = JSON.parse(event.data);
        console.log("Received message:", message);
  
        if (message.event === "game_initiated") {
          playerColor.value = message.playercolour;
          boardConfig.orientation = message.playercolour;
          if (playerColor.value == "black") { boardAPI?.toggleOrientation(); }
          console.log("set playerColour to: ", playerColor.value);
          loading.value = false;  // Stop loading spinner and show the chessboard
        }
  
        if (message.event === "game_move") {
          if (message.data.status === "EchoFailure") {
            boardAPI.undoLastMove();
          }
          else if (message.data.status === "EchoSuccess") {
            console.log("move validated!");
          }
          else if (message.data.status === "UpdateNewMove") {
            let opponent_move = message.data.thisMove;
            console.log("opponent move: ", opponent_move)
            let did_move = boardAPI.move({
              from: opponent_move.from,
              to: opponent_move.to,
              promotion: (opponent_move.promotion !== "None" ? opponent_move.promotion : null)
            });
  
            console.log("move made? ", did_move);
          }
        }

        if (message.event == "game_surrender") {
            if (message.data.status === "OpponentSurrender") {
                console.log("opponent surrendered!");
                if (ws.value.readyState === WebSocket.OPEN) {
                    ws.value.close(1000, 'Closing connection normally');
                } else {
                    console.log("socket isnt open, cant close it!");
                }
            }
        }
      };
  
      ws.value.onclose = () => {
        isConnected.value = false;
        console.log("Disconnected from WebSocket");
        router.push({ path: '/' });
      };
    } catch (error) {
      console.error("Error while connecting to WebSocket", error);
    }
  };
  
  onMounted(() => {
    postMatchmaking();  // Send POST request to initiate matchmaking
  });
  
  onUnmounted(() => {
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
  