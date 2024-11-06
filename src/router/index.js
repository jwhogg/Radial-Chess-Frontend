import CallbackPage from "@/pages/callback-page.vue";
import HomePage from "@/pages/home-page.vue";
import { authGuard } from "@auth0/auth0-vue";
import { createRouter, createWebHistory } from "vue-router";

const NotFoundPage = () => import("@/pages/not-found-page.vue");
const ProfilePage = () => import("@/pages/profile-page.vue");
const TestPage = () => import("@/pages/test-page.vue");
const PlayPage = () => import("@/pages/play-page.vue");
const TestWebsocket = () => import("@/pages/test-websocket.vue");

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/profile",
    name: "profile",
    component: ProfilePage,
    beforeEnter: authGuard,
  },
  {
    path: "/play-game",
    name: "play-game",
    component: PlayPage,
    beforeEnter: authGuard,
  },
  {
    path: "/websocket",
    name: "websocket",
    component: TestWebsocket,
    beforeEnter: authGuard,
  },
  {
    path: "/callback",
    name: "callback",
    component: CallbackPage,
  },
  {
    path: "/test",
    name: "test",
    component: TestPage,
    beforeEnter: authGuard,
  },
  {
    path: "/:catchAll(.*)",
    name: "Not Found",
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
