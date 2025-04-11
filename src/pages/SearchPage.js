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
  const [searchParams, setSearchParams] = useSearchParams();
  // 검색 파라미터 초기값을 추출합니다.
  const initialParams = Object.fromEntries([...searchParams]);

  // 만약 location.state에 이전 검색 상태가 있다면 복원합니다.
  const locationState = location.state && location.state.searchState;
  useEffect(() => {
    if (locationState) {
      setFilters(locationState.filters);
      setResults(locationState.results);
      setPage(locationState.page);
      setPageSize(locationState.pageSize);
      setRefinedQuery(locationState.refinedQuery);
      setCtgTokenHistory(locationState.ctgTokenHistory);
    }
  }, [locationState]);

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
    setFilters({
      cond: initialParams.cond || '',
      intr: initialParams.intr || '',
      other_term: initialParams.other_term || '',
      journal: initialParams.journal || '',
      sex: initialParams.sex || '',
      age: initialParams.age || '',
      studyType: initialParams.studyType || '',
      sponsor: initialParams.sponsor || '',
      location: initialParams.location || '',
      status: initialParams.status || '',
      sources: initialParams.sources ? JSON.parse(initialParams.sources) : ["PM", "PMC", "CTG"]
    });
    setPage(Number(initialParams.page) || 1);
    setPageSize(Number(initialParams.pageSize) || 10);
    setIsRefined(initialParams.isRefined === 'true');
    setRefinedQuery(initialParams.refinedQuery ? JSON.parse(initialParams.refinedQuery) : null);
    setCtgTokenHistory(initialParams.ctgTokenHistory ? JSON.parse(initialParams.ctgTokenHistory) : {});
    
    if (initialParams.cond || initialParams.intr || initialParams.other_term) {
      handleSearch({
        cond: initialParams.cond || '',
        intr: initialParams.intr || '',
        other_term: initialParams.other_term || '',
        journal: initialParams.journal || '',
        sex: initialParams.sex || '',
        age: initialParams.age || '',
        studyType: initialParams.studyType || '',
        sponsor: initialParams.sponsor || '',
        location: initialParams.location || '',
        status: initialParams.status || '',
        sources: initialParams.sources ? JSON.parse(initialParams.sources) : ["PM", "PMC", "CTG"],
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
    let effectiveFilters;
    if (!customParams) {
      const newFilters = { ...filters };
      setFilters(newFilters);
      setPage(1);
      setCtgTokenHistory({});
      setIsRefined(false);
      setRefinedQuery(null);
      // Include the main search query in the payload
      customParams = { ...newFilters, user_query: query, page: 1, pageSize, ctgPageToken: null };
      setSearchHistory([customParams, ...searchHistory]);
      effectiveFilters = customParams;
    } else {
      effectiveFilters = customParams;
    }
  
    // 6. Build a query object for the URL using refined and advanced filter fields.
    const newParams = {};
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
  
    newParams.page = effectiveFilters.page;
    newParams.pageSize = effectiveFilters.pageSize;
    if (effectiveFilters.sources) {
      newParams.sources = JSON.stringify(effectiveFilters.sources);
    }
    newParams.ctgPageToken = effectiveFilters.ctgPageToken ?? "null";
    if (effectiveFilters.refinedQuery) {
      newParams.refinedQuery = JSON.stringify(effectiveFilters.refinedQuery);
    }
    newParams.isRefined = effectiveFilters.isRefined === true ? "true" : "false";
  
    // Update the URL with these parameters
    setSearchParams(newParams);
    navigate({ search: "?" + new URLSearchParams(newParams).toString() });
  
    setLoading(true);
    try {
      const requestFilters = { ...effectiveFilters, ctgPageToken: ctgTokenHistory[effectiveFilters.page] || null };
      const data = await searchClinicalTrials(requestFilters);
      setResults(data.results);
      if (data.refinedQuery) {
        effectiveFilters.cond = data.refinedQuery.cond || effectiveFilters.cond;
        effectiveFilters.intr = data.refinedQuery.intr || effectiveFilters.intr;
        effectiveFilters.other_term = data.refinedQuery.other_term || effectiveFilters.other_term;
        setRefinedQuery(data.refinedQuery);
        setIsRefined(true);
      }
      if (data.results?.ctg?.nextPageToken) {
        setCtgTokenHistory(prev => ({ ...prev, [effectiveFilters.page + 1]: data.results.ctg.nextPageToken }));
      }
  
      // Save the search state in sessionStorage for later restoration
      const stateToSave = {
        filters,
        results: data.results,
        page: effectiveFilters.page,
        pageSize: effectiveFilters.pageSize,
        refinedQuery: data.refinedQuery,
        ctgTokenHistory
      };
      sessionStorage.setItem("searchState", JSON.stringify(stateToSave));
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
