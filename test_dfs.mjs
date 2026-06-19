import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

async function main() {
  try {
    if (!GEMINI_KEY) {
      throw new Error('Missing GEMINI_API_KEY in environment.');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const failedQuestions = ['What is the SI unit of force?'];
    const prompt = `Given these failed quiz questions: ${JSON.stringify(failedQuestions)}.
Extract the core 'concepts' for each, and generate a strict prerequisite dependency graph mapping 'concept' -> ['prerequisite1'].
Return ONLY valid JSON without markdown blocks like this:
{"concept_graph": {"Calculus": ["Limits"], "Limits": ["Functions"]}, "starting_concepts": ["Calculus"]}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    fs.writeFileSync('test_output.txt', `SUCCESS\n\nRaw:\n${raw}`);
    console.log('SUCCESS - see test_output.txt');
  } catch (e) {
    fs.writeFileSync('test_output.txt', `ERROR\n\n${e.message}\n\nStack:\n${e.stack}`);
    console.log('ERROR - see test_output.txt');
  }
}

main();
