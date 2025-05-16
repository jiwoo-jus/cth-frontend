// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './contexts/SearchContext';
import { PaperProvider } from './contexts/PaperContext'; // Import PaperProvider
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage'; // Assuming this might also need PaperContext or another context
import PaperDetailPage from './pages/PaperDetailPage';
// import StudyDetailPage from './pages/StudyDetailPage'; // If you have a detail page for CTG items

function App() {
  return (
    <Router> {/* Router should be the outermost component for routing */}
      <SearchProvider>
        <PaperProvider> {/* Wrap components that need PaperContext with PaperProvider */}
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/search" element={<SearchPage />} />
            {/* The DetailPage might need specific context or be a generic wrapper */}
            <Route path="/detail" element={<DetailPage />} /> 
            <Route path="/paper/:id" element={<PaperDetailPage />} />
            {/* Example route for CTG study details */}
            {/* <Route path="/study/:nctId" element={<StudyDetailPage />} /> */}
          </Routes>
        </PaperProvider>
      </SearchProvider>
    </Router>
  );
}

export default App;
