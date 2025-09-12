// Environment configuration utility
const config = {
  development: {
    API_BASE_URL: 'http://localhost/School/backend/',
    DEBUG: true,
    ENVIRONMENT: 'development'
  },
  production: {
    API_BASE_URL: 'https://ttss.webdekho.in/apis/',
    DEBUG: false,
    ENVIRONMENT: 'production'
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  // Check if we're in production build
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Check custom environment variable
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV;
  }
  
  return 'development';
};

// Get environment-specific configuration
export const getConfig = () => {
  const environment = getCurrentEnvironment();
  const environmentConfig = config[environment] || config.development;
  
  // Override with environment variables if available
  return {
    ...environmentConfig,
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || environmentConfig.API_BASE_URL,
    DEBUG: process.env.REACT_APP_DEBUG === 'true' || environmentConfig.DEBUG,
    APP_NAME: process.env.REACT_APP_NAME || 'Trivandrum Scottish',
    VERSION: process.env.REACT_APP_VERSION || '1.0.0',
    ENVIRONMENT: environment
  };
};

// Export current configuration
export const ENV_CONFIG = getConfig();

// Log current environment (only in development)
if (ENV_CONFIG.DEBUG) {
  console.log('Environment Configuration:', ENV_CONFIG);
}