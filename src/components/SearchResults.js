import { Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const SearchResults = ({ results, onResultSelect, onViewDetails }) => {
  if (!results) {
    return (
      <div className="text-center text-custom-text-subtle mt-4">
        No results to display.
      </div>
    );
  }

  const pmResults = results.pm || { total: 0, results: [] };
  const ctgResults = results.ctg || { total: 0, results: [] };

  return (
    <div className="mt-6 space-y-10 px-4 w-full max-w-7xl mx-auto">
      {/* PubMed Results */}
      <section>
        <h3 className="text-lg font-semibold border-b border-custom-border pb-1 mb-4 flex items-center gap-2">
          PubMed Results {pmResults.total > 0 && `(${pmResults.total})`}
        </h3>
        {pmResults.results.length > 0 ? (
          <ul className="space-y-3">
            {pmResults.results.map((item) => (
              <li
                key={item.id}
                onClick={() => onResultSelect(item)}
                className="group p-4 bg-white border border-custom-border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-custom-blue-deep group-hover:underline text-base">
                    {item.title}
                  </h4>
                  <p className="text-sm text-custom-text-subtle mt-1 truncate">
                    {item.authors.join(", ")}
                  </p>
                  <p className="text-sm text-custom-text truncate">
                  {item.journal} <span className="mx-1">|</span> {item.pubDate}
                  </p>
                  <p className="text-xs text-custom-text-subtle mt-1 truncate">
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      // Use custom-blue for PubMed links
                      className="text-custom-blue hover:underline"
                      onClick={(e) => e.stopPropagation()} // Prevent triggering onResultSelect
                    >
                      {item.pmid}
                    </a>
                    {item.pmcid && (
                      <>
                        <span className="mx-1">|</span>
                        <a
                          href={`https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          // Use custom-blue for PubMed links
                          className="text-custom-blue hover:underline"
                          onClick={(e) => e.stopPropagation()} // Prevent triggering onResultSelect
                        >
                          {item.pmcid}
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 self-start md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(item);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-100 text-secondary-100 rounded-full hover:bg-primary-100 transition-colors"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-custom-text-subtle">
            No PubMed results found.
          </p>
        )}
      </section>

      {/* ClinicalTrials.gov Results */}
      <section>
        <h3 className="text-lg font-semibold border-b border-custom-border pb-1 mb-4 flex items-center gap-2">
          ClinicalTrials.gov Results {ctgResults.total > 0 && `(${ctgResults.total})`}
        </h3>
        {ctgResults.results.length > 0 ? (
          <ul className="space-y-3">
            {ctgResults.results.map((study) => {
              // Safely access nested properties
              const organization = study.structured_info?.protocolSection?.identificationModule?.organization?.fullName;
              const startDate = study.structured_info?.protocolSection?.statusModule?.startDateStruct?.date;
              // Check completion date type before assigning
              const completionDateInfo = study.structured_info?.protocolSection?.statusModule?.completionDateStruct;
              const completionDate = completionDateInfo?.type === 'ACTUAL' ? completionDateInfo?.date : null;

              // Build the details row items conditionally in the desired order
              const detailsRowItems = [];

              // 1. Type
              if (study.studyType) {
                detailsRowItems.push(study.studyType);
              }

              // 2. References
              if (study.references) {
                if (study.references.length > 0) {
                  detailsRowItems.push(
                    <strong key="ref">{study.references.length} references</strong>
                  );
                } else {
                  detailsRowItems.push('0 references');
                }
              }

              // 3. Status
              if (study.status) {
                detailsRowItems.push(study.status);
              }

              // 4. Results
              if (study.hasResults !== undefined) {
                if (study.hasResults) {
                  detailsRowItems.push(<strong key="res">has results</strong>);
                } else {
                  detailsRowItems.push('no results');
                }
              }


              return (
                <li
                  key={study.id}
                  onClick={() => onResultSelect(study)}
                  className="group p-4 bg-white border border-custom-border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    {/* 1행: 타이틀 */}
                    <h4 className="font-semibold text-custom-green-deep group-hover:underline text-base">
                      {study.title}
                    </h4>
                    {/* 2행: organization, study start, study completion */}
                    {(organization || startDate || completionDate) && (
                       <p className="text-sm text-custom-text mt-1 truncate">
                         {organization}
                         {/* Add separator if organization exists AND (startDate OR completionDate exists) */}
                         {organization && (startDate || completionDate) && <span className="mx-1">|</span>}
                         {startDate && `Start: ${startDate}`}
                         {/* Add separator if startDate exists AND completionDate exists */}
                         {startDate && completionDate && <span className="mx-1">|</span>}
                         {/* Display completionDate only if it exists (i.e., type was 'ACTUAL') */}
                         {completionDate && `Completion: ${completionDate}`}
                       </p>
                    )}
                    {/* 3행: Type | References | Status | Results */}
                    {detailsRowItems.length > 0 && (
                      <p className="text-sm text-custom-text truncate mt-1">
                        {detailsRowItems.map((item, index) => (
                          <React.Fragment key={index}>
                            {item}
                            {index < detailsRowItems.length - 1 && <span className="mx-1">|</span>}
                          </React.Fragment>
                        ))}
                      </p>
                    )}
                    {/* 4행: nctid */}
                    <p className="text-xs text-custom-text-subtle truncate mt-1">
                      <a
                        href={`https://clinicaltrials.gov/study/${study.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-custom-green hover:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent triggering onResultSelect
                      >
                        {study.id}
                      </a>
                    </p>
                  </div>
                  <div className="shrink-0 self-start md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(study);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-100 text-secondary-100 rounded-full hover:bg-primary-100 transition-colors"
                    >
                      <Eye size={14} /> View
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-custom-text-subtle">
            No ClinicalTrials.gov results found.
          </p>
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
          studyType: PropTypes.string,
          references: PropTypes.array,
          hasResults: PropTypes.bool,
          // Add structured_info for new fields
          structured_info: PropTypes.shape({
            protocolSection: PropTypes.shape({
              identificationModule: PropTypes.shape({
                organization: PropTypes.shape({
                  fullName: PropTypes.string,
                }),
              }),
              statusModule: PropTypes.shape({
                startDateStruct: PropTypes.shape({
                  date: PropTypes.string,
                }),
                completionDateStruct: PropTypes.shape({
                  date: PropTypes.string,
                }),
              }),
            }),
          }),
        })
      ),
      nextPageToken: PropTypes.string,
    }),
  }),
  onResultSelect: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default SearchResults;
