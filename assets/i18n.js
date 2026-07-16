/*
 * ChatGenius.pro språkhåndtering. Hvert språk har egne indekserbare sider
 * (/, /fr/, /es/, /de/, /ru/ — generert av scripts/build-i18n.mjs), så
 * språkvelgeren NAVIGERER til riktig side i stedet for å bytte tekst i DOM-en.
 * Ordbøkene (assets/i18n-dict.js, lastes før denne) brukes her kun til
 * dynamiske strenger via window.CG_T(key, fallback).
 */
(function () {
  var dict = window.CG_DICT || {};
  var LANG_NAMES = { no: "Norsk", fr: "Français", es: "Español", de: "Deutsch", ru: "Русский" };
  var LANG_CODES = ["no", "fr", "es", "de", "ru"];

  function pathLang() {
    var match = location.pathname.match(/^\/(fr|es|de|ru)(\/|$)/);
    return match ? match[1] : "no";
  }

  function targetPath(lang) {
    var path = location.pathname.replace(/^\/(fr|es|de|ru)(?=\/|$)/, "");
    if (path === "") path = "/";
    return (lang === "no" ? "" : "/" + lang) + path + location.hash;
  }

  var lang = pathLang();
  window.CG_LANG = lang;

  window.CG_T = function (key, fallback) {
    var d = window.CG_LANG !== "no" ? dict[window.CG_LANG] : null;
    var value = d ? d[key] : null;
    return value != null ? value : fallback;
  };

  function init() {
    document.querySelectorAll(".lang-switch").forEach(function (sel) {
      if (sel.options.length === 0) {
        LANG_CODES.forEach(function (code) {
          var opt = document.createElement("option");
          opt.value = code;
          opt.textContent = LANG_NAMES[code];
          sel.appendChild(opt);
        });
      }
      sel.value = lang;
      sel.addEventListener("change", function () {
        try { localStorage.setItem("cg_lang", sel.value); } catch (e) { /* private mode */ }
        location.href = targetPath(sel.value);
      });
    });

    // Førstegangsbesøk på norsk side: send til lagret/nettleser-språk hvis
    // det finnes en egen språkside for det. Eksplisitt valg av «Norsk»
    // lagres som "no" og stopper videre omdirigering.
    if (lang === "no") {
      var stored = null;
      try { stored = localStorage.getItem("cg_lang"); } catch (e) { /* private mode */ }
      var pick = stored;
      if (!pick) {
        var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || "").slice(0, 2).toLowerCase();
        if (dict[nav]) pick = nav;
      }
      if (pick && pick !== "no" && dict[pick]) {
        location.replace(targetPath(pick));
        return;
      }
    }
    try { localStorage.setItem("cg_lang", lang); } catch (e) { /* private mode */ }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
