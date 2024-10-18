<template>
    <div>
      <button @click="callProtectedEndpoint">Call Protected API</button>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue'
  import { useAuth0 } from '@auth0/auth0-vue'
  
  export default {
    setup() {
      const { getAccessTokenSilently, isAuthenticated, user } = useAuth0()
      const responseData = ref(null)
  
      const callProtectedEndpoint = async () => {
        if (isAuthenticated.value) {
          try {
            // Get the Auth0 access token
            const token = await getAccessTokenSilently({
                audience: import.meta.env.VITE_API_IDENTIFIER,
            })
  
            // Make an HTTP request to the Rust backend
            const response = await fetch('http://127.0.0.1:8080/matchmaking', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,  // Include the token in the header
                'Content-Type': 'application/json',
              },
            })
  
            if (response.ok) {
              const data = await response.json()
              responseData.value = data
              console.log('Protected data:', data)
            } else {
              console.error('Failed to fetch protected resource:', response.status)
            }
          } catch (error) {
            console.error('Error fetching token or data:', error)
          }
        }
      }
  
      return {
        callProtectedEndpoint,
        responseData,
      }
    }
  }
  </script>
  