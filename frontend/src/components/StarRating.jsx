import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating, maxStars = 5, size = 16, showNumber = true }) {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  
  for (let i = 1; i <= maxStars; i++) {
    if (roundedRating >= i) {
      // Full Star (Blue)
      stars.push(
        <Star 
          key={i} 
          size={size} 
          className="text-accentBlue fill-accentBlue filter drop-shadow-[0_0_1px_rgba(59,130,246,0.5)]" 
        />
      );
    } else if (roundedRating === i - 0.5) {
      // Half Star (Blue left, Dark gray right)
      stars.push(
        <div key={i} className="relative inline-block">
          <Star size={size} className="text-gray-800" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star size={size} className="text-accentBlue fill-accentBlue" />
          </div>
        </div>
      );
    } else {
      // Empty Star (Dark gray)
      stars.push(
        <Star key={i} size={size} className="text-gray-800" />
      );
    }
  }

  return (
    <div className="flex items-center space-x-1.5 select-none">
      <div className="flex items-center space-x-0.5">{stars}</div>
      {showNumber && rating > 0 && (
        <span className="text-xs font-bold text-accentBlue ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
