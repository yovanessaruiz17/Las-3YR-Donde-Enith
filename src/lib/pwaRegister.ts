// Service Worker registration helper for Las 3YR PWA

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available; please refresh.
                  console.log('Nueva versión de Las 3YR PWA disponible.');
                } else {
                  // Content is cached for offline use.
                  console.log('Las 3YR PWA lista para uso sin conexión.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('Error al registrar Service Worker PWA:', error);
        });
    });
  }
}
