export default () => ({
  PORT: process.env.PORT || 8080,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/hllc-2025',
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
});
