/**
 * Service worker for CrossFriend browser notifications.
 *
 * Deliberately tiny, and it must stay that way. A service worker sits between the site and the
 * network for every request in its scope, is cached aggressively by the browser, survives a deploy,
 * and can break the whole site for anyone who has it installed — including people who never come
 * back to pick up a fix. So this does exactly two things: show a notification, and handle a click on
 * one. It never touches `fetch`. Nothing here intercepts, caches or rewrites a single request.
 *
 * If offline support is ever wanted, it belongs in a separate, deliberately versioned worker with a
 * kill switch — not bolted onto the one that carries notifications.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    // A push whose body is not our JSON is not ours to interpret, and showing "undefined" to a
    // customer would be worse than showing nothing at all.
    return
  }

  const title = payload.title || "CrossFriend"

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: payload.image || "/favicon.ico",
      badge: "/favicon.ico",
      /**
       * The same tag replaces rather than stacks.
       *
       * This matters more here than it does for the team board: a customer who has not opened the
       * site in a fortnight should find one current message waiting, not a column of old offers to
       * dismiss one at a time. That is the difference between a notification and a nuisance, and the
       * nuisance is uninstalled permanently.
       */
      tag: payload.tag || "crossfriend",
      data: { url: payload.url || "/" },
      renotify: false,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification.data?.url || "/"

  /**
   * Focus a tab that is already on that page rather than opening another one.
   *
   * Compared by pathname because an open tab usually carries query parameters — a campaign tag, a
   * filter — and an exact match would miss it and open a duplicate anyway.
   */
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).pathname === target.split("?")[0] && "focus" in client) {
          return client.focus()
        }
      }
      for (const client of clients) {
        if ("navigate" in client) return client.navigate(target).then((c) => c && c.focus())
      }
      return self.clients.openWindow(target)
    })
  )
})
