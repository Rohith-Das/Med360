import Redis from "ioredis";

export const redis = new Redis({
  // Use the REDIS_HOST env var, or fallback to local for development
  host: process.env.REDIS_HOST || "127.0.0.1", 
  port: Number(process.env.REDIS_PORT) || 6379,
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on("error", (err) => {
  console.error("❌ Redis Error: ", err);
});