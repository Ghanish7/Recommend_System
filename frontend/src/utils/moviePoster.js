// Wikipedia API - No key needed, completely free
export const fetchMoviePoster = async (movieTitle, year) => {
  try {
    // Clean title: remove year in parentheses and strip special characters
    const cleanTitle = movieTitle
      .replace(/\s*\(\d{4}\)\s*/g, '')
      .replace(/[^\w\s-]/gi, '')
      .trim();
    
    // Try Wikipedia page summary API
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (data.thumbnail && data.thumbnail.source) {
      // Get higher resolution version
      return data.thumbnail.source.replace(/\/\d+px-/, '/400px-');
    }
    
    // Fallback: Try Wikipedia search API
    const searchFallback = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle + ' film')}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    );
    const fallbackData = await searchFallback.json();
    const pages = fallbackData.query.pages;
    const page = Object.values(pages)[0];
    
    if (page.thumbnail) return page.thumbnail.source;
    
    return null; // Will trigger CSS gradient fallback
  } catch (err) {
    console.error("Error fetching poster from Wikipedia:", err);
    return null;
  }
};

// Cache posters in localStorage to avoid repeated API calls
export const getCachedPoster = async (movieTitle, year) => {
  const cacheKey = `poster_${movieTitle}_${year}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;
  
  const url = await fetchMoviePoster(movieTitle, year);
  if (url) localStorage.setItem(cacheKey, url);
  return url;
};
