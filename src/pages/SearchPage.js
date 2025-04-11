// src/pages/SearchPage.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { searchClinicalTrials } from '../api/searchApi';
import DetailSidebar from '../components/DetailSidebar';
import FilterPanel from '../components/FilterPanel';
import SearchBar from '../components/SearchBar';
import SearchHistorySidebar from '../components/SearchHistorySidebar';
import SearchResults from '../components/SearchResults';

const SearchPage = () => {
  const navigate = useNavigate();

  const locationState = location.state && location.state.searchState;
  useEffect(() => {
    if (locationState) {
      // Restore previous search state without re-searching.
      setFilters(locationState.filters);
      setResults(locationState.results);
      setPage(locationState.page);
      setPageSize(locationState.pageSize);
      setRefinedQuery(locationState.refinedQuery);
      setCtgTokenHistory(locationState.ctgTokenHistory);
    }
  }, [locationState]);

  // const [searchParams] = useSearchParams();
  const [searchParams, setSearchParams] = useSearchParams();



  // 메인 검색박스 입력값
  const [query, setQuery] = useState('');

  // 기본 필터 상태 (검색 소스 다중 선택 포함)
  const [filters, setFilters] = useState({
    cond: '',
    intr: '',
    other_term: '',
    journal: '',
    sex: '',
    age: '',
    studyType: '',
    sponsor: '',
    location: '',
    status: '',
    sources: ["PM", "PMC", "CTG"]
  });
  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // refined 관련 상태
  const [isRefined, setIsRefined] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState(null);
  // CTG 토큰 히스토리: { [page]: token }
  const [ctgTokenHistory, setCtgTokenHistory] = useState({});
  // 검색 결과 및 로딩
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  // 검색 히스토리 및 선택된 결과
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  // 좌측/우측 사이드바 열림 여부 및 너비
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(500);

  // 초기 마운트 여부 확인
  const initialMountRef = useRef(true);

  // 새로고침 시 URL 쿼리 제거
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // URL 쿼리 파라미터 초기화 (페이지 로드시)
  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    setFilters({
      cond: params.cond || '',
      intr: params.intr || '',
      other_term: params.other_term || '',
      journal: params.journal || '',
      sex: params.sex || '',
      age: params.age || '',
      studyType: params.studyType || '',
      sponsor: params.sponsor || '',
      location: params.location || '',
      status: params.status || '',
      sources: params.sources ? JSON.parse(params.sources) : ["PM", "PMC", "CTG"]
    });
    setPage(Number(params.page) || 1);
    setPageSize(Number(params.pageSize) || 10);
    setIsRefined(params.isRefined === 'true');
    setRefinedQuery(params.refinedQuery ? JSON.parse(params.refinedQuery) : null);
    setCtgTokenHistory(params.ctgTokenHistory ? JSON.parse(params.ctgTokenHistory) : {});
    
    if (params.cond || params.intr || params.other_term) {
      handleSearch({
        cond: params.cond || '',
        intr: params.intr || '',
        other_term: params.other_term || '',
        journal: params.journal || '',
        sex: params.sex || '',
        age: params.age || '',
        studyType: params.studyType || '',
        sponsor: params.sponsor || '',
        location: params.location || '',
        status: params.status || '',
        sources: params.sources ? JSON.parse(params.sources) : ["PM", "PMC", "CTG"],
        page: Number(params.page) || 1,
        pageSize: Number(params.pageSize) || 10,
        isRefined: params.isRefined === 'true',
        refinedQuery: params.refinedQuery ? JSON.parse(params.refinedQuery) : null,
        ctgPageToken: params.ctgTokenHistory 
          ? JSON.parse(params.ctgTokenHistory)[Number(params.page)] || null 
          : null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터 변경 시 refined 상태 및 CTG 토큰 히스토리 초기화 (초기 마운트 제외)
  const sourcesString = JSON.stringify(filters.sources);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    setIsRefined(false);
    setRefinedQuery(null);
    setPage(1);
    setCtgTokenHistory({});
  }, [
    filters.cond,
    filters.intr,
    filters.other_term,
    filters.journal,
    filters.sex,
    filters.age,
    filters.studyType,
    filters.sponsor,
    filters.location,
    filters.status,
    sourcesString
  ]);

const handleViewDetails = (item) => {
  if (item.source === "CTG") {
    navigate(
      `/detail?nctId=${item.id}&source=CTG`,
      { state: { searchState: { filters, results, page, pageSize, refinedQuery, ctgTokenHistory } } }
    );
  } else {
    navigate(
      `/detail?paperId=${item.id}&pmcid=${item.pmcid}&source=${item.source}`,
      { state: { searchState: { filters, results, page, pageSize, refinedQuery, ctgTokenHistory } } }
    );
  }
};

const handleSearch = async (customParams = null) => {
  // 1. If this is the user’s first search attempt in the session:
  if (!customParams) {
    // Possibly reset certain states, e.g. page=1, isRefined=false, etc.
    const newFilters = { ...filters };
    setFilters(newFilters);
    setPage(1);
    setCtgTokenHistory({});
    setIsRefined(false);
    setRefinedQuery(null);

    // Add user_query from the main text box:
    customParams = { 
      ...newFilters, 
      user_query: query, 
      page: 1, 
      pageSize, 
      ctgPageToken: null 
    };

    // Save it to local search history
    setSearchHistory([customParams, ...searchHistory]);
  }

  // 2. Combine front-end filters with customParams
  const effectiveFilters = customParams || { 
    ...filters, 
    page, 
    pageSize, 
    isRefined, 
    refinedQuery, 
    ctgPageToken: ctgTokenHistory[page] || null 
  };

  // 3. Actually call your backend to do the search
  setLoading(true);
  try {
    // Here you call your LLM-based refine logic OR use the existing refined data
    const data = await searchClinicalTrials(effectiveFilters);

    // 4. Use the refined query returned by the LLM (if any)
    if (data.refinedQuery) {
      // e.g., if LLM refined "diabetes insulin treatment" to cond="diabetes", intr="insulin"
      effectiveFilters.cond = data.refinedQuery.cond || effectiveFilters.cond;
      effectiveFilters.intr = data.refinedQuery.intr || effectiveFilters.intr;
      effectiveFilters.other_term = data.refinedQuery.other_term || effectiveFilters.other_term;
      setRefinedQuery(data.refinedQuery);
      setIsRefined(true);
    }

    // Suppose the data includes results from CTG with a next page token
    if (data.results?.ctg?.nextPageToken) {
      setCtgTokenHistory(prev => ({
        ...prev, 
        [effectiveFilters.page + 1]: data.results.ctg.nextPageToken 
      }));
    }

    // 5. Update local state to hold these results
    setResults(data.results);

    // 6. Build a query object for the URL
    const newParams = {};

    // Include only fields you want in the URL
    if (effectiveFilters.cond) newParams.cond = effectiveFilters.cond;
    if (effectiveFilters.intr) newParams.intr = effectiveFilters.intr;
    if (effectiveFilters.other_term) newParams.other_term = effectiveFilters.other_term;
    if (filters.journal) newParams.journal = filters.journal;
    if (filters.sex) newParams.sex = filters.sex;
    if (filters.age) newParams.age = filters.age;
    if (filters.studyType) newParams.studyType = filters.studyType;
    if (filters.sponsor) newParams.sponsor = filters.sponsor;
    if (filters.location) newParams.location = filters.location;
    if (filters.status) newParams.status = filters.status;

    // Always include page and pageSize so that after refresh, it returns to the correct page
    newParams.page = effectiveFilters.page;
    newParams.pageSize = effectiveFilters.pageSize;

    // If sources are chosen
    if (effectiveFilters.sources) {
      // Convert to JSON if it's an array
      newParams.sources = JSON.stringify(effectiveFilters.sources);
    }

    // If there's a ctgPageToken, show it; otherwise, set it to "null"
    newParams.ctgPageToken = effectiveFilters.ctgPageToken ?? "null";

    // If we have a refined query object, store it as JSON
    if (effectiveFilters.refinedQuery) {
      newParams.refinedQuery = JSON.stringify(effectiveFilters.refinedQuery);
    }

    // If the user has triggered refine at least once
    newParams.isRefined = effectiveFilters.isRefined === true ? "true" : "false";

    // 7. Update the URL using React Router’s setSearchParams
    setSearchParams(newParams);

    // Optionally also call `navigate` to ensure the URL in the browser’s location bar is updated:
    navigate({ search: "?" + new URLSearchParams(newParams).toString() });

  } catch (error) {
    console.error("Error during search:", error);
    setResults(null);
  } finally {
    setLoading(false);
  }
};




  const handleHistorySelect = (historyItem) => {
    setFilters(historyItem);
    setPage(historyItem.page || 1);
    if (historyItem.ctgTokenHistory) {
      setCtgTokenHistory(historyItem.ctgTokenHistory);
    }
    handleSearch(historyItem);
  };

  const handleResultSelect = (result) => {
    setSelectedResult(result);
  };

  const goToPage = (newPage) => {
    setPage(newPage);
    handleSearch({ ...filters, page: newPage, pageSize, isRefined, refinedQuery, ctgPageToken: ctgTokenHistory[newPage] || null });
  };

  const onLeftResizerMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    const onMouseMove = (eMove) => {
      const newWidth = startWidth + (eMove.clientX - startX);
      if (newWidth > 100 && newWidth < 500) {
        setLeftWidth(newWidth);
      }
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onRightResizerMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    const onMouseMove = (eMove) => {
      const newWidth = startWidth + (startX - eMove.clientX);
      if (newWidth > 100 && newWidth < 500) {
        setRightWidth(newWidth);
      }
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const totalPages = results && results.pm ? Math.ceil(results.pm.total / pageSize) : 1;

  const handleLogoClick = () => {
    setFilters({
      cond: '',
      intr: '',
      other_term: '',
      journal: '',
      sex: '',
      age: '',
      studyType: '',
      sponsor: '',
      location: '',
      status: '',
      sources: ["PM", "PMC", "CTG"]
    });
    setQuery('');
    setPage(1);
    setPageSize(10);
    setIsRefined(false);
    setRefinedQuery(null);
    setCtgTokenHistory({});
    setSearchHistory([]);
    setResults(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col">
        <SearchHistorySidebar 
          history={searchHistory}
          onSelect={handleHistorySelect}
          isOpen={leftSidebarOpen}
          toggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          sidebarWidth={leftWidth}
        />
        {leftSidebarOpen && (
          <div
            onMouseDown={onLeftResizerMouseDown}
            className="w-1 cursor-ew-resize bg-gray-300"
          />
        )}
      </div>
      <div className="flex-grow p-4">
        <div className="mb-4 cursor-pointer" onClick={handleLogoClick}>
          <h1 className="text-4xl font-bold text-center">Clinical Trials Hub</h1>
        </div>
        <SearchBar query={query} setQuery={setQuery} onSubmit={() => handleSearch()} />
        <FilterPanel filters={filters} setFilters={setFilters} />
        {loading ? (
          <div className="text-center mt-6">Loading...</div>
        ) : (
          <SearchResults
            results={results}
            onResultSelect={handleResultSelect}
            onViewDetails={handleViewDetails}
          />
        )}
        {results && results.pm && (
          <div className="flex justify-center mt-4 space-x-4">
            <button
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="self-center">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {rightSidebarOpen && (
        <div
          onMouseDown={onRightResizerMouseDown}
          className="w-1 cursor-ew-resize bg-gray-300"
        />
      )}
      <DetailSidebar 
        selectedResult={selectedResult}
        isOpen={rightSidebarOpen}
        toggleSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        sidebarWidth={rightWidth}
      />
    </div>
  );
};

export default SearchPage;
