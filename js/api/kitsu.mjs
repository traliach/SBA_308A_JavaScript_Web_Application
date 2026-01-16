// Convert Kitsu API item into the shape we use in cards
const toCardItem = (item) => {
  const attrs = item.attributes ?? {};
  const title = attrs.canonicalTitle ?? attrs.titles?.en ?? attrs.titles?.en_jp ?? "Untitled";

  const startYear = attrs.startDate ? String(attrs.startDate).slice(0, 4) : "N/A";

  const rating = attrs.averageRating ? Number.parseFloat(attrs.averageRating) : null; // 0-100
  const score10 = Number.isFinite(rating) ? (rating / 10).toFixed(1) : "N/A";

  return {
    id: String(item.id),
    title,
    year: startYear,
    score: score10,
    imageUrl:
      attrs.posterImage?.medium ??
      attrs.posterImage?.small ??
      "https://placehold.co/300x420?text=No+Image",
  };
};

// Search manga (Kitsu uses offset pagination)
export const searchManga = async ({ q, page = 1, limit = 9 }) => {
  const offset = (page - 1) * limit;
  const url =
    `https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(q)}` +
    `&page[limit]=${limit}&page[offset]=${offset}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kitsu request failed (${response.status})`);
  }
  const data = await response.json();

  return {
    items: (data.data ?? []).map(toCardItem),
    hasNextPage: Boolean(data.links?.next),
  };
};

// Get one manga with details + categories
export const getMangaById = async (id) => {
  const url = `https://kitsu.io/api/edge/manga/${encodeURIComponent(id)}?include=categories`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kitsu details failed (${response.status})`);
  }

  const json = await response.json();
  const attrs = json.data?.attributes ?? {};

  const title =
    attrs.canonicalTitle ?? attrs.titles?.en ?? attrs.titles?.en_jp ?? "Untitled";

  const rating = attrs.averageRating ? Number.parseFloat(attrs.averageRating) : null;
  const score10 = Number.isFinite(rating) ? (rating / 10).toFixed(1) : "N/A";

  const genres =
    (json.included ?? [])
      .filter((x) => x.type === "categories")
      .map((x) => x.attributes?.title)
      .filter(Boolean) ?? [];

  return {
    id: String(json.data?.id ?? id),
    title,
    synopsis: attrs.synopsis ?? "No synopsis available.",
    score: score10,
    status: attrs.status ?? "N/A",
    chapters: attrs.chapterCount ?? "N/A",
    volumes: attrs.volumeCount ?? "N/A",
    genres,
    imageUrl: attrs.posterImage?.large ?? attrs.posterImage?.original ?? attrs.posterImage?.medium,
  };
};
