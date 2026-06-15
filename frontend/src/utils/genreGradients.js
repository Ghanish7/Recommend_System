// Unique cinematic gradient per genre
export const genreGradients = {
  Action:    'linear-gradient(160deg, #1a0000 0%, #8B0000 50%, #FF4500 100%)',
  Adventure: 'linear-gradient(160deg, #0d2b00 0%, #1a5c00 50%, #4CAF50 100%)',
  Animation: 'linear-gradient(160deg, #1a0033 0%, #6A0DAD 50%, #FF69B4 100%)',
  Children:  'linear-gradient(160deg, #003366 0%, #0066CC 50%, #00BFFF 100%)',
  Comedy:    'linear-gradient(160deg, #332200 0%, #CC8800 50%, #FFD700 100%)',
  Crime:     'linear-gradient(160deg, #0a0a0a 0%, #1C1C1C 50%, #4A4A4A 100%)',
  Drama:     'linear-gradient(160deg, #1a0a2e 0%, #4B0082 50%, #8A2BE2 100%)',
  Fantasy:   'linear-gradient(160deg, #001a33 0%, #003D7A 50%, #4169E1 100%)',
  Horror:    'linear-gradient(160deg, #000000 0%, #1a0000 50%, #8B0000 100%)',
  Musical:   'linear-gradient(160deg, #1a0033 0%, #FF1493 50%, #FF69B4 100%)',
  Mystery:   'linear-gradient(160deg, #000d1a 0%, #003366 50%, #006699 100%)',
  Romance:   'linear-gradient(160deg, #1a0010 0%, #C2185B 50%, #FF80AB 100%)',
  'Sci-Fi':  'linear-gradient(160deg, #000d1a 0%, #003333 50%, #00FFFF 100%)',
  Thriller:  'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #2D2D44 100%)',
  War:       'linear-gradient(160deg, #1a1200 0%, #4A3800 50%, #8B6914 100%)',
  Western:   'linear-gradient(160deg, #1a0d00 0%, #8B4513 50%, #D2691E 100%)',
  Default:   'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #2d1b4e 100%)',
};

export const getGradient = (genres) => {
  if (!genres || genres.length === 0) return genreGradients.Default;
  const firstGenre = Array.isArray(genres) ? genres[0] : genres.split('|')[0];
  return genreGradients[firstGenre] || genreGradients.Default;
};

// Get genre icon emoji
export const getGenreIcon = (genres) => {
  const icons = {
    Action: '💥', Adventure: '🗺️', Animation: '🎨',
    Children: '🎠', Comedy: '😂', Crime: '🔍',
    Drama: '🎭', Fantasy: '🧙', Horror: '👻',
    Musical: '🎵', Mystery: '🕵️', Romance: '❤️',
    'Sci-Fi': '🚀', Thriller: '😱', War: '⚔️',
    Western: '🤠',
  };
  const firstGenre = Array.isArray(genres) ? genres[0] : genres?.split('|')[0];
  return icons[firstGenre] || '🎬';
};
