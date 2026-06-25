import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env' });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) : 'MISSING');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function test() {
    try {
        const result = await model.generateContent('Hello');
        console.log('SUCCESS:', result.response.text());
    } catch (e) {
        console.error('FULL ERROR:', e);
    }
}
test();
