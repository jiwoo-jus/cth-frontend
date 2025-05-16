// Placeholder functions for search utilities

export const getCachedResultsForPage = (page, cache) => {
  // console.log(`[Cache] Attempting to get cached results for page ${page}`);
  if (cache && cache[page]) { // Simpler check if cache is the pageCache object directly
    // console.log(`[Cache] Found cached results for page ${page}:`, cache[page]);
    return cache[page];
  }
  // console.log(`[Cache] No cached results found for page ${page}`);
  return null;
};

// Corrected function signature and implementation
export const updateSearchCacheForPage = (page, data, setPageCacheFunc) => {
  // console.log(`[Cache] Updating cache for page ${page} with data:`, data, 'using setPageCacheFunc');
  if (typeof setPageCacheFunc !== 'function') {
    console.error('[Cache] setPageCacheFunc is not a function!', setPageCacheFunc);
    return;
  }
  setPageCacheFunc(prevPageCache => {
    const newPageCache = {
      ...prevPageCache,
      [page]: data,
    };
    // console.log('[Cache] New pageCache state:', newPageCache);
    return newPageCache;
  });
};

export const buildUrlParams = (filters) => {
  const params = new URLSearchParams();
  for (const key in filters) {
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      if (Array.isArray(filters[key])) {
        filters[key].forEach(value => params.append(key, value));
      } else {
        params.set(key, String(filters[key]));
      }
    }
  }
  return params;
};


export const createFilters = (params) => {
    // Helper to safely get array from params
    const getArray = (key) => params.getAll ? params.getAll(key) : (params[key] ? [params[key]] : []);
    // Helper to safely get string from params, preferring the first if multiple exist
    const getString = (key, defaultValue = null) => {
        const value = params.get ? params.get(key) : params[key];
        return value !== undefined && value !== null ? String(value) : defaultValue;
    };
    const getBoolean = (key, defaultValue = false) => {
        const value = params.get ? params.get(key) : params[key];
        return value === 'true' ? true : (value === 'false' ? false : defaultValue);
    };

    return {
        query: getString('query', ''),
        // PM filters
        pmArticleTypes: getArray('pmArticleTypes'),
        pmPublicationYears: getString('pmPublicationYears'), // Assuming range like "2000-2023" or single year
        pmFreeFullText: getBoolean('pmFreeFullText'),
        pmSpecies: getArray('pmSpecies'), // "human", "other"
        pmSearchFields: getArray('pmSearchFields'), // "title", "abstract", "mesh"

        // CTG filters
        ctgRecruitmentStatus: getArray('ctgRecruitmentStatus'),
        ctgStudyTypes: getArray('ctgStudyTypes'),
        ctgStudyResults: getString('ctgStudyResults'), // "with", "without"
        ctgAgeGroups: getArray('ctgAgeGroups'),
        ctgPhases: getArray('ctgPhases'),
        ctgFunders: getArray('ctgFunders'),
        // ctgEligibilityCriteria: getString('ctgEligibilityCriteria'), // Text search
        // ctgInterventions: getString('ctgInterventions'), // Text search
        // ctgOutcomeMeasures: getString('ctgOutcomeMeasures'), // Text search
        // ctgConditions: getString('ctgConditions'), // Text search
        // ctgLocations: getString('ctgLocations'), // Text search

        // Shared/General filters (if any, or manage separately)
        // Example:
        // dateRange: getString('dateRange'), // Could be used for both if applicable

        // Search behavior
        page: parseInt(getString('page', '1'), 10),
        pageSize: parseInt(getString('pageSize', '10'), 10),
        isRefined: getBoolean('isRefined', false),
        // refinedQuery: getString('refinedQuery'), // This is handled separately in SearchPage state

        // Active sources (if you allow users to toggle sources)
        // sources: getArray('sources').length > 0 ? getArray('sources') : ['PM', 'CTG'], // Default to both
    };
};