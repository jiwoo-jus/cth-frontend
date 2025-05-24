// src/api/searchApi.js
import axios from 'axios';

// Ensure BASE_URL defaults to HTTPS if it's missing or starts with HTTP
const BASE_URL = (() => {
  const url = process.env.REACT_APP_API_URL;
  if (!url || url.startsWith('http://')) {
    return 'https://cth-backend-103266204202.us-central1.run.app';
  }
  return url;
})();

export const searchClinicalTrials = async (searchParams) => {
  try {
    // Use the updated BASE_URL
    const response = await axios.post(`${BASE_URL}/api/search`, searchParams);
    return response.data;
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};
