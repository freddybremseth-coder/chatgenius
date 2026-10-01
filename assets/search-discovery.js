/* Measure public ChatGenius source arrivals without tracking individuals.
 * The actual referrer URL, searches, conversations and URL queries stay in
 * the browser. An arrival is captured only after RealtyFlow confirms storage.
 */
(function () {
  "use strict";
  var current = window.location;
  if (current.protocol !== "https:" ||
      !/^(?:www\.)?chatgenius\.pro$/i.test(current.hostname)) return;

  var path = current.pathname || "/";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 220 ||
      /[\x00-\x1f@?#]/.test(path) ||
      /%(?:00|0[0-9a-f]|1[0-9a-f]|2f|3f|23|40)/i.test(path) ||
      /^\/(?:api|app|admin|auth|account|konto|crm|min-side|nedlasting|avtale|checkout|private)(?:\/|\.|$)/i.test(path) ||
      /(?:^|\/)(?:nedlasting|avtale)(?:\.html)?$/i.test(path)) return;

  var raw = document.referrer || "";
  if (!raw || raw.length > 4096) return;
  var source;
  var host;
  try {
    var origin = new URL(raw);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.port) return;
    host = origin.hostname.toLowerCase();
    var known = [
      [/^gemini\.google\.com$/i, "google_gemini"],
      [/(^|\.)google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/i, "google_search"],
      [/(^|\.)bing\.com$/i, "bing_search"],
      [/(^|\.)chatgpt\.com$/i, "chatgpt"],
      [/^copilot\.microsoft\.com$/i, "microsoft_copilot"],
      [/(^|\.)perplexity\.ai$/i, "perplexity"],
      [/^search\.brave\.com$/i, "brave_search"],
      [/(^|\.)duckduckgo\.com$/i, "duckduckgo"]
    ];
    for (var i = 0; i < known.length; i++) {
      if (known[i][0].test(host)) { source = known[i][1]; break; }
    }
    if (!source) return;
  } catch (_) { return; }

  var storageKey = "chatgenius:search-discovery:" + path + ":" + source;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
  } catch (_) {
    // Unavailable session storage is not evidence that a visit was measured.
  }

  void fetch("https://realtyflow.chatgenius.pro/api/public/search-discovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: path, referrer: "https://" + host + "/" }),
    keepalive: true
  }).then(function (response) {
    if (response.status !== 204) return;
    try {\n      window.sessionStorage.setItem(storageKey, "1");\n      window.sessionStorage.setItem("chatgenius:discovery-source", source);\n      window.sessionStorage.setItem("chatgenius:discovery-landing", path);\n    } catch (_) {}
  }).catch(function () {});
})();


/* Website conversion tracking.
 * Records only coarse CTA categories and optional known search/AI attribution
 * already captured by the arrival tracker. No user IDs, IPs, email addresses,
 * query strings or raw external URLs are sent.
 */
(function () {
  "use strict";
  var current = window.location;
  if (current.protocol !== "https:" ||
      !/^(?:www\.)?chatgenius\.pro$/i.test(current.hostname)) return;
  if (!document || typeof document.addEventListener !== "function") return;

  function cleanPath(value) {
    if (!value || typeof value !== "string") return "";
    try {
      var u = new URL(value, current.origin);
      if (u.origin !== current.origin) return u.pathname || "";
      return u.pathname || "/";
    } catch (_) {
      return "";
    }
  }

  function classifyLink(anchor) {
    var href = anchor.getAttribute("href") || "";
    if (!href) return null;

    if (/^mailto:post@chatgenius\.pro(?:\?|$)/i.test(href)) {
      return { eventType: "email", target: "email_contact" };
    }
    if (/^https:\/\/appointment\.chatgenius\.pro\/booking\.html(?:\?|$)/i.test(href)) {
      return { eventType: "booking", target: "booking" };
    }
    if (/^https:\/\/realtyflow\.chatgenius\.pro\/demo\/?(?:\?|$)/i.test(href)) {
      return { eventType: "demo", target: "realtyflow_demo" };
    }
    if (/^https:\/\/family\.chatgenius\.pro\/demo\/?(?:\?|$)/i.test(href)) {
      return { eventType: "demo", target: "family_demo" };
    }
    if (/^https:\/\/remaster\.freddybremseth\.com\/demo\/?(?:\?|$)/i.test(href)) {
      return { eventType: "demo", target: "remaster_demo" };
    }

    var path = cleanPath(href);
    if (path === "/kom-i-gang/" || path === "/kom-i-gang") return { eventType: "next_step", target: "getting_started" };
    if (path === "/demo/" || path === "/demo") return { eventType: "demo", target: "demo_hub" };
    if (path === "/demosites/demo/" || path === "/demosites/demo") return { eventType: "demo", target: "demosites_demo" };
    if (path === "/demosites/" || path === "/demosites") return { eventType: "trial", target: "demosites_trial" };
    if (href === "#contact" || href === "/#contact") return { eventType: "contact", target: "contact_section" };
    return null;
  }

  document.addEventListener("click", function (event) {
    var node = event.target;
    if (!node || typeof node.closest !== "function") return;
    var anchor = node.closest("a[href]");
    if (!anchor) return;
    var classified = classifyLink(anchor);
    if (!classified) return;

    var pagePath = current.pathname || "/";
    var dedupeKey = "chatgenius:conversion:" + pagePath + ":" + classified.target;
    try {
      if (window.sessionStorage.getItem(dedupeKey)) return;
    } catch (_) {}

    var discoverySource = null;
    var landingPath = null;
    try {
      discoverySource = window.sessionStorage.getItem("chatgenius:discovery-source") || null;
      landingPath = window.sessionStorage.getItem("chatgenius:discovery-landing") || null;
    } catch (_) {}

    void fetch("https://realtyflow.chatgenius.pro/api/public/conversion-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: classified.eventType,
        target: classified.target,
        path: pagePath,
        discoverySource: discoverySource,
        landingPath: landingPath
      }),
      keepalive: true
    }).then(function (response) {
      if (response.status !== 204) return;
      try { window.sessionStorage.setItem(dedupeKey, "1"); } catch (_) {}
    }).catch(function () {});
  }, { passive: true });
})();
