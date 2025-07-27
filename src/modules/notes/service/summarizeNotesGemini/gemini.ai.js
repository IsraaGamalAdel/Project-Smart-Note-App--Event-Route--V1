import { GoogleGenerativeAI } from "@google/generative-ai";



const genAI = new GoogleGenerativeAI( process.env.GOOGLE_GEMINI_API_KEY);




export default genAI;