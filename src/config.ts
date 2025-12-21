const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  apiBaseUrl: isDevelopment
    ? 'http://192.168.1.181:3003'  // In development, point to your Nginx server or local deployment (http://localhost:3003)
    : process.env.API_URL,  // In production, the same /api as Nginx will serve it
};

export default config;