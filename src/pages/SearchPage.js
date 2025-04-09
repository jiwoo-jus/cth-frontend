// src/pages/SearchPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SearchResults from '../components/SearchResults';
import SearchHistorySidebar from '../components/SearchHistorySidebar';
import DetailSidebar from '../components/DetailSidebar';
import { searchClinicalTrials } from '../api/searchApi';

const SearchPage = () => {
  const navigate = useNavigate();
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
  const [rightWidth, setRightWidth] = useState(500); // 오른쪽 사이드바는 2배 넓게

  // 초기 마운트 여부 확인
  const initialMountRef = useRef(true);

  // 새로고침 시 URL 쿼리 제거 (기존 검색 조건 초기화)
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

  // 검색 함수: 사용자 직접 검색 버튼 클릭 시, 재검색을 위해 상태 초기화하고, 메인 검색박스 값은 user_query 필드로 추가
  const handleSearch = async (customParams = null) => {
    if (!customParams) {
      const newFilters = { ...filters }; // cond 필드는 그대로 유지
      setFilters(newFilters);
      setPage(1);
      setCtgTokenHistory({});
      setIsRefined(false);
      setRefinedQuery(null);
      // user_query 필드를 추가하여 메인 검색박스 입력값을 백엔드로 보냄
      customParams = { ...newFilters, user_query: query, page: 1, pageSize, ctgPageToken: null };
      setSearchHistory([customParams, ...searchHistory]);
    }
    const effectiveFilters = customParams || { ...filters, page, pageSize, isRefined, refinedQuery, ctgPageToken: ctgTokenHistory[page] || null };

    const newParams = {
      ...effectiveFilters,
      page: effectiveFilters.page,
      pageSize: effectiveFilters.pageSize,
      isRefined: effectiveFilters.isRefined,
      refinedQuery: effectiveFilters.refinedQuery ? JSON.stringify(effectiveFilters.refinedQuery) : "",
      ctgTokenHistory: JSON.stringify(ctgTokenHistory)
    };
    if (effectiveFilters.sources) {
      newParams.sources = JSON.stringify(effectiveFilters.sources);
    }
    setSearchParams(newParams);
    navigate({ search: "?" + new URLSearchParams(newParams).toString() });

    setLoading(true);
    try {
      const requestFilters = { ...effectiveFilters, ctgPageToken: ctgTokenHistory[effectiveFilters.page] || null };
      const data = await searchClinicalTrials(requestFilters);
      setResults(data.results);
      // CTG 결과: 다음 페이지 토큰 저장 (현재 페이지+1 키로)
      if (data.results.ctg && data.results.ctg.nextPageToken) {
        setCtgTokenHistory(prev => ({ ...prev, [effectiveFilters.page + 1]: data.results.ctg.nextPageToken }));
      }
      setRefinedQuery(data.refinedQuery);
      setIsRefined(true);
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

  // 페이지 변경 핸들러: CTG 토큰은 token history에서 현재 페이지에 해당하는 값을 사용
  const goToPage = (newPage) => {
    setPage(newPage);
    handleSearch({ ...filters, page: newPage, pageSize, isRefined, refinedQuery, ctgPageToken: ctgTokenHistory[newPage] || null });
  };

  // 좌측 사이드바 리사이징 핸들러
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

  // 우측 사이드바 리사이징 핸들러
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

  // PubMed 전체 페이지 수 계산 (CTG는 토큰 기반으로 별도 처리)
  const totalPages = results && results.pm ? Math.ceil(results.pm.total / pageSize) : 1;

  // 로고 클릭 시 상태 초기화 후 기본 URL로 새로고침
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
      {/* 좌측 사이드바 */}
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

      {/* 중앙 메인 콘텐츠 */}
      <div className="flex-grow p-4">
        <div className="mb-4 cursor-pointer" onClick={handleLogoClick}>
          <h1 className="text-4xl font-bold text-center">Clinical Trials Hub</h1>
        </div>
        <SearchBar query={query} setQuery={setQuery} onSubmit={() => handleSearch()} />
        <FilterPanel filters={filters} setFilters={setFilters} />
        {loading ? (
          <div className="text-center mt-6">Loading...</div>
        ) : (
          <SearchResults results={results} onResultSelect={handleResultSelect} />
        )}
        {/* 페이지네이션 컨트롤 (PubMed 기준) */}
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

      {/* 우측 리사이저 */}
      {rightSidebarOpen && (
        <div
          onMouseDown={onRightResizerMouseDown}
          className="w-1 cursor-ew-resize bg-gray-300"
        />
      )}

      {/* 우측 사이드바 */}
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
