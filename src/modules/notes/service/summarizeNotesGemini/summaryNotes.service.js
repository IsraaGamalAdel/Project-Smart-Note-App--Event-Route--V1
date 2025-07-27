// DB
import * as dbService from '../../../../DB/db.service.js';
import { notesModel } from '../../../../DB/model/Note.model.js';
//utils
import { errorAsyncHandler } from '../../../../utils/response/error.response.js';
import { successResponse } from '../../../../utils/response/success.response.js';
// Gemini AI
import genAI from './gemini.ai.js';




// summarizeNotes Gemini AI
export const summarizeNote = errorAsyncHandler(
    async (req, res, next) => {
        const note = await dbService.findOne({
            model: notesModel,
            filter: {
                _id: req.params.id,
                userId: req.user._id
            }
        });

        if (!note) {
            return next(new Error(`Note not found or not user`, { cause: 404 }));
        }

        // content too short to summarize
        if (!note.content || note.content.length < 15) {
            return next(new Error(
                `Content must be longer than 15 characters`,
                { cause: 400 }
            ));
        }

        // Trim text if it is too long
        const MAX_LENGTH = 1000;  //3000
        const contentToSummarize = note.content.length > MAX_LENGTH
            ? note.content.substring(0, MAX_LENGTH) + "..."
            : note.content;

        // determine target language
        // const isEnglish = /[a-zA-Z]/.test(contentToSummarize);
        // const targetLanguage = isEnglish ? 'English' : 'Arabic';
        
        const detectPrimaryLanguage = (text) => {
            const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
            const english = (text.match(/[a-zA-Z]/g) || []).length;
            return arabic > english * 1.5 ? 'Arabic' : 'English';
        };

        const targetLanguage = detectPrimaryLanguage(note.content);
        const isEnglish = targetLanguage === 'English';

        let summary;
        try {
            if (!process.env.GOOGLE_GEMINI_API_KEY) {
                return next(new Error('Google Gemini API key not configured', { cause: 500 }));
            }

            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: {
                  temperature: 0.3,  //Reduce randomness
                  maxOutputTokens: 150 // Summary length
                }
            });

            const prompt = isEnglish 
                ? `
                    Summarize the following text in 3 short English sentences with:
                    - Focus only on the key ideas
                    - Avoid minor details
                    - Use clear and smooth language
                    Text:
                    ${contentToSummarize}
                `
            : `
                قم بتلخيص النص التالي في 3 جمل قصيرة باللغة العربية مع:
                - التركيز على الأفكار الرئيسية فقط
                - تجنب التفاصيل الفرعية
                - استخدام لغة واضحة وسلسة
                النص:
                ${contentToSummarize}
            `;

            const result = await model.generateContent(prompt);
            summary = result.response.text().replace(/\n+/g, ' ').trim(); // Remove newlines

        } catch (error) {
            console.error("OpenAI error", {
                message: geminiError.message,
                code: geminiError.code
            });
            const fallbackLength = Math.min(200, contentToSummarize.length);
            summary = contentToSummarize.substring(0, fallbackLength) + "..." + 
                ` [${targetLanguage} Summary - Service Unavailable]`;
        

            /////  Alternative solution if the summary fails
            // const fallbackSummary = contentToSummarize.length > 200
            //     ? contentToSummarize.substring(0, 200) + "..."
            //     : contentToSummarize;
            
            // summary = `${fallbackSummary} [Alternative Summary- ${geminiError.message}]`;
        
            }

        const updatedNote = await dbService.findByIdAndUpdate({
            model: notesModel,
            id: note._id,
            data: {
                summary,
                lastSummarizedAt: new Date(),
                previousSummaries: [
                    ...(note.previousSummaries || []),
                    {
                        summary: note.summary || `No previous summary`,
                        language: targetLanguage,
                        createdAt: note.updatedAt || note.createdAt
                    }
                ].slice(-5)  //save last 5 summaries
            }
        });

        return successResponse({
            res,
            message: `Successfully summarized in ${targetLanguage}`,
            status: 200,
            data: {
                currentSummary: summary,
                language: targetLanguage,
                previousSummaries: updatedNote.previousSummaries || [],
                originalLength: note.content.length,
                summarizedLength: contentToSummarize.length
            }
        });
    }
);


