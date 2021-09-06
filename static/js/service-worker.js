/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License")
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = "precache-v45"
const RUNTIME = "runtime"
const OFFLINE_URL = "/public/offline.html"

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  "/public/food-donations",
  "/public/1689",
  "/public/offline.html",
  "/public/login_error.html",
  "/public/css/bulma.min.css",
  "/public/css/index.css",
  "/public/css/plyr.css",
  "/public/js/plyr.min.js",
  "/public/js/pwacompat.min.js",
  "/public/img/dark_embroidery.png",
  "/public/icons/png/android-icon-192x192.png",
  "/public/icons/png/android-icon-144x144.png",
  "/public/icons/png/android-icon-96x96.png",
  "/public/icons/png/android-icon-72x72.png",
  "/public/icons/png/android-icon-48x48.png",
  "/public/icons/png/android-icon-36x36.png",
  "/public/icons/png/apple-icon.png",
  "/public/icons/png/apple-icon-57x57.png",
  "/public/icons/png/apple-icon-60x60.png",
  "/public/icons/png/apple-icon-72x72.png",
  "/public/icons/png/apple-icon-76x76.png",
  "/public/icons/png/apple-icon-114x114.png",
  "/public/icons/png/apple-icon-120x120.png",
  "/public/icons/png/apple-icon-144x144.png",
  "/public/icons/png/apple-icon-152x152.png",
  "/public/icons/png/apple-icon-180x180.png",
  "/public/icons/png/apple-icon-precomposed.png",
  "/public/icons/png/ms-icon-70x70.png",
  "/public/icons/png/ms-icon-144x144.png",
  "/public/icons/png/ms-icon-150x150.png",
  "/public/icons/png/ms-icon-310x310.png",
  "/public/icons/png/logo.png",
  "/public/icons/png/white-logo.png",
  "/public/icons/png/favicon-16x16.png",
  "/public/icons/png/favicon-32x32.png",
  "/public/icons/png/favicon-96x96.png",
  "/public/icons/svg/live.svg",
  "/public/icons/svg/youtube.svg",
  "/public/icons/svg/facebook.svg",
  "/public/icons/svg/basket.svg",
  "/public/icons/svg/prayer.svg",
  "/public/icons/svg/account.svg",
  "/public/icons/svg/settings.svg",
  "/public/icons/svg/install.svg",
  "/public/icons/svg/date.svg",
  "/public/icons/svg/daily-devo.svg",
  "/public/icons/svg/more.svg",
  "/public/icons/svg/sermon.svg",
  "/public/icons/svg/privacy-policy.svg",
  "/public/icons/svg/terms-conditions.svg",
  "/public/icons/svg/1689.svg",
  "/public/icons/svg/sundayschool.svg",
  "/public/manifest.json",
]

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
          return true
        }).map(function(cacheName) {
          return caches.delete(cacheName)
        })
      )
    })
  )
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  )
})

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
  const currentCaches = [PRECACHE, RUNTIME]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName))
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete)
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported.
          const preloadResponse = await event.preloadResponse
          if (preloadResponse) {
            return preloadResponse
          }

          const networkResponse = await fetch(event.request)
          return networkResponse
        } catch (error) {
          // catch is only triggered if an exception is thrown, which is likely
          // due to a network error.
          // If fetch() returns a valid HTTP response with a response code in
          // the 4xx or 5xx range, the catch() will NOT be called.
          console.log("Fetch failed; returning offline page instead.", error)

          const cache = await caches.open(PRECACHE)
          const cachedResponse = await cache.match(OFFLINE_URL)
          return cachedResponse
        }
      })()
    )
  } else if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return
  } else {  
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request)
      })
    )
  }
})
