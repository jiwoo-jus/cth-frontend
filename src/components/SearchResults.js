import { Eye } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

// --- Sub-components for List Items ---

const PubMedResultItem = React.memo(({ item, onResultSelect, onViewDetails }) => (
  <li
    onClick={() => onResultSelect(item)}
    className="group p-4 bg-white border border-custom-border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
  >
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-custom-blue-deep group-hover:underline text-base">
        {item.title}
      </h4>
      <p className="text-sm text-custom-text-subtle mt-1 truncate">
        {item.authors?.join(", ")}
      </p>
      <p className="text-sm text-custom-text truncate">
        {item.journal} <span className="mx-1">|</span> {item.pubDate}
      </p>
      <p className="text-xs text-custom-text-subtle mt-1 truncate">
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${item.pmid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-custom-blue hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent li's onClick
        >
          PMID: {item.pmid}
        </a>
        {item.pmcid && (
          <>
            <span className="mx-1">|</span>
            <a
              href={`https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-custom-blue hover:underline"
              onClick={(e) => e.stopPropagation()} // Prevent li's onClick
            >
              PMCID: {item.pmcid}
            </a>
          </>
        )}
      </p>
    </div>
    <div className="shrink-0 self-start md:self-center">
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent li's onClick
          onViewDetails(item);
        }}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-100 text-secondary-100 rounded-full hover:bg-primary-100/90 transition-colors" // Slight hover effect adjustment
      >
        <Eye size={14} /> View
      </button>
    </div>
  </li>
));

PubMedResultItem.propTypes = {
  item: PropTypes.object.isRequired,
  onResultSelect: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
PubMedResultItem.displayName = 'PubMedResultItem'; // For React DevTools


const CtgResultItem = React.memo(({ study, onResultSelect, onViewDetails }) => {
  // Safely access nested properties using optional chaining
  const organization = study.structured_info?.protocolSection?.identificationModule?.organization?.fullName;
  const startDate = study.structured_info?.protocolSection?.statusModule?.startDateStruct?.date;
  const completionDateInfo = study.structured_info?.protocolSection?.statusModule?.completionDateStruct;
  // Display completion date only if it's actual
  const completionDate = completionDateInfo?.type === 'ACTUAL' ? completionDateInfo?.date : null;

  // Build the details row items conditionally
  const detailsRowItems = [
    study.studyType,
    study.references ? `${study.references.length} reference${study.references.length !== 1 ? 's' : ''}` : null, // Handle pluralization
    study.status,
    study.hasResults !== undefined ? (study.hasResults ? <strong>has results</strong> : 'no results') : null,
  ].filter(Boolean); // Filter out null/undefined values

  return (
    <li
      onClick={() => onResultSelect(study)}
      className="group p-4 bg-white border border-custom-border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-4 cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        {/* Row 1: Title */}
        <h4 className="font-semibold text-custom-green-deep group-hover:underline text-base">
          {study.title}
        </h4>
        {/* Row 2: Organization, Start Date, Completion Date */}
        {(organization || startDate || completionDate) && (
          <p className="text-sm text-custom-text mt-1 truncate">
            {organization}
            {organization && (startDate || completionDate) && <span className="mx-1">|</span>}
            {startDate && `Start: ${startDate}`}
            {startDate && completionDate && <span className="mx-1">|</span>}
            {completionDate && `Completion: ${completionDate}`}
          </p>
        )}
        {/* Row 3: Type | References | Status | Results */}
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
        {/* Row 4: NCT ID */}
        <p className="text-xs text-custom-text-subtle truncate mt-1">
          <a
            href={`https://clinicaltrials.gov/study/${study.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-custom-green hover:underline"
            onClick={(e) => e.stopPropagation()} // Prevent li's onClick
          >
            {study.id}
          </a>
        </p>
      </div>
      <div className="shrink-0 self-start md:self-center">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent li's onClick
            onViewDetails(study);
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-100 text-secondary-100 rounded-full hover:bg-primary-100/90 transition-colors" // Slight hover effect adjustment
        >
          <Eye size={14} /> View
        </button>
      </div>
    </li>
  );
});

CtgResultItem.propTypes = {
  study: PropTypes.object.isRequired,
  onResultSelect: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};
CtgResultItem.displayName = 'CtgResultItem'; // For React DevTools


// --- Main SearchResults Component ---

const SearchResults = ({ results, onResultSelect, onViewDetails }) => {
  // Provide default empty structures if results are null/undefined
  const pmResults = results?.pm || { total: 0, results: [] };
  const ctgResults = results?.ctg || { total: 0, results: [] };

  // Early return if no results object is provided at all
  if (!results) {
    return (
      <div className="text-center text-custom-text-subtle mt-4">
        Enter search terms and filters to begin.
      </div>
    );
  }

  const hasPmResults = pmResults.results.length > 0;
  const hasCtgResults = ctgResults.results.length > 0;

  // Return message if both result sets are empty after a search
  if (!hasPmResults && !hasCtgResults) {
     return (
      <div className="text-center text-custom-text-subtle mt-4">
        No results found for your query. Try broadening your search.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-10 px-4 w-full max-w-7xl mx-auto">
      {/* PubMed Results Section */}
      <section>
        <h3 className="text-lg font-semibold border-b border-custom-border pb-1 mb-4 flex items-center gap-2">
          PubMed Results {pmResults.total > 0 && `(${pmResults.total})`}
        </h3>
        {hasPmResults ? (
          <ul className="space-y-3">
            {pmResults.results.map((item) => (
              <PubMedResultItem
                key={item.id || item.pmid} // Use pmid as fallback key
                item={item}
                onResultSelect={onResultSelect}
                onViewDetails={onViewDetails}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-custom-text-subtle">
            No PubMed results found for this query.
          </p>
        )}
      </section>

      {/* ClinicalTrials.gov Results Section */}
      <section>
        <h3 className="text-lg font-semibold border-b border-custom-border pb-1 mb-4 flex items-center gap-2">
          ClinicalTrials.gov Results {ctgResults.total > 0 && `(${ctgResults.total})`}
        </h3>
        {hasCtgResults ? (
          <ul className="space-y-3">
            {ctgResults.results.map((study) => (
              <CtgResultItem
                key={study.id}
                study={study}
                onResultSelect={onResultSelect}
                onViewDetails={onViewDetails}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-custom-text-subtle">
            No ClinicalTrials.gov results found for this query.
          </p>
        )}
      </section>
    </div>
  );
};

// Updated PropTypes for clarity and consistency
SearchResults.propTypes = {
  results: PropTypes.shape({
    pm: PropTypes.shape({
      total: PropTypes.number,
      results: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string, // Can be PMID or PMCID depending on source
          title: PropTypes.string,
          journal: PropTypes.string,
          pubDate: PropTypes.string,
          authors: PropTypes.arrayOf(PropTypes.string),
          pmid: PropTypes.string.isRequired, // PMID should always exist for PubMed results
          pmcid: PropTypes.string, // PMCID might not exist
          source: PropTypes.string, // Added source identifier
        })
      ),
    }),
    ctg: PropTypes.shape({
      total: PropTypes.number,
      results: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired, // NCT ID
          title: PropTypes.string,
          status: PropTypes.string,
          conditions: PropTypes.arrayOf(PropTypes.string),
          studyType: PropTypes.string,
          references: PropTypes.array,
          hasResults: PropTypes.bool,
          structured_info: PropTypes.object, // Keep as object, specific shape checked within component
          source: PropTypes.string, // Added source identifier
        })
      ),
      nextPageToken: PropTypes.string,
    }),
  }),
  onResultSelect: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

// Wrap export in React.memo for performance optimization
export default React.memo(SearchResults);
