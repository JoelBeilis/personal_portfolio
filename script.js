// ==========================================================================
// Sample Photographic Dataset (Easily replaced or loaded from photos.json)
// ==========================================================================
const photosData = [
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
    id: "harbor-seal-02",
    title: "Atlantic Harbor Seal Breaching",
    location: "Acadia Coastline, Maine",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    tags: ["Marine", "Wildlife", "Coastal"],
    exif: { camera: "Nikon D700", lens: "105mm Micro f/2.8", shutter: "1/1600s", aperture: "f/5.6", iso: "200" }
  },
  {
    id: "monochrome-dune-03",
    title: "Salt Marsh Morning Mist",
    location: "Cape Cod, Massachusetts",
    thumb: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85",
    tags: ["Landscape", "Coastal", "35mm Film"],
    exif: { camera: "Nikkormat SLR", lens: "50mm f/1.4", shutter: "1/500s", aperture: "f/8", iso: "100" }
  },
  {
    id: "osprey-clutch-04",
    title: "Osprey Returning to Roost",
    location: "Algonquin Highlands, Ontario",
    thumb: "https://images.unsplash.com/photo-1574063413132-355dbfd83e25?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1574063413132-355dbfd83e25?auto=format&fit=crop&w=1600&q=85",
    tags: ["Wildlife", "Avian", "Award Winner"],
    exif: { camera: "Nikon D700", lens: "300mm f/4", shutter: "1/2500s", aperture: "f/4.5", iso: "320" }
  },
  {
    id: "granite-boulder-05",
    title: "Weathered Granite & Lichen",
    location: "Smugglers Notch, Vermont",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85",
    tags: ["Landscape", "Bouldering", "35mm Film"],
    exif: { camera: "Nikkormat SLR", lens: "28mm Pancake", shutter: "1/250s", aperture: "f/11", iso: "100" }
  },
  {
    id: "red-fox-06",
    title: "Red Fox in Dense Understory",
    location: "Bruce Peninsula, Ontario",
    thumb: "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=600&q=80",
    full: "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=1600&q=85",
    tags: ["Wildlife", "Ontario"],
    exif: { camera: "Nikon D700", lens: "105mm Micro f/2.8", shutter: "1/1000s", aperture: "f/2.8", iso: "640" }
  }
];

// Active State
let activeFilterTag = "All";
let hasMaxFriction = false;
let frictionTimer = null;

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initClimberTopo();
  initChalkMechanic();
  initGallery();
  initLightbox();
});

// ==========================================================================
// Theme Management (Retroma Dark/Light)
// ==========================================================================
function initTheme() {
  const toggleBtn = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("jb-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("jb-theme", next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector(".theme-icon");
  if (icon) icon.textContent = theme === "dark" ? "🌙" : "☀️";
}

// ==========================================================================
// Bouldering Topo & Climber Logic
// ==========================================================================
function initClimberTopo() {
  const climber = document.getElementById("climber");
  const holdButtons = document.querySelectorAll(".hold-btn");
  const topoContainer = document.getElementById("climbingTopo");

  if (!climber || !topoContainer) return;

  function updateClimberPosition(activeHold) {
    if (!activeHold) return;
    const holdRect = activeHold.getBoundingClientRect();
    const topoRect = topoContainer.getBoundingClientRect();
    const relativeTop = holdRect.top - topoRect.top + holdRect.height / 2;
    climber.style.top = `${relativeTop}px`;

    holdButtons.forEach(btn => btn.classList.remove("active"));
    activeHold.classList.add("active");
  }

  // Click hold to jump / scroll
  holdButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        if (hasMaxFriction) {
          triggerDynoAnimation();
        }
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Track scroll position to update hold
  const sections = Array.from(holdButtons).map(b => document.querySelector(b.getAttribute("data-target")));
  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    let currentIdx = 0;

    sections.forEach((sec, idx) => {
      if (sec && sec.offsetTop <= scrollPos) {
        currentIdx = idx;
      }
    });

    updateClimberPosition(holdButtons[currentIdx]);
  }, { passive: true });

  // Initial placement
  updateClimberPosition(holdButtons[0]);

  // About dyno button
  const dynoActionBtn = document.getElementById("sendDynoAction");
  if (dynoActionBtn) {
    dynoActionBtn.addEventListener("click", () => {
      triggerDynoAnimation();
      emitChalkPuff(climber);
    });
  }
}

function triggerDynoAnimation() {
  const climber = document.getElementById("climber");
  if (!climber) return;
  climber.classList.remove("climber-dyno");
  void climber.offsetWidth; // Reflow
  climber.classList.add("climber-dyno");
}

// ==========================================================================
// Interactive "Chalk Up" Mechanic
// ==========================================================================
function initChalkMechanic() {
  const chalkBtn = document.getElementById("chalkBtn");
  const frictionBadge = document.getElementById("frictionBadge");
  const climber = document.getElementById("climber");

  if (!chalkBtn || !climber) return;

  chalkBtn.addEventListener("click", () => {
    // 1. Trigger climber dipping hand into chalk bag
    climber.classList.remove("climber-chalking");
    void climber.offsetWidth;
    climber.classList.add("climber-chalking");

    // 2. Emit randomized chalk particles from chalk bag position
    emitChalkPuff(climber);

    // 3. Grant Max Friction power-up (+100% grip for 15s)
    hasMaxFriction = true;
    climber.classList.add("max-friction");
    frictionBadge.textContent = "+100%";
    frictionBadge.style.color = "#34d399";
    chalkBtn.querySelector(".btn-text").textContent = "Chalked!";

    clearTimeout(frictionTimer);
    frictionTimer = setTimeout(() => {
      hasMaxFriction = false;
      climber.classList.remove("max-friction");
      frictionBadge.textContent = "+0%";
      frictionBadge.style.color = "var(--accent-orange)";
      chalkBtn.querySelector(".btn-text").textContent = "Chalk Up";
    }, 15000);
  });
}

function emitChalkPuff(climber) {
  const container = document.getElementById("climberChalkContainer");
  if (!container) return;

  // Generate 12 scattered pixel dust particles
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("span");
    particle.className = "chalk-particle";

    const size = Math.floor(Math.random() * 4) + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random velocity angle
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.floor(Math.random() * 32) + 12;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty("--tx", `${tx}px`);
    particle.style.setProperty("--ty", `${ty}px`);

    container.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

// ==========================================================================
// Gallery Engine: Multi-Tag Filtering & Search
// ==========================================================================
function initGallery() {
  const grid = document.getElementById("galleryGrid");
  const tagsContainer = document.getElementById("tagPillsContainer");
  const searchInput = document.getElementById("gallerySearch");
  const countLabel = document.getElementById("photoCount");

  // Extract unique tags
  const tagsSet = new Set(["All"]);
  photosData.forEach(p => p.tags.forEach(t => tagsSet.add(t)));

  // Render tag buttons
  tagsContainer.innerHTML = "";
  tagsSet.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = `tag-filter-btn ${tag === "All" ? "active" : ""}`;
    btn.textContent = tag === "All" ? "All Works" : `#${tag}`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tag-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilterTag = tag;
      renderPhotos();
    });
    tagsContainer.appendChild(btn);
  });

  searchInput.addEventListener("input", () => renderPhotos());

  function renderPhotos() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = photosData.filter(item => {
      const matchesTag = activeFilterTag === "All" || item.tags.includes(activeFilterTag);
      const matchesQuery = !query || 
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.exif.camera.toLowerCase().includes(query) ||
        item.exif.lens.toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query));

      return matchesTag && matchesQuery;
    });

    countLabel.textContent = `${filtered.length} of ${photosData.length} records`;

    grid.innerHTML = "";
    filtered.forEach(photo => {
      const card = document.createElement("div");
      card.className = "photo-item skeleton";

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
        <div class="photo-title">${photo.title}</div>
        <div class="photo-gear-pill">${photo.exif.camera} • ${photo.exif.lens}</div>
      `;

      card.appendChild(img);
      card.appendChild(overlay);

      card.addEventListener("click", () => openLightbox(photo));
      grid.appendChild(card);
    });
  }

  renderPhotos();
}

// ==========================================================================
// Lightbox Modal
// ==========================================================================
function initLightbox() {
  const modal = document.getElementById("lightboxModal");
  const closeBtn = document.getElementById("lightboxClose");
  const backdrop = document.getElementById("lightboxBackdrop");

  function close() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

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

  const exifContainer = document.getElementById("lightboxExif");
  exifContainer.innerHTML = `
    <div><span>Camera:</span> ${photo.exif.camera}</div>
    <div><span>Lens:</span> ${photo.exif.lens}</div>
    <div><span>Exposure:</span> ${photo.exif.shutter} at ${photo.exif.aperture}, ISO ${photo.exif.iso}</div>
  `;

  const tagsContainer = document.getElementById("lightboxTags");
  tagsContainer.innerHTML = photo.tags.map(t => `<span>#${t}</span>`).join("");

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}