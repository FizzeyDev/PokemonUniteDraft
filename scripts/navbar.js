document.addEventListener("DOMContentLoaded", () => {
  // ✅ Détection automatique de l'environnement
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const basePath = isLocal ? "./" : "/PokemonUniteDraft/";

  // ✅ Détermine le chemin vers la navbar selon la page actuelle
  const currentDepth = window.location.pathname.split("/").length;
  const isDeepPage = window.location.pathname.includes("/pages/") || currentDepth > 3;
  const navbarPath = isDeepPage ? `${basePath}components/navbar.html` : `${basePath}components/navbar.html`;

  fetch(navbarPath)
    .then(response => {
      if (!response.ok) throw new Error("Erreur de chargement de la navbar");
      return response.text();
    })
    .then(data => {
      document.getElementById("navbar-container").innerHTML = data;
      initNavbar(basePath);
    })
    .catch(err => console.error("Erreur navbar:", err));
});

function initNavbar(basePath) {
  const toggle = document.getElementById("toggle-sidebar");
  const sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // ✅ Corrige dynamiquement les liens de la navbar (Draft, Tierlist, etc.)
  document.querySelectorAll("#sidebar a").forEach(link => {
    const href = link.getAttribute("href");
    // Si href est vide ou commence par /PokemonUniteDraft, on le normalise
    if (!href || href.startsWith("/") || href.startsWith("../")) {
      const path = link.dataset.path || href.replace(/^\/?PokemonUniteDraft\/?/, "");
      link.href = basePath + path;
    }
  });

  // ✅ Corrige les drapeaux de langue (assets)
  document.querySelectorAll("#sidebar img").forEach(img => {
    const src = img.getAttribute("src");
    if (src && src.startsWith("/PokemonUniteDraft")) {
      img.src = basePath + src.replace(/^\/?PokemonUniteDraft\/?/, "");
    }
  });

  // ✅ Gestion de la langue
  let currentLang = localStorage.getItem("lang") || "en";
  loadLang(currentLang, basePath);

  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      loadLang(lang, basePath);
      localStorage.setItem("lang", lang);
      updateDynamicContent();
    });
  });

  const currentPath = window.location.pathname.replace(/^\/|\/$/g, "")

  document.querySelectorAll("#sidebar a").forEach(link => {
    const linkPath = link.getAttribute("href")
      .replace(basePath, "")
      .replace(/^\/|\/$/g, "")

    if (linkPath && currentPath.endsWith(linkPath)) {
      link.classList.add("active")
    }
  })
}

function loadLang(lang, basePath) {
  const langPath = `${basePath}lang/${lang}.json`;

  fetch(langPath)
    .then(res => {
      if (!res.ok) throw new Error(`Lang file not found: ${lang}`);
      return res.json();
    })
    .then(data => {
      currentLangData = data;
      currentLang = lang;

      document.querySelectorAll(".lang-btn").forEach(btn =>
        btn.classList.toggle("active", btn.dataset.lang === lang)
      );

      document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.dataset.lang;
        if (data[key]) el.textContent = data[key];
      });

      updateDynamicContent();
    })
    .catch(err => console.error("Language load error:", err));
}

function updateDynamicContent() {
  if (!window.currentLangData) return;

  if (!selectedMode) {
    document.getElementById('mode-title').innerHTML = `<strong>${currentLangData.select_mode_title || "Select a draft mode"}</strong>`;
    document.getElementById('mode-text').textContent = currentLangData.select_mode_text || "Select a draft mode above to see its description.";
  } else {
    let titleKey = "", descriptionKey = "";
    if (selectedMode === "classic") {
      titleKey = "mode_classic";
      descriptionKey = "tooltip_classic";
    } else if (selectedMode === "swap-ban") {
      titleKey = "mode_swap";
      descriptionKey = "tooltip_swap";
    } else if (selectedMode === "reban") {
      titleKey = "mode_reban";
      descriptionKey = "tooltip_reban";
    } else if (selectedMode === "tournament") {
      titleKey = "mode_tournament";
      descriptionKey = "tooltip_tournament";
    }
    document.getElementById('mode-title').innerHTML = `<strong>${currentLangData[titleKey] || titleKey}</strong>`;
    document.getElementById('mode-text').textContent = currentLangData[descriptionKey] || descriptionKey;
  }

  const timer = document.getElementById('bubble-timer');
  if (timer) timer.textContent = currentLangData.waiting || "Waiting...";

  const finalDiv = document.getElementById('final-draft');
  if (finalDiv && finalDiv.style.display !== 'none') {
    const title = document.getElementById('final-draft-title');
    const teamAName = document.getElementById('teamA')?.querySelector('h2');
    const teamBName = document.getElementById('teamB')?.querySelector('h2');
    if (title) title.textContent = currentLangData.final_draft_title || "Final Draft Result";
    if (teamAName) teamAName.textContent = currentLangData.team_purple || "Purple Team";
    if (teamBName) teamBName.textContent = currentLangData.team_orange || "Orange Team";
  }
}
