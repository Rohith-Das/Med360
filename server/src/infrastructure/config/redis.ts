import Redis from "ioredis";

export const redis=new Redis({
   host: "127.0.0.1",
  port: 6379,
})
redis.on('connect',()=>{
    console.log('redis connected successfully');
    
})
redis.on("error", (err) => {
  console.error("Redis Error: ", err);
});