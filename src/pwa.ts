import { registerSW } from "virtual:pwa-register";

/** Registra service worker para PWA (cache + atualização automática). */
export function registerPwaServiceWorker() {
  if (import.meta.env.DEV) {
    registerSW({ immediate: true });
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (registration) {
        window.setInterval(
          () => {
            void registration.update();
          },
          60 * 60 * 1000,
        );
      }
    },
  });
}
