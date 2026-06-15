import React, { useState, useEffect } from 'react';
import { HelpCircle, Share2, Eye, Calendar } from 'lucide-react';
import StarRating from './StarRating';
import AlgorithmBadge from './AlgorithmBadge';
import { getCachedPoster } from '../utils/moviePoster';
import { getGradient, getGenreIcon } from '../utils/genreGradients';

export default function MovieCard({ movie, onClick, activeAlgorithm }) {
  const { title, genres, avg_rating, num_ratings, predicted_rating, algorithm, reason, movieId } = movie;

  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posterUrl, setPosterUrl] = useState(null);
  const [posterLoading, setPosterLoading] = useState(true);
  const [posterError, setPosterError] = useState(false);

  // Clean title
  const cleanTitle = title.replace(/\s*\(\d{4}\)\s*/g, '');
  const yearMatch = title.match(/\((\d{4})\)/);
  const year = yearMatch ? yearMatch[1] : null;

  useEffect(() => {
    let cancelled = false;
    setPosterLoading(true);
    setPosterError(false);

    getCachedPoster(cleanTitle, year).then((url) => {
      if (!cancelled) {
        setPosterUrl(url);
        setPosterLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [title]);

  const ratingToShow = predicted_rating !== undefined ? predicted_rating : avg_rating;
  const displayAlgorithm = algorithm || activeAlgorithm;

  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#movie/${movieId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div 
      onClick={() => onClick && onClick(movieId)}
      className="group relative luxury-card rounded-xl overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Poster Container */}
      <div className="poster-container" style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
        
        {/* Loading shimmer */}
        {posterLoading && (
          <div className="shimmer" style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(90deg, #0d0d1e 25%, rgba(59, 130, 246, 0.1) 37%, #0d0d1e 63%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }} />
        )}

        {/* Wikipedia poster image */}
        {!posterLoading && posterUrl && !posterError && (
          <img
            src={posterUrl}
            alt={cleanTitle}
            onError={() => setPosterError(true)}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top',
              transition: 'transform 0.4s ease',
            }}
            className="group-hover:scale-105"
          />
        )}

        {/* CSS Gradient Fallback */}
        {(!posterLoading && (!posterUrl || posterError)) && (
          <div style={{
            width: '100%', height: '100%',
            background: getGradient(genres),
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '48px' }}>{getGenreIcon(genres)}</span>
            <span style={{
              color: 'rgba(255,255,255,0.9)', fontWeight: 'bold',
              fontSize: '13px', textAlign: 'center',
              padding: '0 12px', lineHeight: '1.3',
            }}>
              {cleanTitle}
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.5)', fontSize: '11px',
            }}>
              {year}
            </span>
          </div>
        )}

        {/* Dark gradient overlay on bottom of poster */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
          background: 'linear-gradient(to top, #141414, transparent)',
        }} />

        {/* Top bar on poster */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-20">
          <div>
            {displayAlgorithm && (
              <AlgorithmBadge algorithm={displayAlgorithm} />
            )}
          </div>
          <div className="flex items-center space-x-1">
            {reason && (
              <div className="relative">
                <button 
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(!showTooltip);
                  }}
                  className="bg-black/85 backdrop-blur-md hover:bg-accentBlue hover:text-black p-1.5 rounded-full text-gray-300 transition-all border border-accentBlue/20"
                  title="Why recommended?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                {showTooltip && (
                  <div className="absolute right-0 top-8 w-60 p-3 bg-black border border-accentBlue/30 text-gray-200 text-xs rounded-lg shadow-2xl z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-semibold text-accentBlue mb-1">Recommendation Insights</p>
                    <p className="leading-relaxed">{reason}</p>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={handleShare}
              className="bg-black/85 backdrop-blur-md hover:bg-accentBlue hover:text-black p-1.5 rounded-full text-gray-300 transition-all border border-accentBlue/20"
              title="Copy share link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Share toast overlay */}
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-30 transition-all duration-300">
            <span className="bg-accentBlue text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-accentBlue/30 border border-accentBlue/50 animate-bounce">
              Link Copied!
            </span>
          </div>
        )}

        {/* Year and Rating badges over poster */}
        <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
          <span style={{
            background: 'rgba(0,0,0,0.8)', color: 'var(--color-accentBlue, #3b82f6)',
            fontSize: '11px', padding: '2px 7px', borderRadius: '4px',
          }} className="font-bold border border-accentBlue/25">📅 {year || 'N/A'}</span>
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
          <span style={{
            background: 'rgba(0,0,0,0.8)', color: 'var(--color-accentBlue, #3b82f6)',
            fontSize: '11px', padding: '2px 7px', borderRadius: '4px',
          }} className="font-bold border border-accentBlue/25">★ {ratingToShow ? ratingToShow.toFixed(1) : '0.0'}</span>
        </div>

      </div>

      {/* Info Content */}
      <div className="p-4 flex-grow flex flex-col justify-between bg-darkCard/30 border-t border-gray-800/40">
        <div>
          <h3 className="font-bold text-base text-white line-clamp-1 group-hover:text-accentBlue transition-colors duration-300" title={cleanTitle}>
            {cleanTitle}
          </h3>
          
          {/* Genres Tags */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {genres && genres.slice(0, 3).map((g, i) => (
              <span 
                key={i} 
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-accentBlue/30 bg-accentBlue/10 text-accentBlue"
              >
                {g}
              </span>
            ))}
            {genres && genres.length > 3 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black border border-accentBlue/20 text-accentBlue/60">
                +{genres.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <StarRating rating={ratingToShow || 0} size={14} showNumber={false} />
            {num_ratings !== undefined && num_ratings > 0 && (
              <span className="text-[10px] text-gray-500">({num_ratings})</span>
            )}
          </div>
          
          <span className="text-[10px] text-accentBlue group-hover:underline flex items-center space-x-0.5 font-bold">
            <span>Details</span>
            <Eye className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
