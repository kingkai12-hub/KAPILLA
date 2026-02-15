import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional services
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // SMS (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      
      // In production, fail hard
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid environment configuration');
      }
      
      // In development, warn but continue
      console.warn('⚠️  Continuing with invalid environment (development mode)');
    }
    
    // Return partial env for development
    return process.env as z.infer<typeof envSchema>;
  }
}

export const env = validateEnv();

// Helper to check if a service is configured
export const isConfigured = {
  redis: !!env.REDIS_URL || !!env.UPSTASH_REDIS_REST_URL,
  email: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  monitoring: !!env.SENTRY_DSN,
};
