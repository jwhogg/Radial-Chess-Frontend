<template>
    <div class="container">
        <div class="player-stats" v-if="isAuthenticated">
        <h4>Player Stats</h4>
        <h6>Wins: {{ data?.wins }}</h6>
        <h6>Draws: {{ data?.draws }}</h6>
        <h6>Losses: {{ data?.losses }}</h6>
        </div>
    </div>
</template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useAuth0 } from '@auth0/auth0-vue'
  
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  const data = ref(null)
  let intervalId
  
  // Fetch data function
  const fetchData = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: import.meta.env.VITE_API_IDENTIFIER,
      })
  
      const response = await fetch('http://127.0.0.1:8080/playerstats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
  
      const json = await response.json()
      console.log('Wins:', json.wins)
      console.log('Draws:', json.draws)
      console.log('Losses:', json.losses)
      data.value = json
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  
  onMounted(() => {
    console.log('Mounted...')
    if (isAuthenticated.value) {
      fetchData() // Initial fetch
      intervalId = setInterval(fetchData, 5000) // Fetch every 5 seconds
    }
  })
  
  onUnmounted(() => clearInterval(intervalId)) // Stop interval on unmount
  
  </script>
  
  <style>
/* Main container styling */
/* Centering container */
.container {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Start alignment allows for additional vertical spacing */
  height: 100vh;
  margin-top: 40px; /* Adjust this value to control how far down from the top */
}

.player-stats {
  background: linear-gradient(135deg, #B8B08D, #F2D492); /* Orange gradient */
  color: #ffffff; /* White text for contrast */
  border-radius: 11px;
  padding: 20px;
  width: 180px;  /* Narrower width for a playing card look */
  height: 280px; /* Taller height for a playing card look */
  box-shadow: 0 12px 24px #3d3c39;
  font-family: Arial, sans-serif;
  text-align: center;
  transition: transform 0.5s ease, box-shadow 1s ease;
  perspective: 1000px; /* Perspective for 3D effect */
  transform-style: preserve-3d;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Tilt effect on hover */
.player-stats:hover {
  transform: rotateX(10deg) rotateY(-10deg); /* Tilts the card towards the viewer */
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
}

/* Gradient gleam effect */
.player-stats::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(75deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
  transform: rotate(45deg);
  transition: opacity 0.3s ease;
  opacity: 0;
}

/* Show gleam effect on hover */
.player-stats:hover::before {
  opacity: 0.6;
  animation: gleam 1s ease-out;
}

/* Text styling */
.player-stats p {
  margin: 8px 0;
  font-size: 1em;
}

.player-stats p:first-of-type {
  font-size: 1.2em;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
}

.player-stats p span {
  font-weight: bold;
  color: #fff;
}

/* Keyframe for gleam animation */
@keyframes gleam {
  from {
    transform: translate(-100%, -100%) rotate(50deg);
  }
  to {
    transform: translate(100%, 100%) rotate(45deg);
  }
}


  </style>