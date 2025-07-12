import 'reflect-metadata'
import dotenv from 'dotenv'

import { startServer } from "./server";


startServer().catch((err:unknown)=>{
 console.error(" Server failed to start:", err);
  process.exit(1);
})