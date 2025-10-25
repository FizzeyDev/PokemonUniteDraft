document.addEventListener("DOMContentLoaded", () => {
  const navbarPath = window.location.pathname.includes("/pages/")
    ? "../components/navbar.html"
    : "components/navbar.html";

  fetch(navbarPath)
    .then(response => {
      if (!response.ok) throw new Error("Erreur de chargement de la navbar");
      return response.text();
    })
    .then(data => {
      document.getElementById("navbar-container").innerHTML = data;
      initNavbar();
    })
    .catch(err => console.error("Erreur navbar:", err));
});

function initNavbar() {
  const toggle = document.getElementById("toggle-sidebar");
  const sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  let currentLang = localStorage.getItem("lang") || "en";
  loadLang(currentLang);

  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      loadLang(lang);
      localStorage.setItem("lang", lang);
      updateDynamicContent();
    });
  });
}

function loadLang(lang) {
  fetch(`lang/${lang}.json`)
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

  document.getElementById('bubble-timer').textContent = currentLangData.waiting || "Waiting...";

  const finalDiv = document.getElementById('final-draft');
  if (finalDiv && finalDiv.style.display !== 'none') {
    document.getElementById('final-draft-title').textContent = currentLangData.final_draft_title || "Final Draft Result";
    const teamAName = document.getElementById('teamA').querySelector('h2');
    const teamBName = document.getElementById('teamB').querySelector('h2');
    teamAName.textContent = currentLangData.team_purple || "Purple Team";
    teamBName.textContent = currentLangData.team_orange || "Orange Team";
  }
}