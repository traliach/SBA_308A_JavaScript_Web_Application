const toCardItem = (item) => ({
  id: String(item.mal_id),
  title: item.title,
  year: item.year ?? "N/A",
  score: item.score ?? "N/A",
  imageUrl: item.images?.jpg?.image_url ?? "https://placehold.co/300x420?text=No+Image",
});

export const searchManga = async ({ q, page = 1, limit = 9 }) => {
  const url =
    `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}` +
    `&page=${page}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Jikan request failed");
  }
  const data = await response.json();
  return {
    items: (data.data ?? []).map(toCardItem),
    hasNextPage: data.pagination?.has_next_page ?? false,
  };
};

export const getMangaById = async (id) => {
  const url = `https://api.jikan.moe/v4/manga/${encodeURIComponent(id)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Jikan details failed");
  }
  const data = await response.json();
  const item = data.data;
  return {
    id: String(item.mal_id),
    title: item.title,
    synopsis: item.synopsis ?? "No synopsis available.",
    score: item.score ?? "N/A",
    status: item.status ?? "N/A",
    chapters: item.chapters ?? "N/A",
    volumes: item.volumes ?? "N/A",
    genres: (item.genres ?? []).map((g) => g.name),
    imageUrl: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url,
  };
};
