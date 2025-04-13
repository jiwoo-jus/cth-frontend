// src/components/SearchResults.js
import PropTypes from 'prop-types';
import React from 'react';

const SearchResults = ({ results, onResultSelect, onViewDetails }) => {
  if (!results) {
    return <div>No results to display.</div>;
  }

  const pmResults = results.pm || { total: 0, results: [] };
  const ctgResults = results.ctg || { total: 0, results: [] };

  return (
    <div className="mt-6">
      {/* PubMed Results */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">
          PubMed Results ({pmResults.total})
        </h3>
        {pmResults.results.length > 0 ? (
          <ul className="space-y-4">
            {pmResults.results.map((item) => (
              <li
                key={item.id}
                className="p-4 bg-white shadow rounded-md cursor-pointer"
                onClick={() => onResultSelect(item)}
              >
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-gray-600">
                  {item.journal} &middot; {item.pubDate}
                </p>
                <p className="text-sm">
                  Authors: {item.authors.join(", ")}
                </p>
                <p className="text-sm text-gray-500">
                  PMID: {item.pmid} {item.pmcid && `| PMCID: ${item.pmcid}`}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(item);
                  }}
                  className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No PubMed results found.</p>
        )}
      </div>
      {/* CTG Results */}
      <div>
        <h3 className="text-xl font-semibold mb-2">
          ClinicalTrials.gov Results ({ctgResults.total})
        </h3>
        {ctgResults.results.length > 0 ? (
          <ul className="space-y-4">
            {ctgResults.results.map((study) => (
              <li
                key={study.id}
                className="p-4 bg-white shadow rounded-md cursor-pointer"
                onClick={() => onResultSelect(study)}
              >
                <h4 className="font-bold">{study.title}</h4>
                <p className="text-sm text-gray-600">
                  Status: {study.status}
                </p>
                <p className="text-sm text-gray-500">
                  NCT ID: {study.id}
                </p>
                {study.conditions && study.conditions.length > 0 && (
                  <p className="text-sm">
                    Conditions: {study.conditions.join(", ")}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(study);
                  }}
                  className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No ClinicalTrials.gov results found.</p>
        )}
      </div>
    </div>
  );
};

SearchResults.propTypes = {
  results: PropTypes.shape({
    pm: PropTypes.shape({
      total: PropTypes.number,
      results: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string,
          journal: PropTypes.string,
          pubDate: PropTypes.string,
          authors: PropTypes.arrayOf(PropTypes.string),
          pmid: PropTypes.string,
          pmcid: PropTypes.string,
        })
      ),
    }),
    ctg: PropTypes.shape({
      total: PropTypes.number,
      results: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string,
          status: PropTypes.string,
          conditions: PropTypes.arrayOf(PropTypes.string),
        })
      ),
      nextPageToken: PropTypes.string,
    }),
  }),
  onResultSelect: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default SearchResults;
