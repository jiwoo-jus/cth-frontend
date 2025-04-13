import { Search } from 'lucide-react';
// src/components/SearchBar.js
import PropTypes from 'prop-types';
import React from 'react';

export const SearchBar = ({ query, setQuery, onSubmit }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex items-center gap-2 px-4 mb-6">
      <input
        type="text"
        placeholder="Search clinical terms, conditions, or interventions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
      />
      <button
        onClick={onSubmit}
        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition"
      >
        <Search size={16} />
        Search
      </button>
    </div>
  );
};

SearchBar.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};