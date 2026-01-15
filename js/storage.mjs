const STORAGE_KEY = "mangaHubList";

export const getSavedList = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const setSavedList = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};
