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
  initExperienceTimelines();
  initRecipeTabs();
  initBookLog();
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
// ==========================================================================
// Continuous Dynamic Elevation Counter & Ascending Topo
// ==========================================================================
function initAscendingTopo() {
  const climber = document.getElementById("climber");
  const topo = document.getElementById("cragTopo");
  const holdNodes = Array.from(document.querySelectorAll(".hold-node"));
  const elevationLabel = document.getElementById("elevationLabel");

  if (!climber || !topo || holdNodes.length === 0) return;

  const MAX_ELEVATION_METRES = 1500; // Peak summit altitude

  // 1. Function to calculate elevation purely based on scroll position
  function updateElevationDisplay() {
    if (!elevationLabel) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      elevationLabel.textContent = `Elevation: 0 metres`;
      return;
    }

    // scrollRatio: 0 at absolute bottom (Base Camp), 1 at absolute top (Summit)
    const currentScroll = window.scrollY;
    const climbProgress = Math.max(0, Math.min(1, (maxScroll - currentScroll) / maxScroll));

    // Calculate exact meters
    const currentMetres = Math.round(climbProgress * MAX_ELEVATION_METRES);
    elevationLabel.textContent = `Elevation: ${currentMetres} metres`;
  }

  // 2. Position the sprite on the closest hold
  function moveClimberToHold(holdBtn) {
    if (!holdBtn) return;

    const holdRect = holdBtn.getBoundingClientRect();
    const topoRect = topo.getBoundingClientRect();
    const targetY = (holdRect.top - topoRect.top) + (holdRect.height / 2);

    climber.style.top = `${targetY}px`;

    holdNodes.forEach(b => b.classList.remove("active"));
    holdBtn.classList.add("active");
  }

  // 3. Click handler: smooth scroll to selected pitch
  holdNodes.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Map holds to DOM sections
  const pairs = holdNodes.map(btn => ({
    btn: btn,
    sec: document.querySelector(btn.getAttribute("data-target"))
  })).filter(p => p.sec !== null);

  // 4. Combined onScroll handler
  function onScrollHandler() {
    // A. Update live counting metres
    updateElevationDisplay();

    // B. Snap climber sprite to the hold closest to viewport center
    const viewportCenter = window.innerHeight * 0.5;
    let closestPair = null;
    let minDistance = Infinity;

    pairs.forEach(pair => {
      const rect = pair.sec.getBoundingClientRect();
      const sectionCenter = rect.top + (rect.height / 2);
      const dist = Math.abs(sectionCenter - viewportCenter);

      if (dist < minDistance) {
        minDistance = dist;
        closestPair = pair;
      }
    });

    // Lock to V0 hold if user reaches the bottom margin
    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.documentElement.scrollHeight - 50) {
      const basePair = pairs.find(p => p.btn.getAttribute("data-grade") === "V0");
      if (basePair) closestPair = basePair;
    }

    if (closestPair) {
      moveClimberToHold(closestPair.btn);
    }
  }

  window.addEventListener("scroll", onScrollHandler, { passive: true });
  window.addEventListener("resize", onScrollHandler);

  // Initial setup at bottom
  updateElevationDisplay();
  const baseBtn = document.querySelector('.hold-node[data-grade="V0"]') || holdNodes[holdNodes.length - 1];
  setTimeout(() => {
    moveClimberToHold(baseBtn);
    updateElevationDisplay();
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

  // 🚀 DYNO: Leap from base straight to TOP
  if (dynoBtn) {
    dynoBtn.addEventListener("click", () => {
      if (climber) {
        climber.classList.add("dyno-jumping");
        emitChalkExplosion();
      }
      
      const summit = document.getElementById("v10-future");
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
// Experience Card Expansion & Date-Scaled Vertical Timeline
// ==========================================================================
function initExperienceTimelines() {
  const cards = document.querySelectorAll(".exp-card.expandable");

  cards.forEach(card => {
    const trigger = card.querySelector(".exp-toggle-trigger");
    if (!trigger) return;

    // Toggle Card Expansion
    trigger.addEventListener("click", () => {
      const isOpen = card.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Support keyboard navigation (Enter / Space)
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger.click();
      }
    });

    // Dynamically space nodes based on data-date (YYYY-MM)
    const milestones = Array.from(card.querySelectorAll(".timeline-milestone"));
    if (milestones.length > 1) {
      for (let i = 0; i < milestones.length - 1; i++) {
        const currentMilestone = milestones[i];
        const nextMilestone = milestones[i + 1];

        const dateStrA = currentMilestone.getAttribute("data-date");
        const dateStrB = nextMilestone.getAttribute("data-date");

        if (dateStrA && dateStrB) {
          const dateA = new Date(dateStrA + "-01");
          const dateB = new Date(dateStrB + "-01");

          // Calculate month difference
          const monthsDiff = Math.max(1, Math.round(Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24 * 30.44)));

          // Scale spacing: baseline 18px + 7px per month of tenure (clamped between 20px and 90px)
          const dynamicGap = Math.min(90, Math.max(20, 18 + monthsDiff * 7));
          currentMilestone.style.marginBottom = `${dynamicGap}px`;
        }
      }
    }
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

function initRecipeTabs() {
  const tabBtns = document.querySelectorAll(".recipe-tab-btn");
  const tabPanels = document.querySelectorAll(".recipe-tab-panel");

  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPanelId = btn.getAttribute("data-recipe-tab");

      tabBtns.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      tabPanels.forEach(panel => {
        panel.classList.toggle("active", panel.id === targetPanelId);
      });
    });
  });
}

// ==========================================================================
// Book Log Engine: Stable Rating Sort, Search, and 4-Book Limit Toggle
// ==========================================================================
function initBookLog() {
  const grid = document.getElementById("bookGrid");
  const searchInput = document.getElementById("bookSearch");
  const toggleBtn = document.getElementById("bookToggleBtn");
  const countLabel = document.getElementById("bookCount");

  if (!grid) return;

  let isExpanded = false;
  const originalCards = Array.from(grid.querySelectorAll(".book-cell"));

  // 1. Sort top to bottom by rating descending (5 stars at top)
  // Stable sort: If rating is tied, preserve their original relative HTML order
  const sortedCards = originalCards
    .map((card, index) => ({ card, originalIndex: index }))
    .sort((a, b) => {
      const ratingA = parseFloat(a.card.getAttribute("data-rating")) || 0;
      const ratingB = parseFloat(b.card.getAttribute("data-rating")) || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA; // Higher rating first
      }
      return a.originalIndex - b.originalIndex; // Stable tie-breaker
    })
    .map(item => item.card);

  // Append sorted cards back to DOM container
  sortedCards.forEach(card => grid.appendChild(card));

  // 2. Render function applying Search + 4-item Collapse logic
  function renderBooks() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let matchCount = 0;

    sortedCards.forEach(card => {
      const title = (card.getAttribute("data-title") || "").toLowerCase();
      const author = (card.getAttribute("data-author") || "").toLowerCase();
      const genre = (card.getAttribute("data-genre") || "").toLowerCase();
      const rating = (card.getAttribute("data-rating") || "").toLowerCase();
      const text = card.textContent.toLowerCase();

      // Check if card matches search query
      const matches = !query || 
        title.includes(query) || 
        author.includes(query) || 
        genre.includes(query) || 
        rating.startsWith(query) || 
        text.includes(query);

      if (matches) {
        matchCount++;
        // If query is active OR expanded, show all matches.
        // Otherwise only show the first 4 matching books.
        if (query.length > 0 || isExpanded || matchCount <= 4) {
          card.classList.remove("book-hidden");
        } else {
          card.classList.add("book-hidden");
        }
      } else {
        card.classList.add("book-hidden");
      }
    });

    // Update Counter and Toggle Button Label
    if (countLabel) {
      if (query.length > 0) {
        countLabel.textContent = `Found ${matchCount} of ${sortedCards.length} books`;
      } else {
        const visibleCount = isExpanded ? sortedCards.length : Math.min(4, sortedCards.length);
        countLabel.textContent = `Showing ${visibleCount} of ${sortedCards.length} books`;
      }
    }

    if (toggleBtn) {
      // Hide the toggle button if a search query is active
      if (query.length > 0 || sortedCards.length <= 4) {
        toggleBtn.style.display = "none";
      } else {
        toggleBtn.style.display = "inline-flex";
        toggleBtn.innerHTML = isExpanded 
          ? `<span>▲ Collapse to Top 4 Books</span>` 
          : `<span>▼ Show All Books (${sortedCards.length})</span>`;
      }
    }
  }

  // 3. Event Listeners
  if (searchInput) {
    searchInput.addEventListener("input", renderBooks);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isExpanded = !isExpanded;
      renderBooks();
    });
  }

  // Initial render
  renderBooks();
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