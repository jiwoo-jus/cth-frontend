import React, { createContext, useState } from 'react';

export const PaperContext = createContext();

export const PaperProvider = ({ children }) => {
  const [selectedPaper, setSelectedPaper] = useState(null);

  return (
    <PaperContext.Provider value={{ selectedPaper, setSelectedPaper }}>
      {children}
    </PaperContext.Provider>
  );
};