import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import UserSelect from './pages/UserSelect';
import Recommendations from './pages/Recommendations';
import MovieDetail from './pages/MovieDetail';
import Evaluation from './pages/Evaluation';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [selectedUserId, setSelectedUserId] = useState(1); // Default to User 1
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [pageHistory, setPageHistory] = useState(['home']);

  // Handle page navigation and hash routing
  const navigateTo = (pageId) => {
    setActivePage(pageId);
    setSelectedMovieId(null);
    setPageHistory(prev => [...prev, pageId]);
    window.location.hash = pageId;
  };

  const handleMovieSelect = (movieId) => {
    setSelectedMovieId(movieId);
    setActivePage('movie-detail');
    setPageHistory(prev => [...prev, `movie/${movieId}`]);
    window.location.hash = `movie/${movieId}`;
  };

  const handleBack = () => {
    // Navigate back to the previous page in history
    if (pageHistory.length > 1) {
      const nextHistory = [...pageHistory];
      nextHistory.pop(); // Remove current page
      const prevPage = nextHistory[nextHistory.length - 1];
      
      setPageHistory(nextHistory);
      
      if (prevPage.startsWith('movie/')) {
        const id = parseInt(prevPage.split('/')[1]);
        setSelectedMovieId(id);
        setActivePage('movie-detail');
        window.location.hash = prevPage;
      } else {
        setSelectedMovieId(null);
        setActivePage(prevPage);
        window.location.hash = prevPage;
      }
    } else {
      navigateTo('recommendations');
    }
  };

  // Listen to hash changes for deep linking (e.g. sharing movie detail links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setActivePage('home');
        setSelectedMovieId(null);
        return;
      }

      if (hash.startsWith('movie/')) {
        const movieId = parseInt(hash.split('/')[1]);
        if (!isNaN(movieId)) {
          setSelectedMovieId(movieId);
          setActivePage('movie-detail');
        }
      } else if (['home', 'user-select', 'recommendations', 'evaluation'].includes(hash)) {
        setSelectedMovieId(null);
        setActivePage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check on mount
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col">
      <Navbar 
        activePage={activePage} 
        setActivePage={navigateTo} 
        selectedUserId={selectedUserId} 
      />

      <main className="flex-grow">
        {activePage === 'home' && (
          <Home 
            onNavigate={navigateTo} 
            onMovieSelect={handleMovieSelect} 
          />
        )}
        
        {activePage === 'user-select' && (
          <UserSelect 
            selectedUserId={selectedUserId} 
            setSelectedUserId={setSelectedUserId} 
            onNavigate={navigateTo} 
          />
        )}
        
        {activePage === 'recommendations' && (
          <Recommendations 
            selectedUserId={selectedUserId} 
            onMovieSelect={handleMovieSelect} 
            onNavigate={navigateTo} 
          />
        )}
        
        {activePage === 'movie-detail' && (
          <MovieDetail 
            movieId={selectedMovieId} 
            onBack={handleBack} 
            onMovieSelect={handleMovieSelect} 
          />
        )}
        
        {activePage === 'evaluation' && (
          <Evaluation />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-darkCard/30 border-t border-gray-900 py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-gray-400">CineMatch – AI Movie Recommender System</p>
          <p>Built with React, Tailwind CSS, FastAPI, and Scikit-Learn.</p>
          <p className="text-[10px] text-gray-600">&copy; {new Date().getFullYear()} CineMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
