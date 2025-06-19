export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    NODE_ENV: nodeEnv,
    isProduction: nodeEnv === 'production' || false,

    PORT: process.env.PORT || 8080,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/hllc-2025',
    REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'pngwpeonhgperpongp',
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1d',
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET || 'pngwpeonhgperpongp-refresh',
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
    CRYPTO_SECRET: process.env.CRYPTO_SECRET || 'pngwpeonhgperpongp',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080/api',
    BASE_URL: process.env.BASE_URL || 'http://127.0.0.1:8080',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  };
};
