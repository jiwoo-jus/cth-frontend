import { Filter } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const sourceOptions = [
  { label: "PubMed", value: "PM" },
  { label: "ClinicalTrials.gov", value: "CTG" }
];

// Add a mapping for field names to display labels
const fieldLabels = {
  cond: 'Condition',
  intr: 'Intervention',
  other_term: 'Other Terms'
};

export const FilterPanel = ({ filters, setFilters }) => {
  const [showMore, setShowMore] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value === '' ? null : value,
    });
  };

  const handleSourceChange = (value) => {
    let current = filters.sources || sourceOptions.map(opt => opt.value);
    current = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, sources: current });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4"> {/* Outer wrapper with max-width, centering, and px-4 */}
      <div className="w-full bg-white light:border-primary-12 light:bg-secondary-100 rounded-2xl light:shadow-splash-chatpgpt-input p-6 mb-6 border"> {/* Original div, now takes full width within the padded parent */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={18} className="text-primary-100" />
            Search Filters
          </h2>
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-sm text-primary-100 hover:underline"
          >
            {showMore ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['cond', 'intr', 'other_term'].map((field, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium text-primary-100 capitalize">
                {/* Use the mapping here */}
                {fieldLabels[field] || field.replace('_', ' ')}
              </label>
              <input
                type="text"
                name={field}
                value={filters[field] || ''}
                onChange={handleChange}
                placeholder={`e.g., ${field === 'cond' ? 'Diabetes' : field === 'intr' ? 'Insulin' : 'Keywords'}`}
                className="mt-1 block w-full border light:border-primary-12 rounded-2xl px-4 py-2 text-sm light:shadow-splash-chatpgpt-input"
              />
            </div>
          ))}
        </div>

        {showMore && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-primary-100 mb-1">Search Sources</label>
              <div className="flex flex-wrap gap-4">
                {sourceOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.sources?.includes(option.value)}
                      onChange={() => handleSourceChange(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            {[
              ['journal', 'e.g., BMJ Open'],
              ['sex', ''],
              ['age', ''],
              ['studyType', ''],
              ['sponsor', 'e.g., NIH'],
              ['location', 'e.g., Columbus, OH'],
              ['status', 'e.g., Completed']
            ].map(([name, placeholder], idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-primary-100 capitalize">
                  {name.replace(/([A-Z])/g, ' $1')}
                </label>
                {['sex', 'age', 'studyType'].includes(name) ? (
                  <select
                    name={name}
                    value={filters[name] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border light:border-primary-12 rounded-2xl px-4 py-2 text-sm light:shadow-splash-chatpgpt-input"
                  >
                    <option value="">Any</option>
                    {name === 'sex' && (
                      <>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </>
                    )}
                    {name === 'age' && (
                      <>
                        <option value="child">Child</option>
                        <option value="adult">Adult</option>
                        <option value="older">Older</option>
                      </>
                    )}
                    {name === 'studyType' && (
                      <option value="int obs">Interventional/Observational</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    name={name}
                    value={filters[name] || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="mt-1 block w-full border light:border-primary-12 rounded-2xl px-4 py-2 text-sm light:shadow-splash-chatpgpt-input"
                  />
                )}
              </div>
            ))}
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
