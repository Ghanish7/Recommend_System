import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';

export default function Home({ onNavigate, onMovieSelect }) {
  const [hollywoodMovies, setHollywoodMovies] = useState([]);
  const [bollywoodMovies, setBollywoodMovies] = useState([]);
  const [tollywoodMovies, setTollywoodMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchHollywood = fetch('http://127.0.0.1:8000/movies?industry=Hollywood&limit=60')
      .then(res => res.ok ? res.json() : Promise.reject("Failed Hollywood"));
      
    const fetchBollywood = fetch('http://127.0.0.1:8000/movies?industry=Bollywood&limit=10')
      .then(res => res.ok ? res.json() : Promise.reject("Failed Bollywood"));
      
    const fetchTollywood = fetch('http://127.0.0.1:8000/movies?industry=Tollywood&limit=10')
      .then(res => res.ok ? res.json() : Promise.reject("Failed Tollywood"));

    Promise.all([fetchHollywood, fetchBollywood, fetchTollywood])
      .then(([hwData, bwData, twData]) => {
        const popularHollywood = [...hwData.movies]
          .sort((a, b) => b.num_ratings - a.num_ratings)
          .slice(0, 6);
        
        setHollywoodMovies(popularHollywood);
        setBollywoodMovies(bwData.movies.slice(0, 6));
        setTollywoodMovies(twData.movies.slice(0, 6));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Error loading movie sections. Please verify the backend is running.");
        setLoading(false);
      });
  }, []);

  const renderMovieSection = (title, movies) => {
    return (
      <div className="space-y-4">
        {/* Section Heading with Blue Bullet and Blue Text */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-800/60">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-accentBlue shadow-sm shadow-accentBlue/50 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-accentBlue tracking-wide">{title}</h2>
          </div>
          <span className="text-[10px] sm:text-xs bg-accentBlue text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-accentBlue/10">
            {movies.length} FEATURED
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pt-2">
          {movies.map((movie) => (
            <MovieCard 
              key={movie.movieId} 
              movie={movie} 
              onClick={onMovieSelect} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20 relative"
    >
      {/* Hero Section */}
      <div 
        style={{ background: 'radial-gradient(ellipse at center, #0a1b3a 0%, #06060c 70%)' }}
        className="relative rounded-3xl overflow-hidden border border-accentBlue/20 p-8 sm:p-16 text-center space-y-6 shadow-2xl film-grain"
      >
        
        {/* Animated Badge */}
        <div className="inline-flex items-center space-x-2 bg-accentBlue/10 border border-accentBlue/30 px-4 py-1.5 rounded-full text-accentBlue text-xs font-bold uppercase tracking-wider animate-pulse z-10 relative">
          <Sparkles className="w-4 h-4" />
          <span>Multinational AI Recommendation Pipeline</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight z-10 relative">
          CineMatch
          <span className="block mt-2 text-accentBlue">
            AI Movie Recommender
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 font-light leading-relaxed z-10 relative">
          Personalized movie insights powered by advanced AI. Compare taste patterns and metadata clusters across Hollywood, Bollywood, and Tollywood cinema!
        </p>

        <div className="pt-4 z-10 relative">
          <button
            onClick={() => onNavigate('user-select')}
            className="group inline-flex items-center space-x-2 bg-accentBlue hover:bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-accentBlue/20 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 cursor-pointer"
          >
            <span>Get Recommendations</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Feature Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="luxury-card p-6 rounded-2xl space-y-4">
          <div className="p-3 bg-accentBlue/10 text-accentBlue w-fit rounded-xl border border-accentBlue/20">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Collaborative Filtering</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-light">
            Analyzes rating patterns of similar users to recommend cinema they enjoyed ("People Like You Also Watched").
          </p>
        </div>

        <div className="luxury-card p-6 rounded-2xl space-y-4">
          <div className="p-3 bg-accentBlue/10 text-accentBlue w-fit rounded-xl border border-accentBlue/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Content-Based Filtering</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-light">
            Utilizes TF-IDF representations of genre profiles to suggest movies closely matching your favorite themes.
          </p>
        </div>

        <div className="luxury-card p-6 rounded-2xl space-y-4">
          <div className="p-3 bg-accentBlue/10 text-accentBlue w-fit rounded-xl border border-accentBlue/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Hybrid Recommendation</h3>
          <p className="text-sm text-gray-400 leading-relaxed font-light">
            Blends neighborhood clusters with item properties to filter out biases and deliver robust, diverse recommendations.
          </p>
        </div>
      </div>

      {/* Movies Industry Rows */}
      {loading ? (
        <div className="space-y-12">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="space-y-4">
              <div className="h-6 bg-gray-800/40 w-1/4 rounded animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-darkCard/40 aspect-[2/3] rounded-xl animate-pulse flex flex-col justify-end p-4">
                    <div className="h-4 bg-gray-850 w-3/4 rounded mb-2"></div>
                    <div className="h-3 bg-gray-850 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-800/40 p-4 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-16">
          {renderMovieSection("Hollywood Classics", hollywoodMovies)}
          {renderMovieSection("Bollywood Hits", bollywoodMovies)}
          {renderMovieSection("Tollywood Blockbusters", tollywoodMovies)}
        </div>
      )}
    </motion.div>
  );
}
