import { Filter } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useCallback } from 'react'; // Import useCallback

// --- Constants ---
const SOURCE_OPTIONS = [
  { label: "PubMed", value: "PM" },
  { label: "ClinicalTrials.gov", value: "CTG" }
];

// Display labels for specific filter fields
const FIELD_LABELS = {
  cond: 'Condition',
  intr: 'Intervention',
  other_term: 'Other Terms',
  studyType: 'Study Type', // Corrected capitalization
  // Add more labels as needed
};

// Placeholder text for input fields
const FIELD_PLACEHOLDERS = {
  cond: 'e.g., Diabetes',
  intr: 'e.g., Insulin',
  other_term: 'e.g., Biomarkers, Quality of Life',
  journal: 'e.g., NEJM, Lancet',
  sponsor: 'e.g., NIH, Pfizer',
  location: 'e.g., Boston, MA',
  status: 'e.g., Recruiting, Completed'
};

// Options for select dropdowns
const SELECT_OPTIONS = {
  sex: [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ],
  age: [
    { value: "child", label: "Child (0-17 years)" },
    { value: "adult", label: "Adult (18-64 years)" },
    { value: "older", label: "Older Adult (65+ years)" },
  ],
  studyType: [ // Example options, adjust as needed based on API capabilities
    { value: "Interventional", label: "Interventional" },
    { value: "Observational", label: "Observational" },
    // { value: "int obs", label: "Interventional/Observational" }, // Keep or remove based on API
  ],
  status: [ // Example CTG statuses
     { value: "RECRUITING", label: "Recruiting" },
     { value: "NOT_YET_RECRUITING", label: "Not Yet Recruiting" },
     { value: "ACTIVE_NOT_RECRUITING", label: "Active, Not Recruiting" },
     { value: "COMPLETED", label: "Completed" },
     { value: "TERMINATED", label: "Terminated" },
     { value: "WITHDRAWN", label: "Withdrawn" },
  ]
};

// Fields to display in the "basic" section
const BASIC_FILTER_FIELDS = ['cond', 'intr', 'other_term'];

// Fields to display in the "advanced" section (excluding basic ones and sources)
const ADVANCED_FILTER_FIELDS = [
  'journal', 'sex', 'age', 'studyType', 'sponsor', 'location', 'status'
];

// --- Filter Input Component ---
// Optional: Could create a reusable FilterInput component if complexity grows further
// const FilterInput = ({ name, label, value, onChange, placeholder, type = 'text', options = [] }) => { ... }

// --- Main FilterPanel Component ---
const FilterPanel = ({ filters, setFilters }) => {
  const [showMore, setShowMore] = useState(false);

  // Memoized change handler for text inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log(`[FilterPanel] Input change - Name: ${name}, Value: '${value}'`);
    setFilters(prevFilters => ({
      ...prevFilters,
      // Store empty string as null to be consistent
      [name]: value === '' ? null : value,
    }));
  }, [setFilters]);

  // Memoized change handler for source checkboxes
  const handleSourceChange = useCallback((value) => {
    console.log(`[FilterPanel] Source change - Toggled: ${value}`);
    setFilters(prevFilters => {
      // Ensure sources is always an array, default to all options if null/undefined
      const currentSources = prevFilters.sources || SOURCE_OPTIONS.map(opt => opt.value);
      const newSources = currentSources.includes(value)
        ? currentSources.filter(v => v !== value)
        : [...currentSources, value];
      // Prevent removing the last source? Optional: Add validation if needed.
      // if (newSources.length === 0) return prevFilters; // Example: Keep at least one source
      return { ...prevFilters, sources: newSources };
    });
  }, [setFilters]);

  // Get display label for a field name
  const getLabel = (fieldName) => FIELD_LABELS[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format fallback label

  return (
    <div className="w-full max-w-7xl mx-auto px-4"> {/* Outer wrapper */}
      <div className="w-full bg-white light:border-primary-12 light:bg-secondary-100 rounded-2xl light:shadow-splash-chatpgpt-input p-6 mb-6 border"> {/* Inner container */}
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={18} className="text-primary-100" />
            Search Filters
          </h2>
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-sm text-primary-100 hover:underline"
            aria-expanded={showMore}
          >
            {showMore ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BASIC_FILTER_FIELDS.map((field) => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-primary-100">
                {getLabel(field)}
              </label>
              <input
                type="text"
                id={field}
                name={field}
                value={filters[field] || ''} // Ensure controlled component
                onChange={handleChange}
                placeholder={FIELD_PLACEHOLDERS[field] || ''}
                className="mt-1 block w-full border light:border-primary-12 rounded-2xl px-4 py-2 text-sm light:shadow-splash-chatpgpt-input"
              />
            </div>
          ))}
        </div>

        {/* Advanced Filters (Conditional) */}
        {showMore && (
          <div className="mt-6 pt-4 border-t border-custom-border">
            {/* Search Sources */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-primary-100 mb-2">Search Sources</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {SOURCE_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-primary-100 focus:ring-primary-100" // Style checkbox
                      checked={filters.sources?.includes(option.value) ?? true} // Default to checked if undefined
                      onChange={() => handleSourceChange(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Other Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ADVANCED_FILTER_FIELDS.map((field) => (
                <div key={field}>
                  <label htmlFor={field} className="block text-sm font-medium text-primary-100">
                    {getLabel(field)}
                  </label>
                  {SELECT_OPTIONS[field] ? ( // Check if it should be a select dropdown
                    <select
                      id={field}
                      name={field}
                      value={filters[field] || ''} // Ensure controlled component
                      onChange={handleChange}
                      className="mt-1 block w-full border light:border-primary-12 rounded-2xl px-4 py-2 text-sm light:shadow-splash-chatpgpt-input bg-white" // Added bg-white for consistency
                    >
                      <option value="">Any</option>
                      {SELECT_OPTIONS[field].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : ( // Otherwise, render a text input
                    <input
                      type="text"
                      id={field}
                      name={field}
                      value={filters[field] || ''} // Ensure controlled component
                      onChange={handleChange}
                      placeholder={FIELD_PLACEHOLDERS[field] || ''}
                      className="mt-1 block w-full border light:border-primary-12 rounded-2xl px-4 py-2 text-sm light:shadow-splash-chatpgpt-input"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

FilterPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
};

// Wrap export in React.memo for performance optimization
export default React.memo(FilterPanel); // Use default export
