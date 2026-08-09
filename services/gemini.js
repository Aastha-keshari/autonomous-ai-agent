const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite"
});

async function askAI(prompt) {

    try {

        const result = await model.generateContent(prompt);

        const response = result.response;

        return response.text();

    } catch (error) {

        console.error(
            "Gemini API error:",
            error
        );

        throw error;
    }
}

module.exports = {
    askAI
};