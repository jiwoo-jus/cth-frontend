import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SearchResults from '../components/SearchResults';
import { searchClinicalTrials } from '../api/searchApi';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    cond: '',
    intr: '',
    other_term: '',
    // 추가 advanced 필터 (FilterPanel에서 사용)
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

  const handleSearch = async () => {
    // 기본 검색어는 SearchBar의 입력(query)와 FilterPanel의 필터를 병합하여 전달합니다.
    const searchParams = {
      cond: filters.cond || query,
      intr: filters.intr,
      other_term: filters.other_term,
      // 백엔드에 전달할 추가 파라미터는 추후 필요한 경우 함께 포함하거나
      // 백엔드에서 하드코딩된 기본값과 결합할 수 있습니다.
      journal: filters.journal,
      sex: filters.sex,
      age: filters.age,
      studyType: filters.studyType,
      sponsor: filters.sponsor,
      location: filters.location,
      status: filters.status
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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Clinical Trials Hub</h1>
      <SearchBar query={query} setQuery={setQuery} onSubmit={handleSearch} />
      <FilterPanel filters={filters} setFilters={setFilters} />
      {loading ? (
        <div className="text-center mt-6">Loading...</div>
      ) : (
        <SearchResults results={results} />
      )}
    </div>
  );
};

export default SearchPage;
