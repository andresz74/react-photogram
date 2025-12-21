const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  apiBaseUrl: process.env.REACT_APP_API_URL || '',
  // apiBaseUrl: isDevelopment
  //   ? 'http://192.168.1.181:3003'  // Replace with your development API base URL
  //   : process.env.REACT_APP_API_URL || '', // In production, use the API URL from environment variables
};

export default config;
