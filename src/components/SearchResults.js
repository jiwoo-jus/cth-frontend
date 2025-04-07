import React from 'react';

const SearchResults = ({ results }) => {
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
              <li key={item.id} className="p-4 bg-white shadow rounded-md">
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-gray-600">
                  {item.journal} &middot; {item.pubDate}
                </p>
                <p className="text-sm">Authors: {item.authors.join(", ")}</p>
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
              <li key={study.id} className="p-4 bg-white shadow rounded-md">
                <h4 className="font-bold">{study.title}</h4>
                <p className="text-sm text-gray-600">
                  Status: {study.status}
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

export default SearchResults;
