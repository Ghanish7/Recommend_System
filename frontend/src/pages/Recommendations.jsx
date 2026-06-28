import React, { useEffect, useState } from 'react';
import { Compass, Share2, Layers, Search, Filter, Loader2, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';

export default function Recommendations({ selectedUserId, onMovieSelect, onNavigate }) {
  const [cfRecs, setCfRecs] = useState([]);
  const [cbRecs, setCbRecs] = useState([]);
  const [hybridRecs, setHybridRecs] = useState([]);
  
  const [userHistory, setUserHistory] = useState([]);
  const [selectedSeedMovie, setSelectedSeedMovie] = useState(null);
  
  const [viewMode, setViewMode] = useState('split');
  const [cfMethod, setCfMethod] = useState('user');
  
  const [loading, setLoading] = useState(true);
  const [loadingCb, setLoadingCb] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const genresList = [
    "Action", "Adventure", "Animation", "Children", "Comedy", 
    "Crime", "Drama", "Fantasy", "Horror", "Mystery", 
    "Romance", "Sci-Fi", "Thriller"
  ];

  useEffect(() => {
    if (!selectedUserId) return;
    
    setLoading(true);
    setError(null);
    
    const cfPromise = fetch(`https://cinematch-backend-0a50.onrender.com/recommend/collaborative/${selectedUserId}?method=${cfMethod}`)
      .then(res => res.ok ? res.json() : Promise.reject("CF recommendations failed"));
      
    const hybridPromise = fetch(`https://cinematch-backend-0a50.onrender.com/recommend/hybrid/${selectedUserId}`)
      .then(res => res.ok ? res.json() : Promise.reject("Hybrid recommendations failed"));
      
    const historyPromise = fetch(`https://cinematch-backend-0a50.onrender.com/users?limit=50`)
      .then(res => res.ok ? res.json() : Promise.reject("Users load failed"))
      .then(data => {
        const userProf = data.users.find(u => u.userId === selectedUserId);
        return userProf ? userProf.top_history : [];
      });

    Promise.all([cfPromise, hybridPromise, historyPromise])
      .then(([cfData, hybridData, historyData]) => {
        setCfRecs(cfData);
        setHybridRecs(hybridData);
        setUserHistory(historyData);
        
        if (historyData && historyData.length > 0) {
          const sortedHistory = [...historyData].sort((a, b) => b.rating - a.rating);
          const topMovie = sortedHistory[0];
          setSelectedSeedMovie(topMovie);
          fetchContentBased(topMovie.movieId);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setError("Error loading recommendations. Please ensure the backend server is running.");
        setLoading(false);
      });
  }, [selectedUserId, cfMethod]);

  const fetchContentBased = (movieId) => {
    setLoadingCb(true);
    fetch(`https://cinematch-backend-0a50.onrender.com/recommend/content/${movieId}`)
      .then(res => {
        if (!res.ok) throw new Error("Content recommendations failed");
        return res.json();
      })
      .then(data => {
        setCbRecs(data);
        setLoadingCb(false);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingCb(false);
        setLoading(false);
      });
  };

  const handleSeedChange = (e) => {
    const movieId = parseInt(e.target.value);
    const movie = userHistory.find(m => m.movieId === movieId);
    if (movie) {
      setSelectedSeedMovie(movie);
      fetchContentBased(movieId);
    }
  };

  const filterMovies = (movieList) => {
    return movieList.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGenre = selectedGenre === '' || 
        movie.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase());
        
      return matchesSearch && matchesGenre;
    });
  };

  if (!selectedUserId) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-gray-400">Please select a User ID before retrieving recommendations.</p>
        <button
          onClick={() => onNavigate('user-select')}
          className="bg-accentBlue text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600"
        >
          Select User Profile
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8"
    >
      {/* Header and Toggles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-800 pb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-3">
            <Compass className="w-8 h-8 text-accentBlue" />
            <span className="text-accentBlue">Personalized Recommendations</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-light">
            Recommender dashboard for Mock User ID: <span className="text-accentBlue font-bold">{selectedUserId}</span>
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center self-start md:self-center bg-black border border-gray-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-xl text-xs font-bold uppercase transition-all duration-300 ${
              viewMode === 'split'
                ? 'bg-accentBlue text-white shadow-md shadow-accentBlue/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Split Engines</span>
          </button>
          
          <button
            onClick={() => setViewMode('hybrid')}
            className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-xl text-xs font-bold uppercase transition-all duration-300 ${
              viewMode === 'hybrid'
                ? 'bg-accentBlue text-white shadow-md shadow-accentBlue/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hybrid Engine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-darkCard/40 glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-grow max-w-md relative">
          <input
            type="text"
            placeholder="Search recommended movies by title or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-gray-800 focus:border-accentBlue hover:border-accentBlue/45 px-4 py-2.5 pl-10.5 rounded-xl text-sm text-white focus:outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-3 text-gray-500 w-4 h-4" />
        </div>

        {/* Genre Tags Scrollable Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
          <div className="shrink-0 text-gray-400 text-xs flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-accentBlue" />
            <span>Genre:</span>
          </div>
          
          <button
            onClick={() => setSelectedGenre('')}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              selectedGenre === ''
                ? 'bg-accentBlue/15 border-accentBlue text-accentBlue'
                : 'bg-black border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            All
          </button>

          {genresList.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 transition-all ${
                selectedGenre === genre
                  ? 'bg-accentBlue/15 border-accentBlue text-accentBlue'
                  : 'bg-black border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-accentBlue animate-spin" />
          <p className="text-gray-400 text-sm">Processing Collaborative and Content similarity matrices...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-800/40 p-6 rounded-2xl text-red-400 text-center max-w-lg mx-auto">
          {error}
        </div>
      ) : viewMode === 'split' ? (
        
        /* Side by Side view mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section A: Collaborative Filtering */}
          <div className="space-y-6 bg-darkCard/20 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center space-x-2.5">
                <Compass className="w-5 h-5 text-accentBlue" />
                <h3 className="font-bold text-lg text-white">People Like You Also Watched</h3>
              </div>
              
              {/* CF Toggle */}
              <div className="flex items-center bg-black border border-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => setCfMethod('user')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    cfMethod === 'user' ? 'bg-accentBlue/15 text-accentBlue border border-accentBlue/35' : 'text-gray-400'
                  }`}
                >
                  User-Based
                </button>
                <button
                  onClick={() => setCfMethod('item')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    cfMethod === 'item' ? 'bg-accentBlue/15 text-accentBlue border border-accentBlue/35' : 'text-gray-400'
                  }`}
                >
                  Item-Based
                </button>
              </div>
            </div>

            {filterMovies(cfRecs).length === 0 ? (
              <div className="py-20 text-center text-gray-600 text-sm font-light">
                No collaborative recommendations match your search/genre filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filterMovies(cfRecs).slice(0, 10).map((movie) => (
                  <MovieCard 
                    key={movie.movieId} 
                    movie={movie} 
                    onClick={onMovieSelect} 
                    activeAlgorithm={cfMethod === 'user' ? 'User-Based CF' : 'Item-Based CF'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section B: Content-Based Filtering */}
          <div className="space-y-6 bg-darkCard/20 border border-gray-800 p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
              <div className="flex items-center space-x-2.5">
                <Share2 className="w-5 h-5 text-accentBlue" />
                <h3 className="font-bold text-lg text-white">Because You Liked...</h3>
              </div>
              
              {/* Dynamic seed movie selector */}
              {userHistory.length > 0 && selectedSeedMovie && (
                <div className="flex items-center space-x-1">
                  <select
                    value={selectedSeedMovie.movieId}
                    onChange={handleSeedChange}
                    className="bg-black border border-gray-850 text-xs text-gray-300 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-accentBlue max-w-[200px]"
                  >
                    {userHistory.map((hist) => (
                      <option key={hist.movieId} value={hist.movieId}>
                        {hist.title.replace(/\s*\(\d{4}\)\s*/g, '')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {loadingCb ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-2">
                <Loader2 className="w-8 h-8 text-accentBlue animate-spin" />
                <p className="text-xs text-gray-500">Loading similarity matching...</p>
              </div>
            ) : filterMovies(cbRecs).length === 0 ? (
              <div className="py-20 text-center text-gray-600 text-sm font-light">
                No content-based recommendations match your search/genre filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filterMovies(cbRecs).slice(0, 10).map((movie) => (
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

        </div>
      ) : (
        
        /* Combined Hybrid view mode */
        <div className="bg-darkCard/10 border border-gray-800 p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
            <Layers className="w-6 h-6 text-accentBlue" />
            <div>
              <h3 className="font-bold text-xl text-white">Hybrid Recommendation List</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-light">Combines User taste similarities with metadata genre analysis.</p>
            </div>
          </div>
          
          {filterMovies(hybridRecs).length === 0 ? (
            <div className="py-20 text-center text-gray-600 text-sm font-light">
              No hybrid recommendations match your search/genre filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filterMovies(hybridRecs).slice(0, 10).map((movie) => (
                <MovieCard 
                  key={movie.movieId} 
                  movie={movie} 
                  onClick={onMovieSelect} 
                  activeAlgorithm="Hybrid"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
