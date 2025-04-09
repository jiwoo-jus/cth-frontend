import PropTypes from 'prop-types';
// src/components/SearchResults.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchResults = ({ results, onResultSelect }) => {
  const navigate = useNavigate();

  // results가 null이면 로딩 또는 빈 화면 표시
  if (!results) {
    return <div>No results to display.</div>;
  }

  // PubMed와 CTG 결과가 있는지 확인
  const pmResults = results.pm || { total: 0, results: [] };
  const ctgResults = results.ctg || { total: 0, results: [] };

  const handleItemClick = (item) => {
    onResultSelect(item);
    // PM/PMC 인 경우 paperId, pmcid, 소스 정보 전달; CTG 인 경우 nctId와 소스 전달
    if (item.source === "CTG") {
      navigate(`/detail?nctId=${item.id}&source=CTG`);
    } else {
      navigate(`/detail?paperId=${item.id}&pmcid=${item.pmid}&source=${item.source}`);
    }
  };

  return (
    <div className="mt-6">
      {/* PubMed 결과 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">PubMed Results ({pmResults.total})</h3>
        {pmResults.results.length > 0 ? (
          <ul className="space-y-4">
            {pmResults.results.map((item) => (
              <li 
                key={item.id} 
                className="p-4 bg-white shadow rounded-md cursor-pointer" 
                onClick={() => handleItemClick(item)}
              >
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.journal} &middot; {item.pubDate}</p>
                <p className="text-sm">Authors: {item.authors.join(", ")}</p>
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
      {/* CTG 결과 */}
      <div>
        <h3 className="text-xl font-semibold mb-2">ClinicalTrials.gov Results ({ctgResults.total})</h3>
        {ctgResults.results.length > 0 ? (
          <ul className="space-y-4">
            {ctgResults.results.map((study) => (
              <li 
                key={study.id} 
                className="p-4 bg-white shadow rounded-md cursor-pointer" 
                onClick={() => handleItemClick(study)}
              >
                <h4 className="font-bold">{study.title}</h4>
                <p className="text-sm text-gray-600">Status: {study.status}</p>
                <p className="text-sm text-gray-500">NCT ID: {study.id}</p>
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
          id: PropTypes.string,
          title: PropTypes.string,
          status: PropTypes.string,
          conditions: PropTypes.arrayOf(PropTypes.string)
        })
      ),
      nextPageToken: PropTypes.string
    })
  }),
  onResultSelect: PropTypes.func.isRequired
};

export default SearchResults;
