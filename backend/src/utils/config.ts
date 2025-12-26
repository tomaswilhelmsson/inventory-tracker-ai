import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'dev-secret-key-not-for-production';
  })(),
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
  vat: {
    defaultRate: (() => {
      const rate = parseFloat(process.env.DEFAULT_VAT_RATE || '0');
      if (isNaN(rate) || rate < 0 || rate > 1) {
        console.warn(`Invalid DEFAULT_VAT_RATE: ${process.env.DEFAULT_VAT_RATE}. Using 0.`);
        return 0;
      }
      return rate;
    })(),
  },
};
