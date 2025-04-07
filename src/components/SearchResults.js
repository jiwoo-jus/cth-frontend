// src/components/SearchResults.js
import React from 'react';
import PropTypes from 'prop-types';

const SearchResults = ({ results, onResultSelect }) => {
  if (!results) {
    return null;
  }

  const { pm, ctg } = results;

  return (
    <div className="mt-6">
      {/* PubMed Results */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">PubMed Results ({pm.total})</h3>
        {pm.results.length > 0 ? (
          <ul className="space-y-4">
            {pm.results.map((item) => (
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
              </li>
            ))}
          </ul>
        ) : (
          <p>No PubMed results found.</p>
        )}
      </div>

      {/* ClinicalTrials.gov Results */}
      <div>
        <h3 className="text-xl font-semibold mb-2">ClinicalTrials.gov Results ({ctg.total})</h3>
        {ctg.results.length > 0 ? (
          <ul className="space-y-4">
            {ctg.results.map((study) => (
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
                  NCTID: {study.id}
                </p>
                {study.conditions && study.conditions.length > 0 && (
                  <p className="text-sm">Conditions: {study.conditions.join(", ")}</p>
                )}
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
          pmcid: PropTypes.string
        })
      )
    }),
    ctg: PropTypes.shape({
      total: PropTypes.number,
      results: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string, // nctid 값
          title: PropTypes.string,
          status: PropTypes.string,
          conditions: PropTypes.arrayOf(PropTypes.string)
          // 필요시 추가 필드 정의 가능
        })
      )
    })
  }).isRequired,
  onResultSelect: PropTypes.func.isRequired
};

export default SearchResults;
