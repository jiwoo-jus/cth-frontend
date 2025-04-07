import React, { useState } from 'react';

const FilterPanel = ({ filters, setFilters }) => {
  const [showMore, setShowMore] = useState(false);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
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
            value={filters.cond}
            onChange={handleChange}
            placeholder="e.g., Diabetes"
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Intervention</label>
          <input
            type="text"
            name="intr"
            value={filters.intr}
            onChange={handleChange}
            placeholder="e.g., Insulin"
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Other Term</label>
          <input
            type="text"
            name="other_term"
            value={filters.other_term}
            onChange={handleChange}
            placeholder="Additional keywords"
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
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
          {/* PubMed 고급 필터 */}
          <div>
            <label className="block text-sm font-medium">Journal</label>
            <input
              type="text"
              name="journal"
              value={filters.journal || ""}
              onChange={handleChange}
              placeholder="e.g., BMJ Open"
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Sex</label>
            <select
              name="sex"
              value={filters.sex || ""}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md"
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
              className="mt-1 block w-full border-gray-300 rounded-md"
            >
              <option value="">Any</option>
              <option value="child">Child</option>
              <option value="adult">Adult</option>
              <option value="older">Older</option>
            </select>
          </div>
          {/* ClinicalTrials.gov 고급 필터 */}
          <div>
            <label className="block text-sm font-medium">Study Type</label>
            <select
              name="studyType"
              value={filters.studyType || ""}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md"
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
              value={filters.sponsor || ""}
              onChange={handleChange}
              placeholder="e.g., National Institute of Health"
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={filters.location || ""}
              onChange={handleChange}
              placeholder="e.g., Columbus, Ohio"
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <input
              type="text"
              name="status"
              value={filters.status || ""}
              onChange={handleChange}
              placeholder="e.g., COMPLETED, TERMINATED"
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          {/* 날짜 필터는 추후 datepicker 라이브러리 적용 고려 */}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
