import React from 'react';
import { Share2, Compass, Layers, CheckCircle } from 'lucide-react';

export default function AlgorithmBadge({ algorithm }) {
  let Icon = Compass;
  let label = "Collaborative Filtering";

  if (algorithm.toLowerCase().includes("content")) {
    Icon = Share2;
    label = "Content-Based";
  } else if (algorithm.toLowerCase().includes("hybrid")) {
    Icon = Layers;
    label = "Hybrid AI";
  } else if (algorithm.toLowerCase().includes("item-based")) {
    Icon = Compass;
    label = "Item-Based CF";
  } else if (algorithm.toLowerCase().includes("user-based")) {
    Icon = Compass;
    label = "User-Based CF";
  } else if (algorithm.toLowerCase().includes("history") || algorithm.toLowerCase().includes("watched")) {
    Icon = CheckCircle;
    label = "Watch History";
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-accentBlue/30 bg-accentBlue/10 text-accentBlue shadow-sm transition-all duration-300">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
}
