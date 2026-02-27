import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 10) : 'undefined');
console.log('Full MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('First char code:', process.env.MONGODB_URI ? process.env.MONGODB_URI.charCodeAt(0) : 'N/A');
