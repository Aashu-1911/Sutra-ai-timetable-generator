// API configuration
export const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to localhost
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    UPLOAD: '/upload',
    FILES: '/files',
    PARSE: '/parse',
    GENERATE: '/generate',
    BRANCHES_DIVISIONS: '/api/branches-divisions',
    TIMETABLES: '/api/timetables',
  },
  
  // Request configuration
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // File upload configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['.xlsx', '.xls', '.csv'],
};

// Helper to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG;
