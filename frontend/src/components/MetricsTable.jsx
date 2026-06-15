import React from 'react';
import { Compass, Share2 } from 'lucide-react';

export default function MetricsTable({ metrics }) {
  if (!metrics || metrics.length === 0) return null;

  const getAlgoIcon = (algoName) => {
    if (algoName.toLowerCase().includes('content')) {
      return <Share2 className="w-4 h-4 text-accentBlue" />;
    }
    return <Compass className="w-4 h-4 text-accentBlue" />;
  };

  const getAlgoColorClass = (algoName) => {
    return 'text-accentBlue font-bold';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-darkCard/30 backdrop-blur-md shadow-2xl">
      <table className="min-w-full divide-y divide-gray-800 text-left">
        <thead className="bg-black">
          <tr>
            <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Algorithm
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
              Precision@10
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
              Recall@10
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
              F1-Score
            </th>
            <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
              RMSE (Lower is Better)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60 bg-transparent">
          {metrics.map((row, index) => (
            <tr 
              key={index} 
              className="hover:bg-gray-950/40 transition-colors duration-200"
            >
              <td className="whitespace-nowrap px-6 py-4.5 flex items-center space-x-3 text-sm font-medium text-white">
                <span className="p-1.5 rounded-lg bg-black border border-gray-800">
                  {getAlgoIcon(row.algorithm)}
                </span>
                <span className={getAlgoColorClass(row.algorithm)}>
                  {row.algorithm}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4.5 text-sm font-semibold text-center text-gray-200">
                <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-black border border-gray-850">
                  {row.precision.toFixed(1)}%
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4.5 text-sm font-semibold text-center text-gray-200">
                <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-black border border-gray-850">
                  {row.recall.toFixed(1)}%
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4.5 text-sm font-semibold text-center text-gray-200">
                <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-black border border-accentBlue/20 text-accentBlue font-bold">
                  {row.f1_score.toFixed(1)}%
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4.5 text-sm font-bold text-center text-white">
                <span className="text-secondaryRed font-black">
                  {row.rmse.toFixed(3)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
