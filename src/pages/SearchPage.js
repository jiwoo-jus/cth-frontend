import _isEqual from 'lodash/isEqual';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StepBack, StepForward } from 'lucide-react'; // Import icons

import { searchClinicalTrials } from '../api/searchApi';
import DetailSidebar from '../components/DetailSidebar';
// import SidebarNavigation from '../components/SidebarNavigation';
import { FilterPanel } from '../components/FilterPanel';
import { SearchBar } from '../components/SearchBar';
import SearchResults from '../components/SearchResults';

// 세션 스토리지 캐시 key
const SESSION_KEY = "searchState";

/**
 * URL 생성 시 필수 검색 필터만 포함하도록 수정합니다.
 * 오직 cond, intr, sources만 포함되며,
 * sources의 경우 배열이면 underscore 구분자(ex. "PM,CTG")로 변환합니다.
 */
const buildUrlParams = (filtersObj) => {
  const allowedKeys = ['cond', 'intr', 'sources'];
  const params = {};
  allowedKeys.forEach((key) => {
    const value = filtersObj[key];
    if (value === undefined || value === null || value === '') return;
    if (key === 'sources') {
      params[key] = Array.isArray(value) ? value.join(',') : value;
    } else {
      params[key] = value;
    }
  });
  return params;
};

// 초기 필터 상태 (모든 빈 값은 null)
// sources는 ["PM", "CTG"]로만 설정 (PMC는 제외)
const defaultFilters = () => ({
  cond: null,
  intr: null,
  other_term: null,
  journal: null,
  sex: null,
  age: null,
  studyType: null,
  sponsor: null,
  location: null,
  status: null,
  sources: ["PM", "CTG"]
});

/**
 * URL params 또는 기타 객체에서 필터 생성 (빈 값은 null 처리)
 * sources 값은 "PM_CTG"와 같이 underscore로 연결된 문자열을 배열로 변환합니다.
 */
const createFilters = (params = {}) => ({
  cond: params.cond || null,
  intr: params.intr || null,
  other_term: null,
  journal: null,
  sex: null,
  age: null,
  studyType: null,
  sponsor: null,
  location: null,
  status: null,
  sources: params.sources ? params.sources.split(',') : ["PM", "CTG"]
});

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = Object.fromEntries([...searchParams]);

  // 상세 페이지에서 복귀 여부를 판단하는 ref
  const cameFromDetailRef = useRef(false);
  // 백엔드 자동 업데이트에 의한 필터 업데이트 구분 플래그
  const autoUpdateRef = useRef(false);
  // 복원(캐시 또는 location.state)로 인해 값이 셋팅되었음을 나타내는 플래그
  const restoredRef = useRef(false);
  // 최초 마운트 여부
  const initialMountRef = useRef(true);

  // 검색 관련 상태
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(defaultFilters());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefined, setIsRefined] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState(null);
  const [ctgTokenHistory, setCtgTokenHistory] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  // const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  // const [rightWidth, setRightWidth] = useState(1000);

  // URL 쿼리 제거 (최초 로드시)
  useEffect(() => {
    if (window.location.search) {
      console.log('[Initial] Removing URL query parameters on first mount.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 캐시 읽기 helper
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

  // 캐시 저장 helper
  const saveCache = (cacheObj) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cacheObj));
    console.log('[Cache] Saved cache:', cacheObj);
  };

  // 초기 상태 복원: location.state → 세션스토리지 → URL 쿼리 순서로 복원
  useEffect(() => {
    if (location.state && location.state.searchState) {
      console.log('[Initial] Restoring state from location.state:', location.state.searchState);
      cameFromDetailRef.current = true;
      const state = location.state.searchState;
      setFilters(state.filters);
      setPage(state.page);
      setPageSize(state.pageSize);
      setSearchHistory(state.searchHistory || []);
      setRefinedQuery(state.refinedQuery);
      setCtgTokenHistory(state.ctgTokenHistory);
      
      saveCache({
        filters: state.filters,
        pageSize: state.pageSize,
        searchHistory: state.searchHistory || [],
        currentPage: state.page,
        pageCache: {
          [state.page]: {
            results: state.results,
            refinedQuery: state.refinedQuery,
            ctgTokenHistory: state.ctgTokenHistory
          }
        }
      });

      const newParams = buildUrlParams({
        ...state.filters
      });
      console.log('[Initial] Setting URL parameters from location.state:', newParams);
      setSearchParams(newParams);
      navigate({ search: "?" + new URLSearchParams(newParams).toString() }, { replace: true });
      
      // 복원되었음을 표시
      restoredRef.current = true;
      return;
    }

    const cachedState = loadCache();
    if (cachedState) {
      console.log('[Initial] Restoring state from session cache.');
      setFilters(cachedState.filters);
      setPage(cachedState.currentPage);
      setPageSize(cachedState.pageSize);
      setSearchHistory(cachedState.searchHistory || []);
      if (cachedState.pageCache && cachedState.pageCache[cachedState.currentPage]) {
        const pageData = cachedState.pageCache[cachedState.currentPage];
        setResults(pageData.results);
        setRefinedQuery(pageData.refinedQuery);
        setCtgTokenHistory(pageData.ctgTokenHistory);
      }
      const newParams = buildUrlParams({
        ...cachedState.filters,
        isRefined: cachedState.pageCache &&
                   cachedState.pageCache[cachedState.currentPage] &&
                   cachedState.pageCache[cachedState.currentPage].refinedQuery
          ? "true"
          : "false"
      });
      console.log('[Initial] Setting URL parameters from cache:', newParams);
      setSearchParams(newParams);
      navigate({ search: "?" + new URLSearchParams(newParams).toString() }, { replace: true });
      
      restoredRef.current = true;
      return;
    }

    // 최초 진입 (캐시나 location.state가 없을 경우)
    console.log('[Initial] First entry with URL params:', initialParams);
    setFilters(createFilters(initialParams));
    setPage(Number(initialParams.page) || 1);
    setPageSize(Number(initialParams.pageSize) || 10);
    setIsRefined(initialParams.isRefined === 'true');
    setRefinedQuery(initialParams.refinedQuery ? JSON.parse(initialParams.refinedQuery) : null);

    if (initialParams.cond || initialParams.intr || initialParams.other_term) {
      console.log('[Initial] Auto-triggering search on first entry.');
      handleSearch({
        ...createFilters(initialParams),
        page: Number(initialParams.page) || 1,
        pageSize: Number(initialParams.pageSize) || 10,
        isRefined: initialParams.isRefined === 'true',
        refinedQuery: initialParams.refinedQuery ? JSON.parse(initialParams.refinedQuery) : null,
        ctgPageToken: initialParams.ctgTokenHistory
          ? JSON.parse(initialParams.ctgTokenHistory)[Number(initialParams.page)] || null
          : null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터 변경 감지 (자동 업데이트 및 복원 상태 구분)
  const sourcesString = JSON.stringify(filters.sources);
  const prevFiltersRef = useRef(filters);

  useEffect(() => {
    // 백엔드 자동 업데이트에 의한 변경인 경우 무시
    if (autoUpdateRef.current) {
      console.log('[Filters] Skipping reset due to automatic backend update.');
      autoUpdateRef.current = false;
      prevFiltersRef.current = filters;
      return;
    }

    // 복원에 의한 업데이트라면 reset 로직 건너뛰기
    if (restoredRef.current) {
      console.log('[Filters] Skipping effect due to restoration of state.');
      prevFiltersRef.current = filters;
      restoredRef.current = false;
      return;
    }

    // 최초 마운트일 경우에도 변경 감지에서 제외
    if (initialMountRef.current) {
      initialMountRef.current = false;
      console.log('[Filters] Initial mount completed.');
      prevFiltersRef.current = filters;
      return;
    }

    console.log('[Filters] Filters changed:', filters);

    const prevFilters = prevFiltersRef.current;
    console.log('[Filters] Previous filters:', prevFilters);
    console.log('[Filters] Current filters:', filters);

    const changedKeys = Object.keys(filters).filter((key) => {
      if (key === 'refinedQuery') {
        return !_isEqual(filters[key], prevFilters[key]);
      }
      return filters[key] !== prevFilters[key];
    });
    console.log('[Filters] Changed keys:', changedKeys);

    prevFiltersRef.current = filters;

    if (cameFromDetailRef.current) {
      console.log('[Filters] Skipping page reset due to return from detail page.');
      cameFromDetailRef.current = false;
      return;
    }

    if (
      changedKeys.length === 0 ||
      (changedKeys.length <= 3 && changedKeys.every((key) => ['page', 'refinedQuery', 'ctgPageToken'].includes(key)))
    ) {
      console.log('[Filters] Only page, refinedQuery, or ctgPageToken changed (or no changes), skipping reset.');
      return;
    }

    console.log('[Filters] Resetting page, refined query, and CTG token history due to manual filter change.');
    setIsRefined(false);
    setRefinedQuery(null);
    setPage(1);
    setCtgTokenHistory({});
  }, [filters, sourcesString]);

  // src/pages/SearchPage.js
const handleViewDetails = (item) => {
  console.log('[Detail] View details for item:', item);

  // 기존에 searchState 관련해서 넘기던 것
  const stateToPass = {
    filters,
    results,
    page,
    pageSize,
    refinedQuery,
    ctgTokenHistory,
    searchHistory
  };

  // 메타데이터를 따로 뽑아서 detail 페이지로 넘겨줄 수 있음
  // item 안에 있는 title, pmid, pmcid, authors, pubDate 등 필요한 값들 추출
  const metadata = {
    title: item.title,
    pmid: item.pmid || null,
    pmcid: item.pmcid || null,
    nctId: item.nctId || null,
    doi: item.doi || null,
    studyType: item.studyType || null,
    authors: item.authors || [],
    journal: item.journal || null,
    pubDate: item.pubDate || item.date || null,
    // ... 추가로 필요한 것들 (journal명 등)
  };

  // sessionStorage 캐시 업데이트 등 기존 로직
  const cached = loadCache() || { pageCache: {} };
  cached.filters = filters;
  cached.pageSize = pageSize;
  cached.searchHistory = searchHistory;
  cached.currentPage = page;
  cached.pageCache[page] = { results, refinedQuery, ctgTokenHistory };
  saveCache(cached);

  // source에 따라 쿼리 파라미터도 설정
  if (item.source === 'CTG') {
    navigate(`/detail?nctId=${item.id}&source=CTG`, {
      state: {
        searchState: stateToPass,
        metadata: metadata,  // detail 페이지에서 쓸 데이터
      },
    });
  } else {
    // PM or PMC
    navigate(`/detail?paperId=${item.id}&pmcid=${item.pmcid}&source=${item.source}`, {
      state: {
        searchState: stateToPass,
        metadata: metadata,  // detail 페이지에서 쓸 데이터
      },
    });
  }
};


  // 필터 객체에서 빈 값(null, undefined, '') 제거 helper
  const preparePayload = (filtersObj) => {
    return Object.entries(filtersObj).reduce((acc, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});
  };

  // 검색 API 호출 및 캐시 업데이트 (refinedQuery 적용)
  const handleSearch = async (customParams = null) => {
    console.log('[Search] handleSearch called with params:', customParams);
    let rawFilters;
    if (!customParams) {
      rawFilters = { ...filters, user_query: query, page: 1, pageSize, ctgPageToken: null };
      console.log('[Search] Using current filters with query:', rawFilters);
      setSearchHistory([rawFilters, ...searchHistory]);
    } else {
      rawFilters = customParams;
    }
    const effectiveFilters = preparePayload(rawFilters);
    console.log('[Search] Prepared effective filters for API:', effectiveFilters);
    setLoading(true);
    try {
      effectiveFilters.ctgPageToken = ctgTokenHistory[effectiveFilters.page] || null;
      const data = await searchClinicalTrials(effectiveFilters);
      console.log('[Search] API response:', data);
      const updatedFilters = { ...rawFilters };
      if (data.refinedQuery) {
        console.log('[Search] Applying refinedQuery from API:', data.refinedQuery);
        updatedFilters.cond = data.refinedQuery.cond || updatedFilters.cond;
        updatedFilters.intr = data.refinedQuery.intr || updatedFilters.intr;
        updatedFilters.other_term = data.refinedQuery.other_term || updatedFilters.other_term;
        updatedFilters.refinedQuery = data.refinedQuery;
        updatedFilters.isRefined = true;
        autoUpdateRef.current = true;
        setRefinedQuery(data.refinedQuery);
        setIsRefined(true);
        setFilters(updatedFilters);
      }
      setResults(data.results);
      if (data.results?.ctg?.nextPageToken) {
        setCtgTokenHistory(prev => ({
          ...prev,
          [updatedFilters.page + 1]: data.results.ctg.nextPageToken
        }));
        console.log('[Search] Updated CTG token history:', ctgTokenHistory);
      }
      const newParams = buildUrlParams({
        ...updatedFilters,
        isRefined: updatedFilters.isRefined ? "true" : "false"
      });
      console.log('[Search] Updating URL and cache with newParams:', newParams);
      setSearchParams(newParams);
      navigate({ search: "?" + new URLSearchParams(newParams).toString() }, { replace: true });
      
      const cached = loadCache() || {};
      cached.filters = updatedFilters;
      cached.pageSize = updatedFilters.pageSize;
      cached.searchHistory = [updatedFilters, ...searchHistory];
      cached.currentPage = updatedFilters.page;
      cached.pageCache = cached.pageCache || {};
      cached.pageCache[updatedFilters.page] = {
        results: data.results,
        refinedQuery: updatedFilters.refinedQuery,
        ctgTokenHistory: ctgTokenHistory
      };
      saveCache(cached);
      console.log('[Search] Search completed, current page:', updatedFilters.page);
    } catch (error) {
      console.error('[Search] Error during search:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 전환: 캐시가 있으면 사용하고, 없으면 API 호출
  const goToPage = (newPage) => {
    console.log('[Pagination] goToPage called. Current page:', page, 'New page:', newPage);
    const cached = loadCache();
    if (cached && cached.pageCache && cached.pageCache[newPage]) {
      const pageData = cached.pageCache[newPage];
      console.log('[Pagination] Found cached data for page', newPage, ':', pageData);
      setPage(newPage);
      setResults(pageData.results);
      setRefinedQuery(pageData.refinedQuery);
      setCtgTokenHistory(pageData.ctgTokenHistory);
      const newParams = buildUrlParams({
        ...cached.filters,
        isRefined: pageData.refinedQuery ? "true" : "false"
      });
      console.log('[Pagination] Updating URL for cached page change:', newParams);
      setSearchParams(newParams);
      navigate({ search: "?" + new URLSearchParams(newParams).toString() }, { replace: true });
      return;
    }
    console.log('[Pagination] No cache for page', newPage, '- triggering search.');
    setPage(newPage);
    handleSearch({
      ...filters,
      page: newPage,
      pageSize,
      isRefined,
      refinedQuery,
      ctgPageToken: ctgTokenHistory[newPage] || null
    });
  };

  // 결과 항목 선택 시 처리
  const handleResultSelect = (result) => {
    console.log('[Result] Selected result:', result);
    setSelectedResult(result);
  };

  // 총 페이지 수 (예시: PubMed 결과 기준)
  const totalPages = results && results.pm ? Math.ceil(results.pm.total / pageSize) : 1;
  console.log('[Pagination] Calculated total pages:', totalPages);

  // 로고 클릭 시 전체 초기화
  const handleLogoClick = () => {
    console.log('[Logo] Clicked logo. Resetting all states to initial values.');
    setFilters(defaultFilters());
    setQuery('');
    setPage(1);
    setPageSize(10);
    setIsRefined(false);
    setRefinedQuery(null);
    setCtgTokenHistory({});
    setSearchHistory([]);
    setResults(null);
    sessionStorage.removeItem(SESSION_KEY);
    console.log('[Logo] State reset complete. Reloading page and navigating to root.');
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 사이드바 네비게이션 (지금은 안 씀) */}
      {/* <aside className="p-4">
        <SidebarNavigation />
      </aside> */}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-grow p-4 min-w-0"> {/* <--- min-w-0 추가해야 해당 flex 아이템의 암시적인 최소 너비를 0으로 설정하여, flex-grow와 함께 사용될 때 다른 flex 아이템(DetailSidebar)이 커지면 자신이 차지하는 공간을 필요한 만큼 줄일 수 있도록 함. */}
        <div className="mb-4 cursor-pointer" onClick={handleLogoClick}>
          <h1 className="text-3xl font-bold text-center text-black tracking-tight mb-6 hover:opacity-80 transition">
            Clinical Trials Hub
          </h1>
        </div>

        {/* 검색 바 */}
        <SearchBar 
          query={query} 
          setQuery={setQuery} 
          onSubmit={() => {
            console.log('[SearchBar] Submitting search with query:', query);
            handleSearch();
          }} 
        />

        {/* 필터 패널 */}
        <FilterPanel filters={filters} setFilters={setFilters} />

        {/* 검색 결과 영역 */}
        {loading ? (
          <div className="text-center mt-6">Loading...</div>
        ) : (
          <SearchResults
            results={results}
            onResultSelect={handleResultSelect}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* 페이지네비게이션 버튼 */}
        {results && results.pm && (
          <div className="flex justify-center items-center gap-6 mt-8">
            <button
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
              className="text-sm font-medium rounded-full text-black transition" // Adjusted padding
            >
              <StepBack size={20} /> {/* Use icon */}
            </button>
            <span className="text-sm text-custom-text">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
              className="text-sm font-medium rounded-full text-black transition" // Adjusted padding
            >
              <StepForward size={20} /> {/* Use icon */}
            </button>
          </div>
        )}
      </div>

      {/* 오른쪽 상세보기 사이드바 */}
      <DetailSidebar
        selectedResult={selectedResult}
        // 사이드바 열림/닫힘 및 너비는 DetailSidebar 내부에서 관리. 하지만 이렇게 매개변수로 전달 가능.
        expandedWidth="30%"    
        collapsedWidth="2rem"    
      />
    </div>
  );
};

export default SearchPage;