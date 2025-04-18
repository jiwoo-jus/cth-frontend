/**
 * Builds URL search parameters including only essential filter keys.
 * Allowed keys: 'cond', 'intr', 'sources'.
 * 'sources' array is joined with a comma.
 * @param {object} filtersObj - The filters object.
 * @returns {object} - URL parameters object.
 */
export const buildUrlParams = (filtersObj) => {
  const allowedKeys = ['cond', 'intr', 'sources'];
  const params = {};
  allowedKeys.forEach((key) => {
    const value = filtersObj[key];
    // Skip null, undefined, or empty string values
    if (value === undefined || value === null || value === '') return;

    if (key === 'sources') {
      // Ensure value is an array before joining
      params[key] = Array.isArray(value) ? value.join(',') : value;
    } else {
      params[key] = value;
    }
  });
  return params;
};

/**
 * Creates a default filters object with all values set to null,
 * except for 'sources' which defaults to ["PM", "CTG"].
 * @returns {object} - The default filters object.
 */
export const defaultFilters = () => ({
  cond: null,
  intr: null,
  other_term: null,
  journal: null,
  sex: null,
  age: null,
  studyType: null,
  sponsor: null,
  location: null,
  status: null,
  sources: ["PM", "CTG"] // Default sources
});

/**
 * Creates a filters object from URL parameters or another object.
 * Sets missing values to null.
 * Converts comma-separated 'sources' string back to an array.
 * @param {object} [params={}] - The input parameters object.
 * @returns {object} - The filters object.
 */
export const createFilters = (params = {}) => ({
  cond: params.cond || null,
  intr: params.intr || null,
  other_term: null, // Not typically restored from basic URL params
  journal: null,
  sex: null,
  age: null,
  studyType: null,
  sponsor: null,
  location: null,
  status: null,
  // Split sources string by comma, default if not present
  sources: params.sources ? params.sources.split(',') : ["PM", "CTG"]
});

/**
 * Removes null, undefined, or empty string values from a filter object
 * before sending it as an API payload.
 * @param {object} filtersObj - The filters object.
 * @returns {object} - The cleaned payload object.
 */
export const preparePayload = (filtersObj) => {
  return Object.entries(filtersObj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Session storage key for caching search state.
 */
export const SESSION_KEY = "searchState";

/**
 * Loads the search state from session storage.
 * @returns {object | null} - The parsed cache object or null if not found/invalid.
 */
export const loadCache = () => {
  const cacheString = sessionStorage.getItem(SESSION_KEY);
  if (cacheString) {
    try {
      const parsed = JSON.parse(cacheString);
      console.log('[CacheUtil] Loaded state from session storage:', parsed);
      return parsed;
    } catch (e) {
      console.error('[CacheUtil] Failed to parse session storage data:', e);
      sessionStorage.removeItem(SESSION_KEY); // Clear invalid cache
      return null;
    }
  }
  return null;
};

/**
 * Saves the search state to session storage.
 * @param {object} cacheObj - The state object to save.
 */
export const saveCache = (cacheObj) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cacheObj));
    console.log('[CacheUtil] Saved state to session storage:', cacheObj);
  } catch (e) {
    console.error('[CacheUtil] Failed to save state to session storage:', e);
  }
};