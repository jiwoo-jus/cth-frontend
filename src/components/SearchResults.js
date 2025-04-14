import { Eye, FileText } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const SearchResults = ({ results, onResultSelect, onViewDetails }) => {
  if (!results) {
    return <div className="text-center text-custom-text-subtle mt-4">No results to display.</div>;
  }

  const pmResults = results.pm || { total: 0, results: [] };
  const ctgResults = results.ctg || { total: 0, results: [] };

  return (
    <div className="mt-6 space-y-10 px-4 w-full max-w-7xl mx-auto">
      {/* PubMed Results */}
      <section>
        <h3 className="text-lg font-semibold border-b border-custom-border pb-1 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-custom-blue" />
          PubMed Results ({pmResults.total})
        </h3>
        {pmResults.results.length > 0 ? (
          <ul className="space-y-3">
            {pmResults.results.map((item) => (
              <li
                key={item.id}
                className="group p-4 bg-white border border-custom-border rounded-md shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
                onClick={() => onResultSelect(item)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-custom-blue-deep group-hover:underline text-base">
                    {item.title}
                  </h4>
                  <p className="text-sm text-custom-text-subtle mt-1 truncate">
                    {item.journal} &middot; {item.pubDate}
                  </p>
                  <p className="text-sm text-custom-text truncate">
                    Authors: {item.authors.join(", ")}
                  </p>
                  <p className="text-xs text-custom-text-subtle mt-1 truncate">
                    PMID: {item.pmid} {item.pmcid && `| PMCID: ${item.pmcid}`}
                  </p>
                </div>
                <div className="shrink-0 self-start md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(item);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-custom-blue text-white rounded hover:bg-custom-blue-hover transition-colors"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-custom-text-subtle">No PubMed results found.</p>
        )}
      </section>

      {/* ClinicalTrials.gov Results */}
      <section>
        <h3 className="text-lg font-semibold border-b border-custom-border pb-1 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-green-700" />
          ClinicalTrials.gov Results ({ctgResults.total})
        </h3>
        {ctgResults.results.length > 0 ? (
          <ul className="space-y-3">
            {ctgResults.results.map((study) => (
              <li
                key={study.id}
                className="group p-4 bg-white border border-custom-border rounded-md shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
                onClick={() => onResultSelect(study)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-custom-blue-deep group-hover:underline text-base">
                    {study.title}
                  </h4>
                  <p className="text-sm text-custom-text-subtle mt-1 truncate">Status: {study.status}</p>
                  <p className="text-xs text-custom-text-subtle truncate">NCT ID: {study.id}</p>
                  {study.conditions && study.conditions.length > 0 && (
                    <p className="text-sm text-custom-text truncate">
                      Conditions: {study.conditions.join(", ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 self-start md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(study);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-custom-blue text-white rounded hover:bg-custom-blue-hover transition-colors"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-custom-text-subtle">No ClinicalTrials.gov results found.</p>
        )}
      </section>
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