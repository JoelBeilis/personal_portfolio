// ==========================================================================
// 1. Browser History & Scroll Configuration
// ==========================================================================
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

if (window.location.hash) {
  history.replaceState(null, "", window.location.pathname);
}

let activeTag = "Recents";
let hasFriction = false;
let frictionTimer = null;

// Snap cleanly to the true bottom of the page
function snapToBaseCamp() {
  const root = document.documentElement;
  // Temporarily disable smooth scrolling so the snap is exact and hits the bottom margin
  root.style.scrollBehavior = 'auto';

  const maxScroll = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );

  window.scrollTo(0, maxScroll);

  // Restore smooth scrolling after the layout has settled
  requestAnimationFrame(() => {
    root.style.scrollBehavior = '';
  });
}

// ==========================================================================
// 2. Boot & Reverse-Scroll Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAscendingTopo();
  initChalk();
  initSuperMoves();
  initExperienceTabs();
  initGallery();
  initLightbox();

  snapToBaseCamp();
});

// Re-snap once all styles, fonts, and DOM assets finish loading
window.addEventListener("load", () => {
  snapToBaseCamp();
  // Ensure the climber sprite syncs to the base hold after layout settles
  const baseHold = document.querySelector('.hold-node[data-grade="V0"]');
  const climber = document.getElementById("climber");
  const topo = document.getElementById("cragTopo");
  if (baseHold && climber && topo) {
    const hRect = baseHold.getBoundingClientRect();
    const tRect = topo.getBoundingClientRect();
    climber.style.top = `${hRect.top - tRect.top + hRect.height / 2}px`;
  }
  snapToBaseCamp();
  // Force a re-calculation after all fonts and layout settle
  setTimeout(() => {
    window.dispatchEvent(new Event('scroll'));
  }, 150);
});

// ==========================================================================
// 3. Ascending Topo & Climber Motion
// ==========================================================================
function initAscendingTopo() {
  const climber = document.getElementById("climber");
  const topo = document.getElementById("cragTopo");
  const holdNodes = Array.from(document.querySelectorAll(".hold-node"));
  const elevationLabel = document.getElementById("elevationLabel");

  if (!climber || !topo || holdNodes.length === 0) return;

  const elevMap = { 
    V0: "0m (BASE CAMP)", 
    V1: "120m (ABOUT)", 
    V2: "250m (EXPERIENCE)", 
    V3: "380m (SKILLS)", 
    V4: "510m (PROJECTS)", 
    V5: "640m (AWARDS)", 
    V6: "770m (GEAR)",
    V7: "900m (SUMMIT)",
    V8: "990m (NO TOP OUT)"
  };

  // Move the climber to a specific hold button
  function moveClimberToHold(holdBtn) {
    if (!holdBtn) return;

    // Calculate center of the hold relative to the #cragTopo container
    const holdRect = holdBtn.getBoundingClientRect();
    const topoRect = topo.getBoundingClientRect();
    const targetY = (holdRect.top - topoRect.top) + (holdRect.height / 2);

    climber.style.top = `${targetY}px`;

    holdNodes.forEach(b => b.classList.remove("active"));
    holdBtn.classList.add("active");

    const grade = holdBtn.getAttribute("data-grade");
    if (elevationLabel) {
      elevationLabel.textContent = `ELEVATION: ${elevMap[grade] || "500m"}`;
    }
  }

  // Click handler: smooth scroll to selected pitch
  holdNodes.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Build route mapping
  const pairs = holdNodes.map(btn => ({
    btn: btn,
    sec: document.querySelector(btn.getAttribute("data-target"))
  })).filter(p => p.sec !== null);

  // Update climber on scroll
  function updateClimberOnScroll() {
    const viewportCenter = window.innerHeight * 0.5;
    let closestPair = null;
    let minDistance = Infinity;

    // Check which section's center is closest to the screen center
    pairs.forEach(pair => {
      const rect = pair.sec.getBoundingClientRect();
      const sectionCenter = rect.top + (rect.height / 2);
      const dist = Math.abs(sectionCenter - viewportCenter);

      if (dist < minDistance) {
        minDistance = dist;
        closestPair = pair;
      }
    });

    // Special edge case: If scrolled near the very bottom, always lock to V0
    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.documentElement.scrollHeight - 50) {
      const basePair = pairs.find(p => p.btn.getAttribute("data-grade") === "V0");
      if (basePair) closestPair = basePair;
    }

    if (closestPair) {
      moveClimberToHold(closestPair.btn);
    }
  }

  window.addEventListener("scroll", updateClimberOnScroll, { passive: true });
  window.addEventListener("resize", updateClimberOnScroll);

  // Initialize climber at base camp
  const baseBtn = document.querySelector('.hold-node[data-grade="V0"]') || holdNodes[holdNodes.length - 1];
  setTimeout(() => {
    moveClimberToHold(baseBtn);
  }, 100);
}

// ==========================================================================
// 4. Dyno (Jump to Top) & Free Fall (Drop to Ground)
// ==========================================================================
function initSuperMoves() {
  const dynoBtn = document.getElementById("dynoLaunchBtn");
  const fallBtn = document.getElementById("summitFallBtn");
  const climber = document.getElementById("climber");

  // Grade buttons routing from base camp
  document.querySelectorAll(".grade-btn:not(.locked)").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(btn.getAttribute("data-target"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // 🚀 DYNO: Leap from base straight to V7 photography summit
  if (dynoBtn) {
    dynoBtn.addEventListener("click", () => {
      if (climber) {
        climber.classList.add("dyno-jumping");
        emitChalkExplosion();
      }
      
      const summit = document.getElementById("v7-photography");
      if (summit) {
        summit.scrollIntoView({ behavior: "smooth" });
      }

      setTimeout(() => {
        if (climber) climber.classList.remove("dyno-jumping");
      }, 1000);
    });
  }

// 🪂 DOWN CLIMB / FREE FALL: Plummet back to base camp
  if (fallBtn) {
    fallBtn.addEventListener("click", () => {
      const climber = document.getElementById("climber");
      const ground = document.getElementById("ground");
      const baseHold = document.querySelector('.hold-node[data-grade="V0"]');
      const topo = document.getElementById("cragTopo");
      const cragBody = document.querySelector(".crag-body");

      if (climber && baseHold && topo) {
        climber.classList.add("free-falling");

        // Calculate bottom hold position so the climber lands exactly on V0
        const hRect = baseHold.getBoundingClientRect();
        const tRect = topo.getBoundingClientRect();
        const bottomY = (hRect.top - tRect.top) + (hRect.height / 2);
        climber.style.top = `${bottomY}px`;
      }

      // Smooth scroll back to base camp
      if (ground) {
        ground.scrollIntoView({ behavior: "smooth" });
      }

      // Landing impact after falling
      setTimeout(() => {
        if (climber) {
          climber.classList.remove("free-falling");
        }

        // Shake crag body only (keeps fixed topo spine intact)
        if (cragBody) {
          cragBody.classList.remove("landing-shake");
          void cragBody.offsetWidth; // Force CSS reflow
          cragBody.classList.add("landing-shake");
        }

        emitChalkExplosion();
      }, 950);
    });
  }
}

// ==========================================================================
// Experience Tabs Controller
// ==========================================================================
function initExperienceTabs() {
  const tabButtons = document.querySelectorAll(".exp-tab-btn");
  const tabPanels = document.querySelectorAll(".exp-tab-panel");

  if (!tabButtons.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPanelId = btn.getAttribute("data-tab");

      // Switch active button
      tabButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      // Switch active panel
      tabPanels.forEach(panel => {
        if (panel.id === targetPanelId) {
          panel.classList.add("active");
        } else {
          panel.classList.remove("active");
        }
      });
    });
  });
}

// ==========================================================================
// 5. Chalk Up Mechanic
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
    if (badge) {
      badge.textContent = "+100%";
      badge.style.color = "#34d399";
    }

    clearTimeout(frictionTimer);
    frictionTimer = setTimeout(() => {
      hasFriction = false;
      if (badge) {
        badge.textContent = "+0%";
        badge.style.color = "var(--accent-amber)";
      }
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
// 6. Gallery Engine: Recents Default + Dynamic Filtering
// ==========================================================================
async function initGallery() {
  const grid = document.getElementById("galleryGrid");
  const tagsContainer = document.getElementById("tagFilters");
  const searchInput = document.getElementById("gallerySearch");
  const countLabel = document.getElementById("photoCount");

  if (!grid) return;

  let photos = [];
  try {
    const res = await fetch("photos.json");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    photos = await res.json();
  } catch (err) {
    console.error("Could not load photos.json", err);
    if (countLabel) countLabel.textContent = "Error loading photos";
    return;
  }

  const specificTags = new Set();
  photos.forEach(p => {
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => specificTags.add(t));
    }
  });

  const allTags = ["Recents", "All", ...Array.from(specificTags)];

  if (tagsContainer) {
    tagsContainer.innerHTML = "";
    allTags.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = `tag-btn ${tag === activeTag ? "active" : ""}`;
      btn.textContent = tag === "Recents" ? "⚡ Recents (Latest 6)" : (tag === "All" ? "All Works" : `#${tag}`);
      
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTag = tag;
        renderGallery();
      });
      tagsContainer.appendChild(btn);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (searchInput.value.trim().length > 0 && activeTag === "Recents") {
        activeTag = "All";
        document.querySelectorAll(".tag-btn").forEach(b => {
          b.classList.toggle("active", b.textContent === "All Works");
        });
      }
      renderGallery();
    });
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const img = card.querySelector("img.progressive-img");
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          img.onload = () => {
            img.classList.add("loaded");
            card.classList.add("resolved");
          };
          img.onerror = () => {
            console.error("Failed to load thumbnail:", img.dataset.src);
            card.classList.add("resolved");
          };
          observer.unobserve(card);
        }
      }
    });
  }, { rootMargin: "300px 0px" });

  function renderGallery() {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let displayList = [];

    if (activeTag === "Recents" && !q) {
      displayList = photos.slice(-6).reverse();
      if (countLabel) countLabel.textContent = `Showing 6 latest frames (of ${photos.length})`;
    } else {
      displayList = photos.filter(p => {
        const matchTag = activeTag === "All" || (Array.isArray(p.tags) && p.tags.includes(activeTag));
        const matchSearch = !q ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.exif && p.exif.camera && p.exif.camera.toLowerCase().includes(q)) ||
          (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)));

        return matchTag && matchSearch;
      }).reverse();

      if (countLabel) countLabel.textContent = `${displayList.length} of ${photos.length} frames`;
    }

    grid.innerHTML = "";

    displayList.forEach(photo => {
      const card = document.createElement("div");
      card.className = "photo-card";
      card.style.aspectRatio = `1 / ${photo.aspect || 0.75}`;

      const blurDiv = document.createElement("div");
      blurDiv.className = "lqip-placeholder";
      if (photo.lqip) {
        blurDiv.style.backgroundImage = `url("${photo.lqip}")`;
      }

      const img = document.createElement("img");
      img.className = "progressive-img";
      img.alt = photo.title || "Photograph";
      img.dataset.src = photo.thumb;

      const overlay = document.createElement("div");
      overlay.className = "photo-overlay";
      overlay.innerHTML = `
        <div class="p-title">${photo.title || ""}</div>
        <div class="p-gear">${photo.exif ? `${photo.exif.camera} • ${photo.exif.aperture}` : ""}</div>
      `;

      card.appendChild(blurDiv);
      card.appendChild(img);
      card.appendChild(overlay);

      card.addEventListener("click", () => openLightbox(photo));
      grid.appendChild(card);

      imageObserver.observe(card);
    });
  }

  renderGallery();
}

// ==========================================================================
// 7. Lightbox Modal
// ==========================================================================
function initLightbox() {
  const modal = document.getElementById("lightboxModal");
  const closeBtn = document.getElementById("lightboxClose");
  const backdrop = document.getElementById("lightboxBackdrop");

  if (!modal) return;

  const close = () => {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  };

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (backdrop) backdrop.addEventListener("click", close);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) close();
  });
}

function openLightbox(photo) {
  const modal = document.getElementById("lightboxModal");
  if (!modal) return;

  const imgEl = document.getElementById("lightboxImg");
  const titleEl = document.getElementById("lightboxTitle");
  const locEl = document.getElementById("lightboxLocation");
  const exifEl = document.getElementById("lightboxExif");
  const tagsEl = document.getElementById("lightboxTags");

  if (imgEl) imgEl.src = photo.full;
  if (titleEl) titleEl.textContent = photo.title || "";
  if (locEl) locEl.textContent = photo.location ? `📍 ${photo.location}` : "";

  if (exifEl && photo.exif) {
    const isoText = photo.exif.iso ? (photo.exif.iso.startsWith('ISO') ? photo.exif.iso : `ISO ${photo.exif.iso}`) : "";
    exifEl.innerHTML = `
      <div><strong>Camera:</strong> ${photo.exif.camera || "N/A"}</div>
      <div><strong>Lens:</strong> ${photo.exif.lens || "N/A"}</div>
      <div><strong>Parameters:</strong> ${photo.exif.shutter || ""} at ${photo.exif.aperture || ""}, ${isoText}</div>
    `;
  }

  if (tagsEl && Array.isArray(photo.tags)) {
    tagsEl.innerHTML = photo.tags.map(t => `<span>#${t}</span>`).join("");
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

// ==========================================================================
// 8. Theme Setup
// ==========================================================================
function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

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