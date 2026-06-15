import React from 'react';
import { Film, User, Compass, BarChart2 } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, selectedUserId }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Film },
    { id: 'user-select', label: 'User Selection', icon: User },
    { 
      id: 'recommendations', 
      label: 'Recommendations', 
      icon: Compass, 
      disabled: !selectedUserId,
      tooltip: !selectedUserId ? 'Select a user ID first' : null
    },
    { id: 'evaluation', label: 'Evaluation', icon: BarChart2 }
  ];

  return (
    <nav className="bg-black/95 backdrop-blur-xl border-b border-accentBlue/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer space-x-2" 
            onClick={() => setActivePage('home')}
          >
            <div className="bg-accentBlue p-2 rounded-lg text-black font-bold flex items-center justify-center shadow-md shadow-accentBlue/10">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-gray-200 to-accentBlue bg-clip-text text-transparent">
              CineMatch
            </span>
            <span className="hidden sm:inline text-[10px] bg-accentBlue/10 text-accentBlue px-2 py-0.5 rounded font-bold border border-accentBlue/20 uppercase">
              AI
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1 sm:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    title={item.tooltip}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-700 cursor-not-allowed select-none"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-accentBlue/15 text-accentBlue border border-accentBlue/35 shadow-md shadow-accentBlue/5'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Active User Indicator */}
          <div className="hidden lg:flex items-center">
            {selectedUserId ? (
              <div className="flex items-center space-x-2 bg-accentBlue/10 px-3 py-1.5 rounded-full border border-accentBlue/30">
                <div className="w-2 h-2 rounded-full bg-accentBlue animate-pulse"></div>
                <span className="text-xs text-accentBlue font-medium">User ID: <span className="font-bold">{selectedUserId}</span></span>
              </div>
            ) : (
              <button
                onClick={() => setActivePage('user-select')}
                className="text-xs text-gray-500 hover:text-white bg-gray-950 border border-gray-900 hover:border-gray-800 px-3 py-1.5 rounded-full transition-all"
              >
                No User Selected
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
