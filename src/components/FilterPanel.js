// FilterPanel.js
import { Filter } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

const SOURCE_OPTIONS = [
  { label: "PubMed", value: "PM" },
  { label: "ClinicalTrials.gov", value: "CTG" }
];
const FIELD_LABELS = {
  cond: 'Condition', intr: 'Intervention', other_term: 'Other Terms',
  journal: 'Journal', sponsor: 'Sponsor', location: 'Location', status: 'Status',
  sex: 'Sex', age: 'Age', studyType: 'Study Type',
  publicationType: 'Publication Type',  // 신규
  phase: 'Phase',                       // 신규
};
const FIELD_PLACEHOLDERS = {
  cond: 'e.g., Diabetes', intr: 'e.g., Insulin', other_term: 'e.g., Biomarkers',
  journal: 'e.g., NEJM', sponsor: 'e.g., Pfizer', location: 'e.g., Boston, MA',
  status: 'e.g., Recruiting',
  publicationType: 'e.g., Randomized Controlled Trial', // 신규
};
const SELECT_OPTIONS = {
  sex: [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ],
  age: [
    { value: "child", label: "Child (0‑17)" },
    { value: "adult", label: "Adult (18‑64)" },
    { value: "older", label: "Older (65+)" },
  ],
  studyType: [
    { value: "Interventional", label: "Interventional" },
    { value: "Observational", label: "Observational" },
  ],
  status: [
    { value: "RECRUITING", label: "Recruiting" },
    { value: "COMPLETED", label: "Completed" },
    { value: "TERMINATED", label: "Terminated" },
    // etc.
  ],
  phase: [  // 신규
    { value: "1", label: "Phase 1" },
    { value: "2", label: "Phase 2" },
    { value: "3", label: "Phase 3" },
    { value: "4", label: "Phase 4" },
  ]
};

const BASIC_FILTER_FIELDS    = ['cond','intr','other_term'];
const ADVANCED_FILTER_FIELDS = [
  'journal','sex','age','studyType',
  'sponsor','location','status',
  'publicationType','phase'  // 신규
];

const FilterPanel = ({ filters, setFilters }) => {
  const [showMore, setShowMore] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value || null }));
  }, [setFilters]);

  const handleSourceChange = useCallback((val) => {
    setFilters(prev => {
      const cur = prev.sources ?? SOURCE_OPTIONS.map(o=>o.value);
      const upd = cur.includes(val) ? cur.filter(v=>v!==val) : [...cur,val];
      return { ...prev, sources: upd };
    });
  }, [setFilters]);

  const getLabel = f => FIELD_LABELS[f] || f;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-2xl p-6 mb-6 border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter size={18} /> Search Filters
          </h2>
          <button onClick={()=>setShowMore(!showMore)} className="text-sm hover:underline">
            {showMore ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>
        {/* Basic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BASIC_FILTER_FIELDS.map(f => (
            <div key={f}>
              <label className="block text-sm font-medium">{getLabel(f)}</label>
              <input
                name={f} value={filters[f]||''} onChange={handleChange}
                placeholder={FIELD_PLACEHOLDERS[f]||''}
                className="mt-1 block w-full border rounded-2xl px-4 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        {/* Advanced */}
        {showMore && (
          <div className="mt-6 pt-4 border-t">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Sources</label>
              <div className="flex gap-4 flex-wrap">
                {SOURCE_OPTIONS.map(o => (
                  <label key={o.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.sources?.includes(o.value) ?? true}
                      onChange={()=>handleSourceChange(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ADVANCED_FILTER_FIELDS.map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium">{getLabel(f)}</label>
                  {SELECT_OPTIONS[f] ? (
                    <select
                      name={f} value={filters[f]||''} onChange={handleChange}
                      className="mt-1 block w-full border rounded-2xl px-4 py-2 text-sm bg-white"
                    >
                      <option value="">Any</option>
                      {SELECT_OPTIONS[f].map(o=>(
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={f} value={filters[f]||''} onChange={handleChange}
                      placeholder={FIELD_PLACEHOLDERS[f]||''}
                      className="mt-1 block w-full border rounded-2xl px-4 py-2 text-sm"
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

export default React.memo(FilterPanel);
