import { getMangaById, searchManga } from "./api/jikan.mjs";
import { getSavedList, setSavedList } from "./storage.mjs";

console.log("Manga Hub booted");

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const resultsGrid = document.getElementById("results-grid");
const savedGrid = document.getElementById("saved-grid");
const resultsCount = document.getElementById("results-count");
const savedCount = document.getElementById("saved-count");
const statusEl = document.getElementById("status");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingProgress = document.getElementById("loading-progress");
const loadingPercent = document.getElementById("loading-percent");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageIndicator = document.getElementById("page-indicator");
const detailsOffcanvasEl = document.getElementById("details-offcanvas");
const detailsBody = document.getElementById("details-body");

const state = {
  results: [],
  saved: [],
  query: "",
  page: 1,
  hasNextPage: false,
};

let lastRequestId = 0;
let loadingTimerId = null;
let debounceTimerId = null;

const runSearch = async (query, page = 1) => {
  const requestId = ++lastRequestId;
  showStatus("Searching...", "info");
  startLoading();

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
      (item) => `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card h-100 shadow-sm" data-manga-id="${item.id}">
            <img src="${item.imageUrl}" class="card-img-top" alt="${item.title}" />
            <div class="card-body d-flex flex-column">
              <h3 class="h6 card-title">${item.title}</h3>
              ${item.status ? `<span class="badge text-bg-secondary mb-2">${item.status}</span>` : ""}
              <p class="small text-muted mb-3">
                Year: ${item.year ?? "N/A"} · Score: ${item.score ?? "N/A"}
              </p>
              <button
                class="btn btn-sm btn-outline-primary mt-auto"
                data-action="${actionName}"
                data-id="${item.id}"
              >
                ${actionLabel}
              </button>
            </div>
          </div>
        </div>
      `
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
  renderGrid(savedGrid, state.saved, "Remove", "remove");
  updateCounts();
};

const findById = (list, id) => list.find((item) => item.id === id);

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
    render();
  });
