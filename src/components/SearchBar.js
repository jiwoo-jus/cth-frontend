import PropTypes from 'prop-types';
// src/components/SearchBar.js
import React from 'react';

const SearchBar = ({ query, setQuery, onSubmit }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <input
        type="text"
        placeholder="Enter your query..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={onSubmit}
        className="px-6 py-2 bg-[#003366] text-white font-semibold rounded-r-md hover:bg-[#003366] transition-colors"
      >
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

export default SearchBar;
