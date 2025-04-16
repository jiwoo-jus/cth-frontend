// src/api/searchApi.js
import axios from 'axios';

// BASE_URL은 .env에 정의된 REACT_APP_API_URL (예: http://localhost:5050)을 사용합니다.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';

export const searchClinicalTrials = async (searchParams) => {
  try {
    // BASE_URL이 http://localhost:5050 인 경우, 최종 URL은 http://localhost:5050/api/search가 됨.
    const response = await axios.post(`${BASE_URL}/api/search`, searchParams);
    return response.data;
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};
