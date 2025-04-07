// filepath: src/pages/SearchPage.js
import React, { useState, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SearchResults from '../components/SearchResults';
import SearchHistorySidebar from '../components/SearchHistorySidebar';
import DetailSidebar from '../components/DetailSidebar';
import { searchClinicalTrials } from '../api/searchApi';

const SearchPage = () => {
  const [query, setQuery] = useState('');
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
    status: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  // 좌측/우측 사이드바 열림 여부
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // 좌측/우측 사이드바 너비 (기본값: 250px)
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(500);

  // 드래그 중인 상태
  const leftResizerRef = useRef(null);
  const rightResizerRef = useRef(null);

  const handleSearch = async (customFilters = null) => {
    const effectiveFilters = customFilters || filters;
    if (!customFilters) {
      setSearchHistory([effectiveFilters, ...searchHistory]);
    }
    const searchParams = {
      cond: effectiveFilters.cond || query,
      intr: effectiveFilters.intr,
      other_term: effectiveFilters.other_term,
      journal: effectiveFilters.journal,
      sex: effectiveFilters.sex,
      age: effectiveFilters.age,
      studyType: effectiveFilters.studyType,
      sponsor: effectiveFilters.sponsor,
      location: effectiveFilters.location,
      status: effectiveFilters.status
    };

    setLoading(true);
    try {
      const data = await searchClinicalTrials(searchParams);
      setResults(data.results);
    } catch (error) {
      console.error("Error during search:", error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (historyItem) => {
    setFilters(historyItem);
    handleSearch(historyItem);
  };

  const handleResultSelect = (result) => {
    setSelectedResult(result);
  };

  // 좌측 사이드바 리사이징 핸들러
  const onLeftResizerMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    const onMouseMove = (eMove) => {
      const newWidth = startWidth + (eMove.clientX - startX);
      if(newWidth > 100 && newWidth < 500) {
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
      if(newWidth > 100 && newWidth < 500) {
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
        {/* 좌측 리사이저 (드래그 영역) */}
        {leftSidebarOpen && (
          <div
            ref={leftResizerRef}
            onMouseDown={onLeftResizerMouseDown}
            className="w-1 cursor-ew-resize bg-gray-300"
          />
        )}
      </div>

      {/* 중앙 메인 콘텐츠 */}
      <div className="flex-grow p-4">
        <h1 className="text-3xl font-bold text-center mb-6">Clinical Trials Hub</h1>
        <SearchBar query={query} setQuery={setQuery} onSubmit={() => handleSearch()} />
        <FilterPanel filters={filters} setFilters={setFilters} />
        {loading ? (
          <div className="text-center mt-6">Loading...</div>
        ) : (
          <SearchResults results={results} onResultSelect={handleResultSelect} />
        )}
      </div>

      {/* 우측 리사이저 */}
      {rightSidebarOpen && (
        <div
          ref={rightResizerRef}
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
