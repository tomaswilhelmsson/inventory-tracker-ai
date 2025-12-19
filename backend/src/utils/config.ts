import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL || 'file:./data/inventory.db',
    provider: process.env.DATABASE_PROVIDER || 'sqlite',
  },
  gcs: {
    bucketName: process.env.GCS_BUCKET_NAME || '',
    keyFile: process.env.GCS_KEY_FILE || '',
  },
};
