console.log("Manga Hub booted ✅");

const form = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const resultsGrid = document.getElementById("results-grid");
const savedGrid = document.getElementById("saved-grid");
const resultsCount = document.getElementById("results-count");
const savedCount = document.getElementById("saved-count");

const state = {
  results: [],
  saved: [],
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

const renderEmpty = (grid, message) => {
  grid.innerHTML = `
    <div class="col-12">
      <div class="alert alert-light mb-0">${message}</div>
    </div>
  `;
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
          <div class="card h-100 shadow-sm">
            <img src="${item.imageUrl}" class="card-img-top" alt="${item.title}" />
            <div class="card-body d-flex flex-column">
              <h3 class="h6 card-title">${item.title}</h3>
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
};

const render = () => {
  renderGrid(resultsGrid, state.results, "Save", "save");
  renderGrid(savedGrid, state.saved, "Remove", "remove");
  updateCounts();
};

const findById = (list, id) => list.find((item) => item.id === id);

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      return;
    }

    state.results = mockResults.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
    render();
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.results = [];
    render();
  });
}

if (resultsGrid) {
  resultsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='save']");
    if (!button) return;

    const item = findById(state.results, button.dataset.id);
    if (!item || findById(state.saved, item.id)) return;

    state.saved = [...state.saved, item];
    render();
  });
}

if (savedGrid) {
  savedGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='remove']");
    if (!button) return;

    state.saved = state.saved.filter((item) => item.id !== button.dataset.id);
    render();
  });
}

render();
