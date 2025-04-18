// src/api/searchApi.js
import axios from 'axios';

// eslint-disable-next-line no-undef
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';
const API_ENDPOINT = `${BASE_URL}/api/search`;

/**
 * Sends a search request to the backend API.
 * @param {object} searchParams - The search parameters payload.
 * @returns {Promise<object>} - A promise that resolves with the search results data.
 * @throws {Error} - Throws an error if the API request fails.
 */
export const searchClinicalTrials = async (searchParams) => {
  console.log('[API] Sending search request to:', API_ENDPOINT, 'with params:', searchParams);
  try {
    const response = await axios.post(API_ENDPOINT, searchParams);
    console.log('[API] Received response:', response.data);
    return response.data;
  } catch (error) {
    console.error("[API] Search request failed:", error.response || error.message || error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
};
