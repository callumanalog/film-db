// test-env.js
import dotenv from 'dotenv';
dotenv.config(); // this loads .env.local

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
