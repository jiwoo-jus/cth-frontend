import axios from 'axios';

// 베포시 환경에 따라 BASE_URL은 설정하거나 proxy 설정을 활용하세요.
console.log("API URL:", process.env.REACT_APP_API_URL);
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';
// const BASE_URL = 'http://localhost:5050';

export const searchClinicalTrials = async (searchParams) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/search`, searchParams);
    return response.data;
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};
