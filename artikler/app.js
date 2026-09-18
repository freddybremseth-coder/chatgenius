(function () {
  const API_URL = "https://realtyflow.chatgenius.pro/api/public/website-content?brand=chatgenius&destination=artikler&limit=50";
  const mount = document.getElementById("articles-app");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
  }

  function titleFromMarkdown(markdown, fallback) {
    const lines = String(markdown || "").split(/\r?\n/);
    for (var i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("# ")) return line.slice(2).trim();
      if (line.startsWith("## ")) return line.slice(3).trim();
      if (line.startsWith("### ")) return line.slice(4).trim();
      break;
    }
    return String(fallback || "").trim();
  }

  function stripLeadingHeading(markdown) {
    const lines = String(markdown || "").split(/\r?\n/);
    let skipped = false;
    const output = [];
    lines.forEach(function (rawLine) {
      const line = rawLine.trim();
      if (!skipped && !line) return;
      if (!skipped && /^#{1,3}\s+/.test(line)) {
        skipped = true;
        return;
      }
      skipped = true;
      output.push(rawLine);
    });
    return output.join("\n").trim();
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").split(/\r?\n/);
    let html = "";
    let list = [];

    function flushList() {
      if (!list.length) return;
      html += "<ul>" + list.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>";
      list = [];
    }

    lines.forEach(function (rawLine) {
      const line = rawLine.trim();
      if (!line) {
        flushList();
        return;
      }
      if (/^[-*]\s+/.test(line)) {
        list.push(line.replace(/^[-*]\s+/, ""));
        return;
      }
      flushList();
      if (line.startsWith("### ")) html += "<h3>" + escapeHtml(line.slice(4)) + "</h3>";
      else if (line.startsWith("## ")) html += "<h2>" + escapeHtml(line.slice(3)) + "</h2>";
      else if (line.startsWith("# ")) html += "<h1>" + escapeHtml(line.slice(2)) + "</h1>";
      else html += "<p>" + escapeHtml(line) + "</p>";
    });

    flushList();
    return html;
  }

  function getSlug() {
    var parts = window.location.pathname.replace(/\/+$/, "").split("/");
    if (parts.length >= 3 && parts[1] === "artikler") return parts[2] || "";
    return new URL(window.location.href).searchParams.get("slug") || "";
  }

  function setSlug(slug) {
    var nextPath = slug ? ("/artikler/" + slug) : "/artikler/";
    history.replaceState({}, "", nextPath);
  }

  function render(items) {
    if (!items.length) {
      mount.innerHTML = '<div class="articles-state">Ingen publiserte artikler enda.</div>';
      return;
    }

    const preparedItems = items.map(function (item) {
      const displayTitle = titleFromMarkdown(item.markdown, item.title);
      return Object.assign({}, item, {
        displayTitle: displayTitle,
        bodyMarkdown: stripLeadingHeading(item.markdown),
      });
    });

    const active = preparedItems.find(function (item) { return item.slug === getSlug(); }) || preparedItems[0];
    const activeSlug = getSlug();
    const detailOnlyClass = activeSlug ? " is-detail-only" : "";

    if (active) {
      const canonicalUrl = activeSlug
        ? "https://www.chatgenius.pro/artikler/" + encodeURIComponent(active.slug)
        : "https://www.chatgenius.pro/artikler/";
      const pageTitle = activeSlug ? active.displayTitle + " | ChatGenius.pro" : "Artikler | ChatGenius.pro";
      const description = activeSlug ? (active.summary || "Artikkel fra ChatGenius.pro om AI og digitale arbeidsflyter.") : "Artikler, case og ressurser fra ChatGenius.pro om AI, automatisering og digitale arbeidsflyter.";
      document.title = pageTitle;

      var heroHeading = document.querySelector(".articles-hero h1");
      var heroCopy = document.querySelector(".articles-hero .hero-copy");
      if (activeSlug && heroHeading) heroHeading.textContent = active.displayTitle;
      if (activeSlug && heroCopy) heroCopy.textContent = description;

      function ensureMeta(selector, attrs) {
        var element = document.head.querySelector(selector);
        if (!element) {
          element = document.createElement("meta");
          document.head.appendChild(element);
        }
        Object.keys(attrs).forEach(function (key) { element.setAttribute(key, attrs[key]); });
      }

      ensureMeta('meta[name="description"]', { name: "description", content: description });
      ensureMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
      ensureMeta('meta[property="og:description"]', { property: "og:description", content: description });
      ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
      ensureMeta('meta[property="og:type"]', { property: "og:type", content: activeSlug ? "article" : "website" });

      var canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", canonicalUrl);
    }

    mount.innerHTML =
      '<div class="articles-layout">' +
        '<aside class="article-list">' +
          preparedItems.map(function (item) {
            return (
              '<article class="article-card' + (item.slug === active.slug ? " is-active" : "") + '" data-slug="' + escapeHtml(item.slug) + '">' +
                '<div class="article-body">' +
                  '<div class="article-meta">' + escapeHtml(formatDate(item.published_at || item.created_at)) + '</div>' +
                  '<h2>' + escapeHtml(item.displayTitle) + '</h2>' +
                  '<p>' + escapeHtml(item.summary || "") + '</p>' +
                '</div>' +
              '</article>'
            );
          }).join("") +
        '</aside>' +
        '<article class="detail-panel' + detailOnlyClass + '">' +
          (active.image_url
            ? '<img class="detail-cover" src="' + escapeHtml(active.image_url) + '" alt="' + escapeHtml(active.title) + '">'
            : '<div class="detail-cover"></div>') +
          '<div class="detail-body">' +
            '<a class="detail-back" href="/artikler/">Tilbake til artikler</a>' +
            '<div class="detail-meta">' + escapeHtml(formatDate(active.published_at || active.created_at)) + '</div>' +
            '<h2>' + escapeHtml(active.displayTitle) + '</h2>' +
            '<p class="detail-summary">' + escapeHtml(active.summary || "") + '</p>' +
            '<div class="markdown">' + renderMarkdown(active.bodyMarkdown) + '</div>' +
          '</div>' +
        '</article>' +
      '</div>';

    mount.querySelectorAll(".article-card").forEach(function (card) {
      card.addEventListener("click", function () {
        setSlug(card.getAttribute("data-slug"));
        render(items);
      });
    });
  }

  fetch(API_URL)
    .then(function (response) { return response.json(); })
    .then(function (payload) { render(Array.isArray(payload.items) ? payload.items : []); })
    .catch(function () {
      mount.innerHTML = '<div class="articles-state">Kunne ikke laste artiklene akkurat na.</div>';
    });
})();
