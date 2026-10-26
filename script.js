// ==========================================================================
// Gallery Dataset
// ==========================================================================
const photos = [
  {
    id: "falcon-01",
    title: "Peregrine Falcon in High Descent",
    location: "Niagara Escarpment, Ontario",
    thumb: "https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=1600&q=85",
    tags: ["Wildlife", "Avian", "Telephoto", "Award Winner"],
    exif: { camera: "Nikon D700", lens: "300mm f/4", shutter: "1/3200s", aperture: "f/4", iso: "400" }
  },
  {
    id: "seal-02",
    title: "Atlantic Harbor Seal Breaching",
    location: "Acadia Coastline, Maine",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    tags: ["Marine", "Wildlife", "Coastal"],
    exif: { camera: "Nikon D700", lens: "105mm Micro f/2.8", shutter: "1/1600s", aperture: "f/5.6", iso: "200" }
  },
  {
    id: "dunes-03",
    title: "Salt Marsh Morning Mist",
    location: "Cape Cod, Massachusetts",
    thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85",
    tags: ["Landscape", "Coastal", "35mm Film"],
    exif: { camera: "Nikkormat SLR", lens: "50mm f/1.4", shutter: "1/500s", aperture: "f/8", iso: "100" }
  },
  {
    id: "osprey-04",
    title: "Osprey Returning to Roost",
    location: "Algonquin Highlands, Ontario",
    thumb: "https://images.unsplash.com/photo-1574063413132-355dbfd83e25?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1574063413132-355dbfd83e25?auto=format&fit=crop&w=1600&q=85",
    tags: ["Wildlife", "Avian", "Award Winner"],
    exif: { camera: "Nikon D700", lens: "300mm f/4", shutter: "1/2500s", aperture: "f/4.5", iso: "320" }
  },
  {
    id: "lichen-05",
    title: "Weathered Granite & Lichen",
    location: "Smugglers Notch, Vermont",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
    tags: ["Landscape", "Bouldering", "35mm Film"],
    exif: { camera: "Nikkormat SLR", lens: "28mm Pancake", shutter: "1/250s", aperture: "f/11", iso: "100" }
  },
  {
    id: "fox-06",
    title: "Red Fox in Dense Underbrush",
    location: "Bruce Peninsula, Ontario",
    thumb: "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=1600&q=85",
    tags: ["Wildlife", "Ontario"],
    exif: { camera: "Nikon D700", lens: "105mm Micro f/2.8", shutter: "1/1000s", aperture: "f/2.8", iso: "640" }
  }
];

let activeTag = "All";
let hasFriction = false;
let frictionTimer = null;

// ==========================================================================
// Boot & Reverse-Scroll Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAscendingTopo();
  initChalk();
  initSuperMoves();
  initGallery();
  initLightbox();

  // Ensure initial load starts at the BOTTOM (Joel's Jungle Base Camp)
  if (!window.location.hash) {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    }, 50);
  }
});

// ==========================================================================
// Ascending Topo & Climber Motion
// ==========================================================================
function initAscendingTopo() {
  const climber = document.getElementById("climber");
  const topo = document.getElementById("cragTopo");
  const holdNodes = Array.from(document.querySelectorAll(".hold-node"));
  const elevationLabel = document.getElementById("elevationLabel");

  if (!climber || !topo) return;

  function setClimberToHold(holdBtn) {
    if (!holdBtn) return;
    const hRect = holdBtn.getBoundingClientRect();
    const tRect = topo.getBoundingClientRect();
    const relativeY = hRect.top - tRect.top + hRect.height / 2;
    climber.style.top = `${relativeY}px`;

    holdNodes.forEach(b => b.classList.remove("active"));
    holdBtn.classList.add("active");

    // Calculate elevation relative to base (bottom is 0m, top is 850m)
    const grade = holdBtn.getAttribute("data-grade");
    const elevMap = { V0: "0m (GROUND)", V1: "150m", V2: "320m", V3: "480m", V4: "650m", V5: "850m (SUMMIT)" };
    if (elevationLabel) elevationLabel.textContent = `ELEVATION: ${elevMap[grade] || "500m"}`;
  }

  // Clicking any topo hold smooth-scrolls to that pitch
  holdNodes.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.querySelector(btn.getAttribute("data-target"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Track scrolling (Scrolling UP increases elevation and moves climber UP)
  const sections = holdNodes.map(h => document.querySelector(h.getAttribute("data-target")));

  window.addEventListener("scroll", () => {
    const scrollMiddle = window.scrollY + window.innerHeight * 0.45;
    let activeIdx = 0;

    sections.forEach((sec, idx) => {
      if (sec && sec.offsetTop <= scrollMiddle) {
        activeIdx = idx;
      }
    });

    setClimberToHold(holdNodes[activeIdx]);
  }, { passive: true });

  // Initial anchor to base
  setClimberToHold(holdNodes[holdNodes.length - 1]);
}

// ==========================================================================
// Dyno (Jump to Top) & Free Fall (Drop to Ground)
// ==========================================================================
function initSuperMoves() {
  const dynoBtn = document.getElementById("dynoLaunchBtn");
  const fallBtn = document.getElementById("summitFallBtn");
  const climber = document.getElementById("climber");

  // Grade buttons routing
  document.querySelectorAll(".grade-btn:not(.locked)").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(btn.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // 🚀 DYNO: Leap from base straight to summit
  if (dynoBtn) {
    dynoBtn.addEventListener("click", () => {
      if (climber) {
        climber.classList.add("dyno-jumping");
        emitChalkExplosion();
      }
      
      const summit = document.getElementById("v5-photography");
      if (summit) {
        summit.scrollIntoView({ behavior: "smooth" });
      }

      setTimeout(() => {
        if (climber) climber.classList.remove("dyno-jumping");
      }, 1000);
    });
  }

  // 🪂 FREE FALL: Plummet from summit to ground
  if (fallBtn) {
    fallBtn.addEventListener("click", () => {
      if (climber) {
        climber.classList.add("free-falling");
      }

      const ground = document.getElementById("ground");
      if (ground) {
        ground.scrollIntoView({ behavior: "smooth" });
      }

      // Screen shake landing FX
      setTimeout(() => {
        if (climber) climber.classList.remove("free-falling");
        document.body.style.transform = "translateY(6px)";
        setTimeout(() => document.body.style.transform = "translateY(0)", 120);
        emitChalkExplosion();
      }, 900);
    });
  }
}

// ==========================================================================
// Chalk Up Mechanic
// ==========================================================================
function initChalk() {
  const chalkBtn = document.getElementById("chalkBtn");
  const badge = document.getElementById("frictionBadge");
  const climber = document.getElementById("climber");

  if (!chalkBtn || !climber) return;

  chalkBtn.addEventListener("click", () => {
    climber.classList.remove("climber-chalking");
    void climber.offsetWidth;
    climber.classList.add("climber-chalking");

    emitChalkExplosion();

    hasFriction = true;
    badge.textContent = "+100%";
    badge.style.color = "#34d399";

    clearTimeout(frictionTimer);
    frictionTimer = setTimeout(() => {
      hasFriction = false;
      badge.textContent = "+0%";
      badge.style.color = "var(--accent-amber)";
    }, 12000);
  });
}

function emitChalkExplosion() {
  const emitter = document.getElementById("chalkEmitter");
  if (!emitter) return;

  for (let i = 0; i < 14; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = Math.floor(Math.random() * 4) + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;

    const rad = Math.random() * Math.PI * 2;
    const dist = Math.floor(Math.random() * 30) + 10;
    p.style.setProperty("--tx", `${Math.cos(rad) * dist}px`);
    p.style.setProperty("--ty", `${Math.sin(rad) * dist}px`);

    emitter.appendChild(p);
    setTimeout(() => p.remove(), 750);
  }
}

// ==========================================================================
// Gallery & Filter Engine
// ==========================================================================
function initGallery() {
  const grid = document.getElementById("galleryGrid");
  const tagsContainer = document.getElementById("tagFilters");
  const searchInput = document.getElementById("gallerySearch");
  const countLabel = document.getElementById("photoCount");

  const tags = new Set(["All"]);
  photos.forEach(p => p.tags.forEach(t => tags.add(t)));

  tagsContainer.innerHTML = "";
  tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = `tag-btn ${tag === "All" ? "active" : ""}`;
    btn.textContent = tag === "All" ? "All" : `#${tag}`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTag = tag;
      renderGallery();
    });
    tagsContainer.appendChild(btn);
  });

  searchInput.addEventListener("input", renderGallery);

  function renderGallery() {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = photos.filter(p => {
      const matchTag = activeTag === "All" || p.tags.includes(activeTag);
      const matchSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.exif.camera.toLowerCase().includes(q) ||
        p.exif.lens.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q));

      return matchTag && matchSearch;
    });

    countLabel.textContent = `${filtered.length} of ${photos.length} frames`;
    grid.innerHTML = "";

    filtered.forEach(photo => {
      const card = document.createElement("div");
      card.className = "photo-card skeleton";

      const img = document.createElement("img");
      img.alt = photo.title;
      img.loading = "lazy";
      img.src = photo.thumb;
      img.onload = () => {
        img.classList.add("loaded");
        card.classList.remove("skeleton");
      };

      const overlay = document.createElement("div");
      overlay.className = "photo-overlay";
      overlay.innerHTML = `
        <div class="p-title">${photo.title}</div>
        <div class="p-gear">${photo.exif.camera} • ${photo.exif.lens}</div>
      `;

      card.appendChild(img);
      card.appendChild(overlay);
      card.addEventListener("click", () => openLightbox(photo));
      grid.appendChild(card);
    });
  }

  renderGallery();
}

// ==========================================================================
// Lightbox Modal
// ==========================================================================
function initLightbox() {
  const modal = document.getElementById("lightboxModal");
  const closeBtn = document.getElementById("lightboxClose");
  const backdrop = document.getElementById("lightboxBackdrop");

  const close = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  };

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) close();
  });
}

function openLightbox(photo) {
  const modal = document.getElementById("lightboxModal");
  document.getElementById("lightboxImg").src = photo.full;
  document.getElementById("lightboxTitle").textContent = photo.title;
  document.getElementById("lightboxLocation").textContent = `📍 ${photo.location}`;

  const exifEl = document.getElementById("lightboxExif");
  exifEl.innerHTML = `
    <div><strong>Camera:</strong> ${photo.exif.camera}</div>
    <div><strong>Lens:</strong> ${photo.exif.lens}</div>
    <div><strong>Parameters:</strong> ${photo.exif.shutter} at ${photo.exif.aperture}, ISO ${photo.exif.iso}</div>
  `;

  const tagsEl = document.getElementById("lightboxTags");
  tagsEl.innerHTML = photo.tags.map(t => `<span>#${t}</span>`).join("");

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

// ==========================================================================
// Theme Setup
// ==========================================================================
function initTheme() {
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem("jb-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);

  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("jb-theme", next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(t) {
  const icon = document.querySelector(".theme-icon");
  if (icon) icon.textContent = t === "dark" ? "🌙" : "☀️";
}