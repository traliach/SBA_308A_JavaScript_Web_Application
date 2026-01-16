import { getMangaById, searchManga } from "./api/kitsu.mjs";
import { getSavedList, setSavedList } from "./storage.mjs";

console.log("Manga Hub booted");

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const categoryBar = document.getElementById("category-bar");
const featuredBar = document.getElementById("featured-bar");
const resultsGrid = document.getElementById("results-grid");
const savedGrid = document.getElementById("saved-grid");
const resultsCount = document.getElementById("results-count");
const savedCount = document.getElementById("saved-count");
const statusEl = document.getElementById("status");
const searchBtn = document.getElementById("search-btn");
const searchSpinner = document.getElementById("search-spinner");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingProgress = document.getElementById("loading-progress");
const loadingPercent = document.getElementById("loading-percent");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageIndicator = document.getElementById("page-indicator");
const detailsOffcanvasEl = document.getElementById("details-offcanvas");
const detailsBody = document.getElementById("details-body");
const savedFilter = document.getElementById("saved-filter");

const state = {
  results: [],
  saved: [],
  query: "",
  page: 1,
  hasNextPage: false,
  savedFilter: "all",
};

const CATEGORIES = [
  "Action & Adventure",
  "Comedy",
  "Crime & Thriller",
  "Dark & Horror",
  "Drama",
  "Fantasy & Magic",
  "Martial Arts",
  "Psychological",
  "Romance",
  "Sci‑Fi & Mystery",
  "Sports",
  "Slice of Life",
];

const FEATURED = [
  "One Piece",
  "Berserk",
  "Vagabond",
  "Jujutsu Kaisen",
  "Spy x Family",
  "Fullmetal Alchemist",
];

let lastRequestId = 0;
let loadingTimerId = null;
let debounceTimerId = null;
let isLoading = false;

const setControlsDisabled = (disabled) => {
  if (searchBtn) searchBtn.disabled = disabled;
  if (prevBtn) prevBtn.disabled = disabled || state.page <= 1;
  if (nextBtn) nextBtn.disabled = disabled || !state.hasNextPage;
  if (clearBtn) clearBtn.disabled = disabled;
};

const runSearch = async (query, page = 1) => {
  const requestId = ++lastRequestId;
  showStatus("Searching...", "info");
  startLoading();
  renderSkeletonCards(resultsGrid, 6);

  try {
    const result = await searchManga({ q: query, page, limit: 9 });
    if (requestId !== lastRequestId) return;
    state.results = result.items;
    state.query = query;
    state.page = page;
    state.hasNextPage = result.hasNextPage;
    showStatus("Results updated.", "success");
  } catch (error) {
    console.error(error);
    if (requestId !== lastRequestId) return;
    state.results = [];
    state.hasNextPage = false;
    renderEmpty(resultsGrid, "Search failed. Try again.");
    showStatus("Search failed. Try again.", "warning");
  }
  finishLoading();
  render();
};

const debouncedSearch = (query, page = 1) => {
  window.clearTimeout(debounceTimerId);
  debounceTimerId = window.setTimeout(() => {
    runSearch(query, page);
  }, 300);
};

const setLoadingPercent = (value) => {
  if (!loadingProgress || !loadingPercent) return;
  const clamped = Math.max(0, Math.min(100, value));
  loadingProgress.style.width = `${clamped}%`;
  loadingPercent.textContent = String(clamped);
};

const startLoading = () => {
  isLoading = true;
  setControlsDisabled(true);
  if (searchSpinner) searchSpinner.classList.remove("d-none");
  if (!loadingOverlay) return;
  loadingOverlay.classList.remove("d-none");
  setLoadingPercent(0);
  let current = 0;
  window.clearInterval(loadingTimerId);
  loadingTimerId = window.setInterval(() => {
    if (current >= 90) return;
    current += Math.floor(Math.random() * 5) + 1;
    setLoadingPercent(Math.min(90, current));
  }, 120);
};

const finishLoading = () => {
  isLoading = false;
  setControlsDisabled(false);
  if (searchSpinner) searchSpinner.classList.add("d-none");
  if (!loadingOverlay) return;
  window.clearInterval(loadingTimerId);
  setLoadingPercent(100);
  window.setTimeout(() => {
    loadingOverlay.classList.add("d-none");
  }, 300);
};

// Temporary mock data for UI wiring (replace with API results later)
const mockResults = [
  {
    id: "m1",
    title: "One Piece",
    year: 1999,
    score: 8.7,
    imageUrl: "https://placehold.co/300x420?text=Cover",
  },
  {
    id: "m2",
    title: "Jujutsu Kaisen",
    year: 2018,
    score: 8.5,
    imageUrl: "https://placehold.co/300x420?text=Cover",
  },
  {
    id: "m3",
    title: "Spy x Family",
    year: 2019,
    score: 8.3,
    imageUrl: "https://placehold.co/300x420?text=Cover",
  },
];


const loadSaved = async () => {
  state.saved = getSavedList();
};

const renderEmpty = (grid, message) => {
  grid.innerHTML = `
    <div class="col-12">
      <div class="alert alert-light mb-0">${message}</div>
    </div>
  `;
};

const renderSkeletonCards = (grid, count = 6) => {
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count })
    .map(
      () => `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm">
            <div class="card-img-top skeleton"></div>
            <div class="card-body">
              <div class="skeleton mb-2" style="height: 16px; width: 70%; border-radius: 6px;"></div>
              <div class="skeleton mb-3" style="height: 12px; width: 55%; border-radius: 6px;"></div>
              <div class="skeleton" style="height: 32px; width: 100%; border-radius: 6px;"></div>
            </div>
          </div>
        </div>
      `
    )
    .join("");
};

const showStatus = (message, type = "info") => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `alert alert-${type}`;
  statusEl.classList.remove("d-none");
  window.clearTimeout(showStatus.timerId);
  showStatus.timerId = window.setTimeout(() => {
    statusEl.classList.add("d-none");
  }, 2500);
};

const renderGrid = (grid, items, actionLabel, actionName) => {
  if (!items.length) {
    renderEmpty(grid, "Nothing to show yet.");
    return;
  }

  grid.innerHTML = items
    .map(
      (item) => {
        const isAlreadySaved =
          actionName === "save" && state.saved.some((savedItem) => savedItem.id === item.id);
        const buttonLabel =
          actionName === "save" && isAlreadySaved ? "Saved ★" : actionLabel;
        const buttonClasses =
          actionName === "save" && isAlreadySaved
            ? "btn btn-sm btn-success mt-auto"
            : "btn btn-sm btn-outline-primary mt-auto";

        const statusVariant =
          item.status === "Completed"
            ? "status-success"
            : item.status === "Reading"
              ? "status-primary"
              : "status-secondary";

        return `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm" data-manga-id="${item.id}">
            <img src="${item.imageUrl}" class="card-img-top" alt="${item.title}" />
            <div class="card-body d-flex flex-column">
              <h3 class="h6 card-title">${item.title}</h3>
              ${
                item.status
                  ? actionName === "remove"
                    ? `<button type="button" class="status-chip mb-2 ${statusVariant}" data-action="cycle-status" data-id="${item.id}" data-status="${item.status}">${item.status}</button>`
                    : `<span class="badge text-bg-secondary mb-2">${item.status}</span>`
                  : ""
              }
              <p class="small text-muted mb-3">
                Year: ${item.year ?? "N/A"} · Score: ${item.score ?? "N/A"}
              </p>
              <button
                class="${buttonClasses}"
                data-action="${actionName}"
                data-id="${item.id}"
                ${isAlreadySaved ? "disabled" : ""}
              >
                ${buttonLabel}
              </button>
            </div>
          </div>
        </div>
      `;
      }
    )
    .join("");
};

const updateCounts = () => {
  resultsCount.textContent = `${state.results.length} found`;
  savedCount.textContent = `${state.saved.length} saved`;
  if (pageIndicator) {
    pageIndicator.textContent = `Page ${state.page}`;
  }
  if (prevBtn) {
    prevBtn.disabled = state.page <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = !state.hasNextPage;
  }
};

const render = () => {
  renderGrid(resultsGrid, state.results, "Save", "save");
  const filteredSaved =
    state.savedFilter === "all"
      ? state.saved
      : state.saved.filter((item) => item.status === state.savedFilter);

  if (!filteredSaved.length) {
    const label =
      state.savedFilter === "all" ? "Nothing to show yet." : "No manga in this filter yet.";
    renderEmpty(savedGrid, label);
  } else {
    renderGrid(savedGrid, filteredSaved, "Remove", "remove");
  }
  updateCounts();
};

const findById = (list, id) => list.find((item) => item.id === id);

const renderCategoryBar = () => {
  if (!categoryBar) return;
  categoryBar.innerHTML = CATEGORIES.map(
    (name) =>
      `<button type="button" class="btn btn-sm btn-outline-primary" data-category="${name}">${name}</button>`
  ).join("");
};

const renderFeaturedBar = () => {
  if (!featuredBar) return;
  featuredBar.innerHTML = FEATURED.map(
    (name) =>
      `<button type="button" class="btn btn-sm btn-outline-dark" data-featured="${name}">★ ${name}</button>`
  ).join("");
};

if (categoryBar) {
  categoryBar.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-category]");
    if (!btn || isLoading) return;
    const category = btn.dataset.category;
    if (!category) return;

    // Fill the input so it feels like the store "collections" UX.
    if (searchInput) searchInput.value = category;
    debouncedSearch(category.toLowerCase(), 1);
  });
}

if (featuredBar) {
  featuredBar.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-featured]");
    if (!btn || isLoading) return;
    const title = btn.dataset.featured;
    if (!title) return;

    if (searchInput) searchInput.value = title;
    debouncedSearch(title.toLowerCase(), 1);
    resultsGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

const renderDetails = (details) => {
  if (!detailsBody) return;
  const genres = details.genres?.length ? details.genres.join(", ") : "N/A";
  detailsBody.innerHTML = `
    <div class="d-flex gap-3">
      ${
        details.imageUrl
          ? `<img src="${details.imageUrl}" alt="${details.title}" style="width:120px;height:auto;border-radius:8px;" />`
          : ""
      }
      <div>
        <h3 class="h6 mb-2">${details.title}</h3>
        <div class="small text-muted mb-2">
          Score: ${details.score} · Status: ${details.status}
        </div>
        <div class="small text-muted mb-2">
          Chapters: ${details.chapters} · Volumes: ${details.volumes}
        </div>
        <div class="small text-muted mb-3">
          Genres: ${genres}
        </div>
      </div>
    </div>
    <hr />
    <p class="mb-0">${details.synopsis}</p>
  `;
};

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isLoading) return;
    const query = searchInput.value.trim();
    if (!query) return;

    const normalized = query.toLowerCase();
    debouncedSearch(normalized);
  });
}

if (searchInput && form) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.results = [];
    state.query = "";
    state.page = 1;
    state.hasNextPage = false;
    render();
  });
}

if (savedFilter) {
  savedFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    state.savedFilter = button.dataset.filter;

    savedFilter.querySelectorAll("[data-filter]").forEach((el) => {
      el.classList.toggle("active", el.dataset.filter === state.savedFilter);
    });

    render();
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (!state.query || state.page <= 1) return;
    debouncedSearch(state.query, state.page - 1);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!state.query || !state.hasNextPage) return;
    debouncedSearch(state.query, state.page + 1);
  });
}

if (resultsGrid) {
  resultsGrid.addEventListener("click", async (event) => {
    const saveBtn = event.target.closest("[data-action='save']");
    if (saveBtn) return;

    const card = event.target.closest("[data-manga-id]");
    if (!card) return;

    resultsGrid.querySelectorAll(".card.card-selected").forEach((el) => {
      el.classList.remove("card-selected");
    });
    card.classList.add("card-selected");

    const mangaId = card.dataset.mangaId;
    if (!mangaId) return;

    try {
      showStatus("Loading details...", "info");
      startLoading();
      const details = await getMangaById(mangaId);
      renderDetails(details);

      if (detailsOffcanvasEl && window.bootstrap?.Offcanvas) {
        window.bootstrap.Offcanvas.getOrCreateInstance(detailsOffcanvasEl).show();
      }
    } catch (error) {
      console.error(error);
      showStatus("Details failed. Try again.", "warning");
    } finally {
      finishLoading();
    }
  });

  resultsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='save']");
    if (!button) return;

    const item = findById(state.results, button.dataset.id);
    if (!item || findById(state.saved, item.id)) return;

    state.saved = [...state.saved, { ...item, status: "Plan to Read" }];
    setSavedList(state.saved);
    render();
    showStatus("Saved to My List.", "success");
  });
}

if (savedGrid) {
  savedGrid.addEventListener("click", (event) => {
    const statusBtn = event.target.closest("[data-action='cycle-status']");
    if (statusBtn) {
      const id = statusBtn.dataset.id;
      const statuses = ["Plan to Read", "Reading", "Completed"];
      const item = state.saved.find((savedItem) => savedItem.id === id);
      if (!item) return;

      const currentIndex = Math.max(0, statuses.indexOf(item.status));
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      item.status = nextStatus;

      setSavedList(state.saved);
      render();
      showStatus(`Status: ${nextStatus}`, "info");
      const newBtn = savedGrid.querySelector(
        `[data-action='cycle-status'][data-id='${id}']`
      );
      if (newBtn) {
        newBtn.classList.remove("status-bump");
        // force reflow so animation restarts
        void newBtn.offsetWidth;
        newBtn.classList.add("status-bump");
      }
      return;
    }

    const button = event.target.closest("[data-action='remove']");
    if (!button) return;

    const item = state.saved.find(
      (savedItem) => savedItem.id === button.dataset.id
    );
    if (!item) return;

    state.saved = state.saved.filter(
      (savedItem) => savedItem.id !== item.id
    );
    setSavedList(state.saved);
    render();
    showStatus("Removed from My List.", "secondary");
  });
}

loadSaved()
  .catch((error) => {
    console.error(error);
    showStatus("Failed to load saved list.", "warning");
  })
  .finally(() => {
    renderCategoryBar();
    renderFeaturedBar();
    render();
  });
