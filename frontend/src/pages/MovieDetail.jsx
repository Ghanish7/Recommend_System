import { API_URL } from "../config";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Film, HelpCircle, Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import StarRating from '../components/StarRating';
import MovieCard from '../components/MovieCard';

// Global cache to prevent multiple fetches
const posterCache = {};

export default function MovieDetail({ movieId, onBack, onMovieSelect }) {
  const [movieDetail, setMovieDetail] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    if (!movieId) return;
    
    setLoading(true);
    setError(null);
    setPosterUrl(null);
    
    // Fetch details
    const movieFetchPromise = fetch(`${API_URL}/movies/${movieId}`)
      .then(res => {
        if (!res.ok) throw new Error("Movie details not found");
        return res.json();
      });

    const similarFetchPromise = fetch(`${API_URL}/recommend/content/${movieId}`)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch similar movies"));

    Promise.all([movieFetchPromise, similarFetchPromise])
      .then(([detail, similar]) => {
        setMovieDetail(detail);
        setSimilarMovies(similar.slice(0, 6)); // Top 6 similar
        setLoading(false);
        
        // Fetch movie poster
        const cleanSearchTitle = detail.title.replace(/\s*\(\d{4}\)\s*/g, '').trim();
        const cached = posterCache[movieId] || sessionStorage.getItem(`poster_${movieId}`);
        if (cached) {
          setPosterUrl(cached);
          return;
        }

        const searchUrl = `${API_URL}/wiki/poster?title=${encodeURIComponent(cleanSearchTitle)}`;
        fetch(searchUrl)
          .then(res => res.json())
          .then(data => {
            const pages = data.query?.pages;
            if (pages) {
              const pageId = Object.keys(pages)[0];
              if (pageId !== "-1" && pages[pageId].original) {
                const source = pages[pageId].original.source;
                setPosterUrl(source);
                posterCache[movieId] = source;
                try {
                  sessionStorage.setItem(`poster_${movieId}`, source);
                } catch (e) {}
              }
            }
          })
          .catch(e => console.error("Error loading detail poster:", e));
      })
      .catch(err => {
        console.error(err);
        setError("Error loading movie details. Ensure the backend server is running.");
        setLoading(false);
      });
  }, [movieId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-accentBlue animate-spin" />
        <p className="text-gray-400 text-sm">Retrieving movie profile and similarity matches...</p>
      </div>
    );
  }

  if (error || !movieDetail) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-red-400">{error || "Failed to load movie details."}</p>
        <button
          onClick={onBack}
          className="bg-accentBlue text-white px-6 py-2 rounded-xl hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Extract year from title
  const yearMatch = movieDetail.title.match(/\((\d{4})\)/);
  const year = yearMatch ? yearMatch[1] : null;
  const cleanTitle = movieDetail.title.replace(/\s*\(\d{4}\)\s*/g, '');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12"
    >
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-accentBlue transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Dashboard</span>
      </button>

      {/* Movie Profile Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-darkCard/30 glass-card rounded-3xl overflow-hidden p-6 sm:p-10 shadow-2xl relative border border-accentBlue/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accentBlue/5 rounded-full blur-3xl"></div>
        
        {/* Poster Panel */}
        <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-900 to-black border border-accentBlue/20 rounded-2xl overflow-hidden shadow-lg shadow-black/80 flex flex-col justify-between p-6">
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt={cleanTitle} 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
          )}
          {/* Shadow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/60 z-0"></div>
          
          <span className="text-xs font-bold text-accentBlue tracking-wider z-10">CINE MATCH</span>
          
          {!posterUrl && (
            <span className="text-6xl font-black text-white/5 select-none self-center z-10">FILM</span>
          )}
          {posterUrl && <div className="flex-grow"></div>}

          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-bold text-accentBlue bg-black/60 border border-accentBlue/30 px-2 py-0.5 rounded shadow-sm">
              {movieDetail.industry ? movieDetail.industry.toUpperCase() : "HOLLYWOOD"}
            </span>
            {year && <span className="text-xs font-bold text-gray-400">{year}</span>}
          </div>
        </div>

        {/* Details Content */}
        <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-accentBlue/10 text-accentBlue border border-accentBlue/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                {movieDetail.industry || "Hollywood"} Film
              </span>
              {year && (
                <span className="bg-black text-gray-400 border border-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                  Year: {year}
                </span>
              )}
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {cleanTitle}
            </h2>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 pt-1.5">
              {movieDetail.genres && movieDetail.genres.map((genre, i) => (
                <span 
                  key={i} 
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-accentBlue/15 border border-accentBlue/20 text-accentBlue"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Ratings Stats widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-black/60 p-4 rounded-2xl border border-accentBlue/10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Average Rating</span>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-black text-white">{movieDetail.avg_rating ? movieDetail.avg_rating.toFixed(2) : '0.0'}</span>
                <span className="text-accentBlue text-xl">★</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating Count</span>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-black text-white">{movieDetail.num_ratings}</span>
                <span className="text-gray-400 text-xs font-medium">reviews</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">User Rating Stars</span>
              <div className="flex items-center h-8">
                <StarRating rating={movieDetail.avg_rating || 0} size={16} showNumber={false} />
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400 leading-relaxed max-w-xl font-light">
            This {movieDetail.industry ? movieDetail.industry.toLowerCase() : "Hollywood"} film profiles under the following genre categorizations: {movieDetail.genres ? movieDetail.genres.join(', ') : 'None'}. It has been analyzed by our collaborative and content-based recommendation matrix. Users who rated this highly also liked the recommendations listed below.
          </div>
        </div>
      </div>

      {/* Similar Movies Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-800">
          <Film className="w-5 h-5 text-accentBlue" />
          <h3 className="text-xl font-bold text-white">Similar Movies You Might Like</h3>
        </div>

        {similarMovies.length === 0 ? (
          <p className="text-sm text-gray-500">No similar movies found based on genres.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {similarMovies.map((movie) => (
              <MovieCard 
                key={movie.movieId} 
                movie={movie} 
                onClick={onMovieSelect} 
                activeAlgorithm="Content-Based"
              />
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
}
