import { createAuth0 } from "@auth0/auth0-vue";
import { createApp } from "vue";
import App from "./app.vue";
import "./assets/css/styles.css";
import router from "./router";

const app = createApp(App);

app
  .use(router)
  .use(
    createAuth0({
      domain: import.meta.env.VITE_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: "http://localhost:4040/callback",
        audience: import.meta.env.VITE_API_IDENTIFIER,
      },
    })
  )
  .mount("#root");
