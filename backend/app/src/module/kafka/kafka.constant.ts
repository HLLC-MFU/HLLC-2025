export const KAFKA_CONFIG = {
  BROKERS: [process.env.KAFKA_BROKER || 'localhost:9092'],
  CLIENT_ID: 'nestjs-consumer',
  GROUP_ID: 'nestjs-group',
};