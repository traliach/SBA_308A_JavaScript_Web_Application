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
  return (data.data ?? []).map(toCardItem);
};
