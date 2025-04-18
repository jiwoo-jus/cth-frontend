import _isEqual from 'lodash/isEqual';
import { StepBack, StepForward } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { searchClinicalTrials } from '../api/searchApi';
import DetailSidebar from '../components/DetailSidebar';
import FilterPanel from '../components/FilterPanel'; // Default export
import SearchBar from '../components/SearchBar'; // Default export
import SearchResults from '../components/SearchResults'; // Default export
import {
  buildUrlParams,
  defaultFilters,
  createFilters,
  preparePayload,
  SESSION_KEY,
  loadCache,
  saveCache,
} from '../utils/searchUtils'; // Import utils

const DEFAULT_PAGE_SIZE = 10;

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Refs ---
  // Ref to track if the component is mounted for the first time
  const isInitialMountRef = useRef(true);
  // Ref to track if state update comes from backend refinement vs user interaction
  const isBackendUpdateRef = useRef(false);
  // Ref to track if state was restored from cache or location state
  const isRestoredRef = useRef(false);
  // Ref to store the previous filters state for comparison
  const prevFiltersRef = useRef(null);

  // --- State ---
  // Search query input
  const [query, setQuery] = useState('');
  // Applied filters
  const [filters, setFilters] = useState(defaultFilters());
  // Current page number
  const [page, setPage] = useState(1);
  // Results per page
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // Flag indicating if the backend refined the query
  const [isRefined, setIsRefined] = useState(false);
  // The refined query object from the backend
  const [refinedQuery, setRefinedQuery] = useState(null);
  // History of CTG page tokens { [pageNumber]: token }
  const [ctgTokenHistory, setCtgTokenHistory] = useState({});
  // Search results object { pm: {...}, ctg: {...} }
  const [results, setResults] = useState(null);
  // Loading state for API calls
  const [loading, setLoading] = useState(false);
  // History of search parameters (optional, for potential future use)
  // const [searchHistory, setSearchHistory] = useState([]);
  // Currently selected result item for the detail sidebar
  const [selectedResult, setSelectedResult] = useState(null);

  // --- Initialization Effect (Runs Once) ---
  useEffect(() => {
    console.log('[SearchPage] Initializing component state...');
    const initialUrlParams = Object.fromEntries([...searchParams]);

    // 1. Try restoring from location.state (e.g., navigating back from detail)
    if (location.state?.searchState) {
      console.log('[SearchPage] Restoring state from location.state:', location.state.searchState);
      const state = location.state.searchState;
      setFilters(state.filters || defaultFilters());
      setPage(state.page || 1);
      setPageSize(state.pageSize || DEFAULT_PAGE_SIZE);
      setResults(state.results); // Restore results directly
      setRefinedQuery(state.refinedQuery);
      setIsRefined(!!state.refinedQuery);
      setCtgTokenHistory(state.ctgTokenHistory || {});
      // setSearchHistory(state.searchHistory || []); // Restore history if needed

      // Update cache with the restored state
      saveCache({
        filters: state.filters,
        pageSize: state.pageSize,
        // searchHistory: state.searchHistory || [],
        currentPage: state.page,
        pageCache: {
          [state.page]: {
            results: state.results,
            refinedQuery: state.refinedQuery,
            ctgTokenHistory: state.ctgTokenHistory || {},
          }
        }
      });

      // Update URL without triggering navigation
      const newUrlParams = buildUrlParams(state.filters);
      setSearchParams(newUrlParams, { replace: true });
      isRestoredRef.current = true; // Mark as restored
      console.log('[SearchPage] State restored from location.state.');
      return; // Stop further initialization
    }

    // 2. Try restoring from session storage cache
    const cachedState = loadCache();
    if (cachedState) {
      console.log('[SearchPage] Restoring state from session cache:', cachedState);
      setFilters(cachedState.filters || defaultFilters());
      setPage(cachedState.currentPage || 1);
      setPageSize(cachedState.pageSize || DEFAULT_PAGE_SIZE);
      // setSearchHistory(cachedState.searchHistory || []); // Restore history if needed

      // Restore results/state for the cached page
      const cachedPageData = cachedState.pageCache?.[cachedState.currentPage];
      if (cachedPageData) {
        setResults(cachedPageData.results);
        setRefinedQuery(cachedPageData.refinedQuery);
        setIsRefined(!!cachedPageData.refinedQuery);
        setCtgTokenHistory(cachedPageData.ctgTokenHistory || {});
      }

      // Update URL without triggering navigation
      const newUrlParams = buildUrlParams(cachedState.filters);
      setSearchParams(newUrlParams, { replace: true });
      isRestoredRef.current = true; // Mark as restored
      console.log('[SearchPage] State restored from session cache.');
      return; // Stop further initialization
    }

    // 3. Initialize from URL parameters (first visit or direct link)
    console.log('[SearchPage] No state/cache found, initializing from URL params:', initialUrlParams);
    const initialFilters = createFilters(initialUrlParams);
    setFilters(initialFilters);
    setPage(Number(initialUrlParams.page) || 1); // Default to 1 if not specified
    setPageSize(Number(initialUrlParams.pageSize) || DEFAULT_PAGE_SIZE);
    // Note: isRefined and refinedQuery are not typically set directly from basic URL params

    // Auto-trigger search if essential filters are present in the initial URL
    if (initialFilters.cond || initialFilters.intr || initialFilters.other_term) {
      console.log('[SearchPage] Initial URL has search terms, triggering auto-search.');
      // Use a timeout to allow initial state updates to settle before searching
      setTimeout(() => {
        handleSearch({
          ...initialFilters,
          page: Number(initialUrlParams.page) || 1,
          pageSize: Number(initialUrlParams.pageSize) || DEFAULT_PAGE_SIZE,
          // Pass null for refinement/token initially
          isRefined: false,
          refinedQuery: null,
          ctgPageToken: null,
        });
      }, 0);
    } else {
       // Clear URL params if no search was triggered on load
       console.log('[SearchPage] Initial URL has no search terms, clearing URL params.');
       setSearchParams({}, { replace: true });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Effect for Handling Filter Changes ---
  useEffect(() => {
    // Skip effect on the very first render
    if (isInitialMountRef.current) {
      console.log('[SearchPage Effect] Skipping filter change effect on initial mount.');
      isInitialMountRef.current = false;
      prevFiltersRef.current = filters; // Initialize prevFilters
      return;
    }

    // Skip effect if the update was triggered by the backend refinement
    if (isBackendUpdateRef.current) {
      console.log('[SearchPage Effect] Skipping filter change effect due to backend update.');
      isBackendUpdateRef.current = false; // Reset flag
      prevFiltersRef.current = filters; // Update prevFilters
      return;
    }

    // Skip effect if the state was just restored
    if (isRestoredRef.current) {
      console.log('[SearchPage Effect] Skipping filter change effect due to state restoration.');
      isRestoredRef.current = false; // Reset flag
      prevFiltersRef.current = filters; // Update prevFilters
      return;
    }

    // Compare current filters with previous filters (deep comparison for sources)
    const prevFilters = prevFiltersRef.current;
    if (!_isEqual(filters, prevFilters)) {
        console.log('[SearchPage Effect] Filters changed by user interaction:', { prev: prevFilters, current: filters });

        // Reset pagination, refinement status, and token history on manual filter changes
        console.log('[SearchPage Effect] Resetting page, refinement, and token history due to filter change.');
        setPage(1);
        setIsRefined(false);
        setRefinedQuery(null);
        setCtgTokenHistory({});
        // Optionally clear results immediately for faster UI feedback
        // setResults(null);

        // Update the URL based on the new filters
        const newUrlParams = buildUrlParams(filters);
        console.log('[SearchPage Effect] Updating URL params after filter change:', newUrlParams);
        setSearchParams(newUrlParams, { replace: true });

        // Trigger a new search automatically when filters change?
        // Decide based on UX preference. Currently requires manual submit via SearchBar.
        // handleSearch({ ...filters, page: 1, pageSize, ctgPageToken: null });
    }

    // Update previous filters ref for the next comparison
    prevFiltersRef.current = filters;

  }, [filters, setSearchParams]); // Dependency: filters object, setSearchParams


  // --- Event Handlers ---

  /**
   * Initiates a search request to the backend.
   * Can be called with specific parameters (e.g., for pagination) or uses current state.
   */
  const handleSearch = useCallback(async (searchParamsOverride = null) => {
    let searchPayload;
    let currentPage;

    if (searchParamsOverride) {
      // Use provided params (e.g., for initial load or pagination)
      console.log('[SearchPage] handleSearch called with override params:', searchParamsOverride);
      searchPayload = preparePayload(searchParamsOverride);
      currentPage = searchParamsOverride.page || 1;
    } else {
      // Use current state (e.g., when submitting from SearchBar)
      console.log('[SearchPage] handleSearch called with current state:', { query, filters, page, pageSize });
      // Reset page to 1 for new manual searches
      currentPage = 1;
      setPage(currentPage);
      setIsRefined(false); // Reset refinement for new manual search
      setRefinedQuery(null);
      setCtgTokenHistory({}); // Reset tokens for new manual search

      searchPayload = preparePayload({
        ...filters,
        user_query: query, // Include the main search query
        page: currentPage,
        pageSize,
        ctgPageToken: null, // No token for the first page of a new search
      });
      // Update URL for the new search
      const newUrlParams = buildUrlParams({ ...filters, user_query: query });
      setSearchParams(newUrlParams, { replace: true });
    }

    console.log('[SearchPage] Prepared search payload:', searchPayload);
    setLoading(true);
    setSelectedResult(null); // Clear selection on new search
    // setResults(null); // Optional: Clear previous results immediately

    try {
      // Ensure the correct token for the *requested* page is included
      searchPayload.ctgPageToken = ctgTokenHistory[currentPage] || null;
      console.log(`[SearchPage] Using CTG token for page ${currentPage}:`, searchPayload.ctgPageToken);

      const data = await searchClinicalTrials(searchPayload);
      console.log('[SearchPage] Search API response received:', data);

      let currentFilters = searchParamsOverride ? { ...searchParamsOverride } : { ...filters, user_query: query };
      let currentRefinedQuery = searchParamsOverride ? searchParamsOverride.refinedQuery : refinedQuery;
      let currentIsRefined = searchParamsOverride ? searchParamsOverride.isRefined : isRefined;
      let currentPageTokenHistory = { ...ctgTokenHistory };

      // Handle backend query refinement
      if (data.refinedQuery && !_isEqual(data.refinedQuery, currentRefinedQuery)) {
        console.log('[SearchPage] Backend refined the query:', data.refinedQuery);
        isBackendUpdateRef.current = true; // Set flag to prevent filter change effect loop

        currentFilters = {
          ...currentFilters,
          cond: data.refinedQuery.cond ?? currentFilters.cond,
          intr: data.refinedQuery.intr ?? currentFilters.intr,
          other_term: data.refinedQuery.other_term ?? currentFilters.other_term,
        };
        currentRefinedQuery = data.refinedQuery;
        currentIsRefined = true;

        setFilters(currentFilters); // Update filters state
        setRefinedQuery(currentRefinedQuery); // Update refined query state
        setIsRefined(currentIsRefined); // Update refined status state

        // Update URL with refined filters
        const refinedUrlParams = buildUrlParams(currentFilters);
        setSearchParams(refinedUrlParams, { replace: true });
      }

      // Update results
      setResults(data.results || { pm: { total: 0, results: [] }, ctg: { total: 0, results: [] } }); // Ensure results object exists

      // Update CTG token history for the *next* page
      if (data.results?.ctg?.nextPageToken) {
        const nextPage = currentPage + 1;
        console.log(`[SearchPage] Storing CTG token for next page (${nextPage}):`, data.results.ctg.nextPageToken);
        currentPageTokenHistory = {
          ...currentPageTokenHistory,
          [nextPage]: data.results.ctg.nextPageToken,
        };
        setCtgTokenHistory(currentPageTokenHistory);
      }

      // Update cache
      const cacheToSave = {
        filters: currentFilters,
        pageSize: pageSize,
        // searchHistory: searchHistory, // Update history if needed
        currentPage: currentPage,
        pageCache: {
          ...(loadCache()?.pageCache || {}), // Preserve cache for other pages
          [currentPage]: {
            results: data.results,
            refinedQuery: currentRefinedQuery,
            ctgTokenHistory: currentPageTokenHistory,
          },
        },
      };
      saveCache(cacheToSave);
      console.log('[SearchPage] Search completed and cache updated for page:', currentPage);

    } catch (error) {
      console.error('[SearchPage] Search failed:', error);
      setResults({ pm: { total: 0, results: [] }, ctg: { total: 0, results: [] } }); // Set empty results on error
      // TODO: Show user-friendly error message
    } finally {
      setLoading(false);
    }
  }, [filters, query, page, pageSize, ctgTokenHistory, setSearchParams, isRefined, refinedQuery,]); // Dependencies for useCallback


  /**
   * Navigates to a specific page, using cache if available, otherwise fetching.
   */
  const goToPage = useCallback((newPage) => {
    if (newPage === page) return; // Do nothing if already on the page
    console.log(`[SearchPage] goToPage requested for page: ${newPage}`);

    const cached = loadCache();
    const cachedPageData = cached?.pageCache?.[newPage];

    if (cachedPageData) {
      console.log(`[SearchPage] Cache hit for page ${newPage}. Restoring from cache.`);
      setPage(newPage);
      setResults(cachedPageData.results);
      setRefinedQuery(cachedPageData.refinedQuery);
      setIsRefined(!!cachedPageData.refinedQuery);
      setCtgTokenHistory(cachedPageData.ctgTokenHistory || {});

      // Update cache's current page pointer
      saveCache({ ...cached, currentPage: newPage });

      // Update URL (optional, could just rely on state)
      // const newUrlParams = buildUrlParams(cached.filters);
      // setSearchParams(newUrlParams, { replace: true });

    } else {
      console.log(`[SearchPage] Cache miss for page ${newPage}. Fetching data.`);
      // Set the new page state immediately for UI feedback
      setPage(newPage);
      // Trigger search for the new page, using current filters and refinement status
      handleSearch({
        ...filters,
        user_query: query, // Include current query
        page: newPage,
        pageSize,
        isRefined,
        refinedQuery,
        // Token for the requested page should already be in ctgTokenHistory if fetched sequentially
        ctgPageToken: ctgTokenHistory[newPage] || null,
      });
    }
  }, [page, filters, query, pageSize, isRefined, refinedQuery, ctgTokenHistory, handleSearch]); // Dependencies for useCallback

  /**
   * Handles selecting a result item to show details.
   */
  const handleResultSelect = useCallback((result) => {
    console.log('[SearchPage] Result selected:', result);
    setSelectedResult(result);
    // Optionally open/focus the DetailSidebar here if needed
  }, []);

  /**
   * Navigates to the full detail page for a selected item.
   */
  const handleViewDetails = useCallback((item) => {
    console.log('[SearchPage] Navigating to detail page for item:', item);

    // 1. Prepare state to pass for potential back navigation restoration
    const stateToPass = {
      filters,
      results, // Pass current results
      page,
      pageSize,
      refinedQuery,
      ctgTokenHistory,
      // searchHistory, // Pass history if needed
    };

    // 2. Extract metadata for the detail page itself
    const metadata = {
      title: item.title,
      source: item.source, // 'PM' or 'CTG'
      // PubMed specific
      pmid: item.pmid || null,
      pmcid: item.pmcid || null,
      authors: item.authors || [],
      journal: item.journal || null,
      pubDate: item.pubDate || null,
      // CTG specific
      nctId: item.id || null, // Use item.id for CTG's NCT ID
      studyType: item.studyType || null,
      status: item.status || null,
      // *** Add structured_info here ***
      structured_info: item.structured_info || null, // Ensure structured_info is included
      // Add other relevant fields as needed
    };

    // 3. Update session cache before navigating away
    const cached = loadCache() || { pageCache: {} };
    saveCache({
      ...cached,
      filters: filters,
      pageSize: pageSize,
      // searchHistory: searchHistory,
      currentPage: page,
      pageCache: {
        ...cached.pageCache,
        [page]: { results, refinedQuery, ctgTokenHistory }, // Ensure current page data is saved
      },
    });

    // 4. Navigate to the detail page with state and metadata
    let detailPath = '/detail';
    const queryParams = new URLSearchParams();
    queryParams.set('source', item.source);

    if (item.source === 'CTG') {
      queryParams.set('nctId', item.id);
    } else { // PubMed/PMC
      queryParams.set('paperId', item.id); // Assuming item.id holds PMID or PMCID here
      if (item.pmid) queryParams.set('pmid', item.pmid);
      if (item.pmcid) queryParams.set('pmcid', item.pmcid);
    }
    detailPath += `?${queryParams.toString()}`;

    console.log(`[SearchPage] Navigating to: ${detailPath}`);
    navigate(detailPath, {
      state: {
        searchState: stateToPass, // State for restoring SearchPage
        metadata: metadata,       // Data for DetailPage (now includes structured_info)
      },
    });
  }, [navigate, filters, results, page, pageSize, refinedQuery, ctgTokenHistory]); // Dependencies for useCallback

  /**
   * Resets the entire search state and navigates to the root.
   * Typically triggered by clicking the logo/title.
   */
  const handleResetAndGoHome = useCallback(() => {
    console.log('[SearchPage] Resetting state and navigating home.');
    // Clear state
    setQuery('');
    setFilters(defaultFilters());
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setIsRefined(false);
    setRefinedQuery(null);
    setCtgTokenHistory({});
    setResults(null);
    setSelectedResult(null);
    // setSearchHistory([]);
    setLoading(false);

    // Clear cache and URL params
    sessionStorage.removeItem(SESSION_KEY);
    setSearchParams({}, { replace: true }); // Clear URL params

    // Navigate to home - consider if reload is truly necessary
    navigate('/');
    // window.location.reload(); // Avoid full reload if possible
  }, [navigate, setSearchParams]); // Dependencies for useCallback


  // --- Render Logic ---

  // Calculate total pages based on PubMed results (adjust if CTG pagination is primary)
  const totalPmResults = results?.pm?.total || 0;
  const totalPages = totalPmResults > 0 ? Math.ceil(totalPmResults / pageSize) : 1;

  return (
    <div className="flex min-h-screen bg-gray-50"> {/* Added background color */}

      {/* Main Content Area */}
      <main className="flex-grow py-8 px-4 min-w-0"> {/* Use main tag */}
        {/* Logo/Header */}
        <div className="mb-8 text-center"> {/* Increased margin */}
          <h1
            className="text-3xl font-bold text-gray-800 tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleResetAndGoHome}
            title="Reset search and go home" // Added title attribute
          >
            Clinical Trials Hub
          </h1>
        </div>

        {/* Search Bar */}
        <SearchBar
          query={query}
          setQuery={setQuery}
          onSubmit={() => handleSearch()} // Pass handleSearch directly
        />

        {/* Filter Panel */}
        <FilterPanel filters={filters} setFilters={setFilters} />

        {/* Loading Indicator or Search Results */}
        {loading ? (
          <div className="text-center mt-10 text-gray-600">
            {/* Add a simple spinner or loading text */}
            <p>Loading results...</p>
          </div>
        ) : (
          <SearchResults
            results={results}
            onResultSelect={handleResultSelect} // Pass selection handler
            onViewDetails={handleViewDetails}   // Pass detail view handler
          />
        )}

        {/* Pagination Controls (Show only if there are results) */}
        {results && (totalPmResults > 0 || results.ctg?.results?.length > 0) && !loading && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <StepBack size={20} />
            </button>
            <span className="text-sm text-custom-text tabular-nums"> {/* Use tabular-nums for consistent spacing */}
              Page {page} {totalPmResults > 0 ? `of ${totalPages}` : ''} {/* Show total only if PM results exist */}
            </span>
            <button
              // Disable logic needs refinement if CTG drives pagination primarily
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || (!results?.pm?.results?.length && !results?.ctg?.nextPageToken)} // More robust check needed if CTG is primary
              className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <StepForward size={20} />
            </button>
          </div>
        )}
      </main>

      {/* Right Detail Sidebar */}
      <DetailSidebar
        selectedResult={selectedResult}
        // Configuration props for the sidebar's appearance/behavior
        expandedWidth="35%" // Example width
        collapsedWidth="0" // Collapse fully when no item selected
        onClose={() => setSelectedResult(null)} // Add a way to close the sidebar
        onViewFullDetail={handleViewDetails} // Pass handler to navigate from sidebar
      />
    </div>
  );
};

export default SearchPage;