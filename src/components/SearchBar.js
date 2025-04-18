import React, { useState, useEffect, useRef, useCallback } from 'react'; // Import useCallback
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';

// Placeholder texts for the search bar
const PLACEHOLDER_TEXTS = [
  "Low-sodium diet for the management of hypertension",
  "Randomized controlled trial of insulin treatment for type 2 diabetes",
  "Treatment strategies for Alzheimer's disease in geriatric populations",
  "Effect of methylphenidate on attention in children with ADHD",
];

const SearchBar = ({ query, setQuery, onSubmit }) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const textareaRef = useRef(null);

  // Cycle through placeholders every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % PLACEHOLDER_TEXTS.length);
    }, 3000);
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Adjust textarea height based on content
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, []);

  // Handle input changes: update query state and adjust height
  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
    // No need to call adjustTextareaHeight here if useEffect below handles it
  }, [setQuery]);

  // Adjust height whenever the query value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [query, adjustTextareaHeight]);

  // Handle key down: Submit on Enter (without Shift), allow Shift+Enter for newline
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline behavior
      console.log('[SearchBar] Enter pressed, submitting query.');
      onSubmit(); // Trigger the search submission
    }
  }, [onSubmit]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault(); // Prevent default form submission
    console.log('[SearchBar] Form submitted.');
    onSubmit(); // Trigger the search submission
  }, [onSubmit]);

  return (
    <div className="relative z-40 mx-auto w-full max-w-[768px]"> {/* Max width container */}
      <form onSubmit={handleSubmit} className="relative">
        <label
          htmlFor="search-textarea" // Added htmlFor for accessibility
          className="
            relative flex w-full cursor-text flex-col overflow-hidden
            rounded-2xl px-4 py-3
            light:border-primary-12 dark:bg-primary-4 light:bg-secondary-100
            light:shadow-splash-chatpgpt-input border
          "
        >
          {/* Screen reader only label */}
          <span id="search-label" className="sr-only">Search Query Input</span>

          {/* Animated Placeholder: Only shown when query is empty */}
          {!query && (
            <div
              aria-hidden="true" // Hide decorative placeholder from assistive tech
              className="absolute left-4 top-3 text-custom-text-subtle pointer-events-none transition-opacity duration-300"
            >
              {PLACEHOLDER_TEXTS[currentPlaceholderIndex]}
            </div>
          )}

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            id="search-textarea" // Added id
            rows="1" // Start with one row
            placeholder=" " // Use space placeholder to allow label animation/positioning
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-labelledby="search-label" // Link label for accessibility
            className="
              relative w-full pr-12 bg-transparent text-base leading-relaxed
              resize-none overflow-y-hidden focus:outline-none /* Hide scrollbar */
              text-black /* Ensure text color is visible */
            "
            style={{ maxHeight: '150px' }} // Optional: Limit max height
          />

          {/* Submit Button */}
          <div className="absolute bottom-3 right-3 flex justify-end">
            <button
              type="submit"
              aria-label="Submit search query"
              disabled={!query.trim()} // Disable if query is empty or only whitespace
              className="
                bg-primary-100 text-secondary-100 disabled:bg-gray-300 disabled:text-gray-500 /* Adjusted disabled style */
                relative flex items-center justify-center /* Center icon */
                h-9 w-9 rounded-full p-0 transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Search size={18} /> {/* Slightly larger icon */}
            </button>
          </div>
        </label>
      </form>
    </div>
  );
};

SearchBar.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

// Wrap export in React.memo for performance optimization
export default React.memo(SearchBar); // Use default export
