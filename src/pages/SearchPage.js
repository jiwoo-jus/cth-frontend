import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import _isEqual from 'lodash/isEqual'; // Import for _isEqual

// import { searchClinicalTrials as searchApi } from '../api/searchApi';
import { searchClinicalTrials as searchApi } from '../api/searchApi';
// Assuming Container is used
import CustomPagination from '../components/CustomPagination';
// Assuming CustomPagination is used

import { SearchBar } from '../components/SearchBar';
// import { FilterPanel } from '../components/FilterPanel';

import DetailSidebar from '../components/DetailSidebar';
// import SidebarNavigation from '../components/SidebarNavigation';
import { FilterPanel } from '../components/FilterPanel';
// This will change
import ResultsDisplay from '../components/search/ResultsDisplay';
// Import icons
import { ResultTabs } from '../components/search/ResultTabs';
import { SearchContext } from '../contexts/SearchContext'; // Make sure SearchContext is imported
import { createFilters, buildUrlParams, getCachedResultsForPage, updateSearchCacheForPage } from '../utils/searchUtils'; // Import utilities

// 세션 스토리지 캐시 key
const SESSION_KEY = "searchState";

// Default page size, can be overridden by user selection
const DEFAULT_PAGE_SIZE = 10;

function SearchPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialParams = Object.fromEntries([...searchParams]);

    const {
        query, setQuery,
        filters, setFilters,
        isRefined, setIsRefined,
        refinedQuery, setRefinedQuery,
        backendSearchPerformed, setBackendSearchPerformed,
        combinedItems, setCombinedItems,
        totalItems, setTotalItems,
        currentPage, setCurrentPage,
        pageSize, setPageSize,
        totalPages, setTotalPages,
        isLoading, setIsLoading,
        error, setError,
        pageCache, setPageCache, // Make sure setPageCache is here
        activeSources, setActiveSources,
    } = useContext(SearchContext);

    const cameFromDetailRef = useRef(false);
    const autoUpdateRef = useRef(false);
    const restoredRef = useRef(false);
    const initialMountRef = useRef(true);

    const [searchHistory, setSearchHistory] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    // const [ctgTokenHistory, setCtgTokenHistory] = useState({}); // If ctgTokenHistory is truly needed locally

    useEffect(() => {
        if (window.location.search) {
            console.log('[Initial] Removing URL query parameters on first mount.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const loadCache = () => {
        const cacheString = sessionStorage.getItem(SESSION_KEY);
        if (cacheString) {
            try {
                const parsed = JSON.parse(cacheString);
                console.log('[Cache] Loaded cache:', parsed);
                return parsed;
            } catch (e) {
                console.error('[Cache] Failed parsing cache:', e);
                return null;
            }
        }
        return null;
    };

    const saveCache = (cacheObj) => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(cacheObj));
        console.log('[Cache] Saved cache:', cacheObj);
    };

    useEffect(() => {
        if (location.state && location.state.searchState) {
            console.log('[Initial] Restoring state from location.state:', location.state.searchState);
            cameFromDetailRef.current = true;
            const state = location.state.searchState;
            setFilters(state.filters);
            setPageSize(state.pageSize);
            setSearchHistory(state.searchHistory || []);
            setRefinedQuery(state.refinedQuery);
            // setCtgTokenHistory(state.ctgTokenHistory || {}); // If using local ctgTokenHistory

            saveCache({
                filters: state.filters,
                pageSize: state.pageSize,
                searchHistory: state.searchHistory || [],
                currentPage: state.currentPage, // Assuming location.state.searchState has currentPage
                pageCache: {
                    [state.currentPage]: { // Assuming location.state.searchState has currentPage
                        items: state.combinedItems, // Assuming location.state.searchState has combinedItems
                        refinedQuery: state.refinedQuery,
                        // ctgTokenHistory: state.ctgTokenHistory // If using local ctgTokenHistory
                    }
                }
            });

            const newParams = buildUrlParams({
                ...state.filters
            });
            console.log('[Initial] Setting URL parameters from location.state:', newParams);
            setSearchParams(newParams);
            // navigate({ search: "?" + new URLSearchParams(newParams).toString() }, { replace: true }); // setSearchParams handles this
            
            restoredRef.current = true;
            return;
        }

        const cachedState = loadCache();
        if (cachedState) {
            console.log('[Initial] Restoring state from session cache.');
            setFilters(cachedState.filters || {});
            setCurrentPage(cachedState.currentPage || 1);
            setPageSize(cachedState.pageSize || DEFAULT_PAGE_SIZE);
            setSearchHistory(cachedState.searchHistory || []);
            if (cachedState.pageCache && cachedState.pageCache[cachedState.currentPage]) {
                const pageData = cachedState.pageCache[cachedState.currentPage];
                setCombinedItems(pageData.items || []); // Changed from setResults to setCombinedItems
                setRefinedQuery(pageData.refinedQuery);
                // setCtgTokenHistory(pageData.ctgTokenHistory || {}); // If using local ctgTokenHistory
            }
            const newParams = buildUrlParams({
                ...(cachedState.filters || {}),
                isRefined: cachedState.pageCache &&
                        cachedState.pageCache[cachedState.currentPage] &&
                        cachedState.pageCache[cachedState.currentPage].refinedQuery
                    ? "true"
                    : "false"
            });
            console.log('[Initial] Setting URL parameters from cache:', newParams);
            setSearchParams(newParams);
            // navigate({ search: "?" + new URLSearchParams(newParams).toString() }, { replace: true }); // setSearchParams handles this
            
            restoredRef.current = true;
            return;
        }

        console.log('[Initial] First entry with URL params:', initialParams);
        setFilters(createFilters(initialParams));
        setCurrentPage(Number(initialParams.page) || 1); // Changed from setPage
        setPageSize(Number(initialParams.pageSize) || DEFAULT_PAGE_SIZE);
        setIsRefined(initialParams.isRefined === 'true');
        // setRefinedQuery(initialParams.refinedQuery ? JSON.parse(initialParams.refinedQuery) : null); // refinedQuery from context is enough if URL reflects it

        if (initialParams.query || initialParams.cond || initialParams.intr || initialParams.other_term) { // Added initialParams.query
            console.log('[Initial] Auto-triggering search on first entry based on URL params.');
            // The handleSearch function will use the query and filters from context,
            // which should have been set by createFilters and setQuery (if query was in URL)
            // Ensure SearchContext also initializes query from URL params if needed.
            handleSearch(Number(initialParams.page) || 1, true); // userInitiated true to build fresh
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Removed navigate and setSearchParams from deps as they are stable

    const sourcesString = JSON.stringify(filters?.sources || []);
    const prevFiltersRef = useRef(filters || {});

    useEffect(() => {
        if (autoUpdateRef.current) {
            console.log('[Filters] Skipping reset due to automatic backend update.');
            autoUpdateRef.current = false;
            prevFiltersRef.current = filters;
            return;
        }

        if (restoredRef.current) {
            console.log('[Filters] Skipping effect due to restoration of state.');
            prevFiltersRef.current = filters;
            restoredRef.current = false; // Reset flag after use
            return;
        }

        if (initialMountRef.current) {
            initialMountRef.current = false;
            console.log('[Filters] Initial mount completed.');
            prevFiltersRef.current = filters;
            return;
        }

        console.log('[Filters] Filters changed:', filters);
        const prevFilters = prevFiltersRef.current;
        prevFiltersRef.current = filters; // Update ref after comparison

        if (cameFromDetailRef.current) {
            console.log('[Filters] Skipping page reset due to return from detail page.');
            cameFromDetailRef.current = false;
            return;
        }
        
        // Check if filters actually changed, excluding page-related or refinedQuery changes
        // This logic might need refinement based on what constitutes a "reset-worthy" filter change
        if (!_isEqual(filters, prevFilters)) {
             console.log('[Filters] Resetting page and refined query due to manual filter change.');
             setCurrentPage(1); // Changed from setPage
             setIsRefined(false);
             setRefinedQuery(null);
            // setCtgTokenHistory({}); // If using local ctgTokenHistory
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, sourcesString]); // Removed setCurrentPage, setIsRefined, setRefinedQuery from deps to avoid loops if they trigger filter changes indirectly.

    const handleViewDetails = (item) => {
        console.log('[Detail] View details for item:', item);

        const stateToPass = {
            filters,
            combinedItems, // Changed from results
            currentPage,   // Changed from page
            pageSize,
            refinedQuery,
            // ctgTokenHistory, // If using local ctgTokenHistory
            searchHistory
        };

        const metadata = {
            title: item.title,
            pmid: item.pmid || null,
            pmcid: item.pmcid || null,
            nctId: item.id || null,
            doi: item.doi || null,
            studyType: item.studyType || null,
            authors: item.authors || [],
            journal: item.journal || null,
            pubDate: item.pubDate || item.date || null,
            structured_info: item.source === 'CTG' ? item.structured_info : null,
        };

        const cached = loadCache() || { pageCache: {} };
        cached.filters = filters;
        cached.pageSize = pageSize;
        cached.searchHistory = searchHistory;
        cached.currentPage = currentPage; // Changed from page
        cached.pageCache[currentPage] = { // Changed from page
            items: combinedItems, // Changed from results
            refinedQuery,
            // ctgTokenHistory // If using local ctgTokenHistory
        };
        saveCache(cached);

        if (item.source === 'CTG') {
            navigate(`/detail?nctId=${item.id}&source=CTG`, {
                state: { searchState: stateToPass, metadata },
            });
        } else {
            navigate(`/detail?paperId=${item.id}&pmcid=${item.pmcid}&source=${item.source}`, {
                state: { searchState: stateToPass, metadata },
            });
        }
    };

    const handleSearchSuccess = useCallback((response, pageToUpdate) => {
        setIsLoading(false);
        setBackendSearchPerformed(true);
        setError(null);

        if (response.refinedQuery) {
            console.log('[SearchPage] Backend refined the query:', response.refinedQuery);
            setRefinedQuery(response.refinedQuery);
            // Optionally update query or filters in context if backend refinement changes them
            // Example: if (response.refinedQuery.user_query) setQuery(response.refinedQuery.user_query);
        }

        const newResults = response.results;
        if (newResults && newResults.items) {
            setCombinedItems(newResults.items);
            setTotalItems(newResults.total_items || 0);
            setCurrentPage(newResults.page || 1);
            setPageSize(newResults.page_size || DEFAULT_PAGE_SIZE);
            setTotalPages(newResults.total_pages || 0);

            updateSearchCacheForPage(pageToUpdate, {
                items: newResults.items,
                total_items: newResults.total_items,
                page: newResults.page,
                page_size: newResults.page_size,
                total_pages: newResults.total_pages,
                refinedQuery: response.refinedQuery,
            }, setPageCache); // Corrected: Pass setPageCache directly
            console.log('[SearchPage] Search completed and cache updated for page:', pageToUpdate);
        } else {
            setCombinedItems([]);
            setTotalItems(0);
            setTotalPages(0);
            console.warn('[SearchPage] No items found in results:', newResults);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setIsLoading, setBackendSearchPerformed, setError, setRefinedQuery, setCombinedItems, setTotalItems, setCurrentPage, setPageSize, setTotalPages, setPageCache, query, setQuery]);

    const handleSearchError = useCallback((err, pageToUpdate) => {
        setIsLoading(false);
        setError(err.message || 'Search failed. Please try again.');
        setCombinedItems([]);
        setTotalItems(0);
        setTotalPages(0);
        // This line should be correct if setPageCache is a function from context
        updateSearchCacheForPage(pageToUpdate, { error: err.message, items: [] }, setPageCache); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setIsLoading, setError, setCombinedItems, setTotalItems, setTotalPages, setPageCache]); // setPageCache is a dependency

    const handleSearch = useCallback(async (newPage = 1, userInitiated = false) => {
        if (!query.trim() && !Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true))) {
            console.log('[SearchPage] Query and filters are empty, clearing results.');
            setCombinedItems([]);
            setTotalItems(0);
            setTotalPages(0);
            setRefinedQuery(null);
            setBackendSearchPerformed(false);
            return;
        }
        
        if (userInitiated) {
            console.log("[SearchPage] User initiated search. Resetting refinedQuery and clearing page cache.");
            setRefinedQuery(null);
            setIsRefined(false);
            setPageCache({});
            setCurrentPage(1);
            newPage = 1;
        }
        
        const cachedPageData = getCachedResultsForPage(newPage, pageCache);
        if (cachedPageData && !cachedPageData.error && !userInitiated) {
            console.log(`[SearchPage] Using cached results for page ${newPage}`);
            setCombinedItems(cachedPageData.items || []);
            setTotalItems(cachedPageData.total_items || 0);
            setCurrentPage(cachedPageData.page || newPage);
            setPageSize(cachedPageData.page_size || pageSize); // Use pageSize from context as fallback
            setTotalPages(cachedPageData.total_pages || 0);
            if (cachedPageData.refinedQuery) {
                setRefinedQuery(cachedPageData.refinedQuery);
                setIsRefined(true);
            }
            setBackendSearchPerformed(true);
            return;
        }

        setIsLoading(true);
        console.log('[SearchPage] handleSearch called with current state:', { query, filters, page: newPage, pageSize });

        const payload = {
            sources: activeSources,
            user_query: query,
            page: newPage,
            pageSize: pageSize,
            cond: filters.condition,
            intr: filters.intervention,
            other_term: filters.otherTerm,
            journal: filters.journal,
            sex: filters.sex,
            age: filters.age,
            studyType: filters.studyType,
            sponsor: filters.sponsor,
            location: filters.location,
            status: filters.status,
            publicationType: filters.publicationType,
            phase: filters.phase,
            isRefined: !!refinedQuery,
            refinedQuery: refinedQuery,
        };
        console.log('[SearchPage] Prepared search payload:', payload);
        
        try {
            const response = await searchApi(payload); // Ensure this is the call, not searchApi.search()
            console.log('[SearchPage] Search API response received:', response);
            handleSearchSuccess(response, newPage);
        } catch (err) {
            console.error('[SearchPage] Search API error:', err);
            handleSearchError(err, newPage);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        query, filters, pageSize, activeSources, refinedQuery, pageCache, // Removed isRefined as direct dep
        handleSearchSuccess, handleSearchError, // These are memoized
        // Context setters (stable references)
        setIsLoading, setRefinedQuery, setIsRefined, setPageCache, setCurrentPage, 
        setCombinedItems, setTotalItems, setTotalPages, setBackendSearchPerformed, setPageSize 
    ]);
    
    // This useEffect handles initial search based on context state (e.g., from URL params parsed by SearchContext)
    // or from sessionStorage if SearchContext doesn't handle it directly.
    useEffect(() => {
        // This effect runs once on mount.
        // It checks if a search should be performed based on current query/filters in context.
        // Assumes SearchContext might have already populated query/filters from URL.
        if (initialMountRef.current) { // Check initialMountRef to ensure it runs only once effectively for this logic
            // initialMountRef.current = false; // Moved this to the filter change effect
            
            // Try to load from session storage if SearchContext doesn't handle full restoration
            const cachedStateString = sessionStorage.getItem(SESSION_KEY); // Using defined SESSION_KEY
            let restoredFromSession = false;
            if (cachedStateString) {
                try {
                    const cachedState = JSON.parse(cachedStateString);
                    console.log('[SearchPage Mount] Attempting to restore from session storage:', cachedState);
                    // If context setters are available, use them.
                    // This part is tricky if SearchContext also tries to load from session.
                    // For now, assume this is a complementary restoration or SearchContext doesn't do it.
                    if (cachedState.query !== undefined) setQuery(cachedState.query);
                    if (cachedState.filters) setFilters(cachedState.filters);
                    if (cachedState.currentPage) setCurrentPage(cachedState.currentPage);
                    if (cachedState.pageSize) setPageSize(cachedState.pageSize);
                    if (cachedState.pageCache) setPageCache(cachedState.pageCache);
                    if (cachedState.refinedQuery) setRefinedQuery(cachedState.refinedQuery);
                    if (cachedState.backendSearchPerformed) setBackendSearchPerformed(cachedState.backendSearchPerformed);
                    // ... restore other relevant states ...
                    
                    const pageToLoad = cachedState.currentPage || currentPage; // Use context's currentPage as fallback
                    const currentCache = cachedState.pageCache || pageCache; // Use context's pageCache as fallback
                    const cachedPageData = getCachedResultsForPage(pageToLoad, currentCache);

                    if (cachedPageData && cachedPageData.items && cachedPageData.items.length > 0 && cachedState.backendSearchPerformed) {
                        console.log('[SearchPage Mount] Restoring results from cached page data:', cachedPageData);
                        handleSearchSuccess({ results: cachedPageData, refinedQuery: cachedPageData.refinedQuery || cachedState.refinedQuery }, pageToLoad);
                        restoredFromSession = true;
                    } else if (cachedState.query || (cachedState.filters && Object.values(cachedState.filters).some(v => v))) {
                        console.log('[SearchPage Mount] Session state exists but no results for current page, or backend search not performed. Re-searching.');
                        handleSearch(pageToLoad, false); // false, try cache first for this page
                        restoredFromSession = true;
                    }
                } catch (e) {
                    console.error("Failed to parse or use cached search state from session:", e);
                }
            }

            if (!restoredFromSession && (query || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true)))) {
                // If not restored from session, but context has query/filters (e.g. from URL params initial parse in SearchContext)
                console.log('[SearchPage Mount] No session restoration, but query/filters exist in context. Starting search.');
                handleSearch(currentPage, true); // Start a fresh search from current page (usually 1)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Ran once on mount, ensure deps are minimal or context setters are stable


    // Effect for re-searching when filters change (but not query directly, SearchBar handles query submission)
    // This is tricky because filters can be set by URL, cache, or user.
    // The backendSearchPerformed flag helps distinguish initial load from user changes.
    useEffect(() => {
        if (!initialMountRef.current && backendSearchPerformed) { // Only after initial mount and if a search has happened
            console.log('[SearchPage Effect] Filters changed, re-searching from page 1:', filters);
            handleSearch(1, true); // true to indicate user-initiated-like change, reset cache
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, backendSearchPerformed]); // Query is not a direct dep here; SearchBar's onSubmit handles query changes.

    const handlePageChange = (newPage) => {
        if (newPage !== currentPage) {
            console.log(`[SearchPage] Page changed to ${newPage}`);
            handleSearch(newPage, false);
        }
    };

    const goToPage = (newPage) => { // This function seems redundant if handlePageChange and handleSearch cover it
        console.log('[Pagination] goToPage called. Current page:', currentPage, 'New page:', newPage);
        const cached = loadCache(); // This uses local loadCache, pageCache from context is preferred
        if (cached && cached.pageCache && cached.pageCache[newPage]) {
            const pageData = cached.pageCache[newPage];
            console.log('[Pagination] Found cached data for page', newPage, ':', pageData);
            setCurrentPage(newPage); // Changed from setPage
            setCombinedItems(pageData.items || []); // Changed from setResults, ensure 'items' key
            setRefinedQuery(pageData.refinedQuery);
            // setCtgTokenHistory(pageData.ctgTokenHistory || {}); // If using local ctgTokenHistory
            
            // URL update should be handled by handleSearch or a dedicated URL sync effect
            // const newParams = buildUrlParams({
            //     ...(filters || {}), // Use filters from context
            //     isRefined: pageData.refinedQuery ? "true" : "false"
            // });
            // setSearchParams(newParams);
            return;
        }
        console.log('[Pagination] No cache for page', newPage, '- triggering search.');
        // setCurrentPage(newPage); // handleSearch will set this
        handleSearch(newPage, false); // Call handleSearch to fetch/use context cache
    };

    const handleResultSelect = (result) => {
        console.log('[Result] Selected result:', result);
        setSelectedResult(result);
    };

    const handleLogoClick = () => {
        console.log('[Logo] Clicked logo. Resetting all states to initial values.');
        setFilters({
            sources: [], condition: '', intervention: '', otherTerm: '',
            journal: '', sex: '', age: '', studyType: '', sponsor: '',
            location: '', status: '', publicationType: '', phase: '',
        });
        setQuery('');
        setCurrentPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);
        setIsRefined(false);
        setRefinedQuery(null);
        setSearchHistory([]);
        setCombinedItems([]);
        setTotalItems(0);
        setTotalPages(0);
        setBackendSearchPerformed(false);
        setPageCache({});
        // setCtgTokenHistory({}); // If using local ctgTokenHistory

        sessionStorage.removeItem(SESSION_KEY);
        console.log('[Logo] State reset complete. Navigating to root and reloading.');
        navigate('/');
        // window.location.reload(); // Reloading might be too disruptive, context reset should suffice
    };

    return (
        <Container fluid className="search-page-container">
            <SearchBar 
                query={query} 
                setQuery={setQuery} 
                onSubmit={() => handleSearch(1, true)} 
            />
            <FilterPanel filters={filters} setFilters={setFilters} /> 
            <div className="search-results-area"> 
                {isLoading && <div className="loading-spinner">Loading results...</div>}
                {error && <div className="error-message">Error: {error}</div>}
                {!isLoading && !error && backendSearchPerformed && combinedItems.length > 0 && (
                    <>
                        <ResultsDisplay
                            results={combinedItems || []}
                            onResultSelect={handleViewDetails} // Pass the handler
                        />
                        <CustomPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
                {!isLoading && !error && backendSearchPerformed && combinedItems.length === 0 && (
                     <div className="text-center p-5">No results found for your query.</div>
                )}
                {!isLoading && !error && !backendSearchPerformed && !query && !Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true)) && (
                    <div className="text-center p-5">Please enter a query or select filters to start a search.</div>
                )}
            </div>
        </Container>
    );
}

export default SearchPage;