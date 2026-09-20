// Service worker: shows proactive nudges pushed by the daily cron and opens the chat on click.
self.addEventListener("push", (event) => {
  let data = { title: "Walrus Coach", body: "Your coach has something for you.", url: "/chat" };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icon.png", badge: "/icon.svg", data: { url: data.url }, tag: "walrus-coach-nudge" }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/chat";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.includes(url));
    return open ? open.focus() : self.clients.openWindow(url);
  }));
});
