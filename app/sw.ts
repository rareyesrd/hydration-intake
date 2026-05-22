import { defaultCache } from "@serwist/next/worker";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const hasFirebaseMessagingConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
);

if (hasFirebaseMessagingConfig) {
  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(firebaseApp);

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Hydration check";
    const data = payload.data ?? {};
    const targetUrl = data.url ?? "/dashboard";

    self.registration.showNotification(title, {
      body:
        payload.notification?.body ??
        "Pause the work block and take a glass before the next rep.",
      icon: data.icon ?? "/icons/icon-192.png",
      badge: data.badge ?? "/icons/favicon-32.png",
      tag: data.tag ?? "hydration-reminder",
      data: {
        url: targetUrl
      }
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    typeof event.notification.data?.url === "string"
      ? event.notification.data.url
      : "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const absoluteTarget = new URL(targetUrl, self.location.origin).href;
      const existingClient = clients.find((client) => client.url === absoluteTarget);

      if (existingClient && "focus" in existingClient) {
        return existingClient.focus();
      }

      return self.clients.openWindow(absoluteTarget);
    })
  );
});

const runtimeCaching = [
  ...defaultCache,
  {
    matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
      sameOrigin && request.destination === "document",
    handler: new NetworkFirst({
      cacheName: "hydration-pages",
      networkTimeoutSeconds: 4
    })
  },
  {
    matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
      sameOrigin && request.destination === "script",
    handler: new StaleWhileRevalidate({
      cacheName: "hydration-scripts"
    })
  },
  {
    matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
      sameOrigin && request.destination === "style",
    handler: new StaleWhileRevalidate({
      cacheName: "hydration-styles"
    })
  },
  {
    matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
      sameOrigin && request.destination === "image",
    handler: new StaleWhileRevalidate({
      cacheName: "hydration-images"
    })
  }
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        }
      }
    ]
  }
});

serwist.addEventListeners();
