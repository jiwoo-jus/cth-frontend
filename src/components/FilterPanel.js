import PropTypes from 'prop-types';
// src/components/FilterPanel.js
import React from 'react';

const sourceOptions = [
  { label: "PubMed", value: "PM" },
  // { label: "PumbMed Central", value: "PMC" },
  { label: "ClinicalTrials.gov", value: "CTG" }
];

const FilterPanel = ({ filters, setFilters }) => {
  const [showMore, setShowMore] = React.useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    // 값이 빈 문자열이면 null로 변환하여 저장
    setFilters({
      ...filters,
      [name]: value === '' ? null : value,
    });
  };

  const handleSourceChange = (value) => {
    let current = filters.sources || sourceOptions.map(opt => opt.value); // 기본: 모두 선택
    if (current.includes(value)) {
      current = current.filter(v => v !== value);
    } else {
      current.push(value);
    }
    setFilters({ ...filters, sources: current });
  };

  return (
    <div className="bg-white shadow-md rounded-md p-4 mb-4">
      <h2 className="text-lg font-semibold mb-2">Search Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Condition</label>
          <input
            type="text"
            name="cond"
            value={filters.cond || ''}
            onChange={handleChange}
            placeholder="e.g., Diabetes"
            className="mt-1 block w-full border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Intervention</label>
          <input
            type="text"
            name="intr"
            value={filters.intr || ''}
            onChange={handleChange}
            placeholder="e.g., Insulin"
            className="mt-1 block w-full border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Other Term</label>
          <input
            type="text"
            name="other_term"
            value={filters.other_term || ''}
            onChange={handleChange}
            placeholder="Additional keywords"
            className="mt-1 block w-full border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium">Search Sources</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {sourceOptions.map(option => (
            <label key={option.value} className="flex items-center space-x-1">
              <input
                type="checkbox"
                name="sources"
                value={option.value}
                checked={filters.sources ? filters.sources.includes(option.value) : true}
                onChange={() => handleSourceChange(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={() => setShowMore(!showMore)}
        className="mt-3 text-blue-500 hover:underline text-sm"
      >
        {showMore ? "Hide Advanced Filters" : "Show Advanced Filters"}
      </button>
      {showMore && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Journal</label>
            <input
              type="text"
              name="journal"
              value={filters.journal || ''}
              onChange={handleChange}
              placeholder="e.g., BMJ Open"
              className="mt-1 block w-full border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Sex</label>
            <select
              name="sex"
              value={filters.sex || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md"
            >
              <option value="">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Age Group</label>
            <select
              name="age"
              value={filters.age || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md"
            >
              <option value="">Any</option>
              <option value="child">Child</option>
              <option value="adult">Adult</option>
              <option value="older">Older</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Study Type</label>
            <select
              name="studyType"
              value={filters.studyType || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md"
            >
              <option value="">Any</option>
              <option value="int obs">Interventional/Observational</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Sponsor</label>
            <input
              type="text"
              name="sponsor"
              value={filters.sponsor || ''}
              onChange={handleChange}
              placeholder="e.g., National Institute of Health"
              className="mt-1 block w-full border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={filters.location || ''}
              onChange={handleChange}
              placeholder="e.g., Columbus, Ohio"
              className="mt-1 block w-full border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <input
              type="text"
              name="status"
              value={filters.status || ''}
              onChange={handleChange}
              placeholder="e.g., COMPLETED, TERMINATED"
              className="mt-1 block w-full border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
};

FilterPanel.propTypes = {
  filters: PropTypes.shape({
    cond: PropTypes.string,
    intr: PropTypes.string,
    other_term: PropTypes.string,
    journal: PropTypes.string,
    sex: PropTypes.string,
    age: PropTypes.string,
    studyType: PropTypes.string,
    sponsor: PropTypes.string,
    location: PropTypes.string,
    status: PropTypes.string,
    sources: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  setFilters: PropTypes.func.isRequired
};

export default FilterPanel;
