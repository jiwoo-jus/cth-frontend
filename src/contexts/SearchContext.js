// src/contexts/SearchContext.js
import React, { createContext, useState, useCallback } from 'react';

export const SearchContext = createContext(null);

const DEFAULT_PAGE_SIZE = 10;

export const SearchProvider = ({ children }) => {
    const [query, setQuery] = useState(''); // Initialize query
    const [filters, setFilters] = useState({
        sources: [],
        condition: '',
        intervention: '',
        otherTerm: '',
        journal: '',
        sex: '',
        age: '',
        studyType: '',
        sponsor: '',
        location: '',
        status: '',
        publicationType: '',
        phase: '',
    });
    const [isRefined, setIsRefined] = useState(false);
    const [refinedQuery, setRefinedQuery] = useState(null);
    const [backendSearchPerformed, setBackendSearchPerformed] = useState(false);
    const [combinedItems, setCombinedItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pageCache, setPageCache] = useState({});
    const [activeSources, setActiveSources] = useState(['PM', 'CTG']); // Example default
    const [selectedPaper, setSelectedPaper] = useState(null); // Added selectedPaper state

    // ... other functions ...

    const contextValue = {
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
        pageCache, setPageCache,
        activeSources, setActiveSources,
        selectedPaper, setSelectedPaper,
        // Make sure all functions you intend to provide are here
    };

    return (
        <SearchContext.Provider value={contextValue}>
            {children}
        </SearchContext.Provider>
    );
};