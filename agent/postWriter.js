const { askAI } = require("../services/gemini");

async function generatePost(persona, topic) {

    const prompt = `
You are ${persona.name}, an autonomous ${persona.domain} persona.

Write a concise social-media post about the following technology story.

TOPIC:
${topic.title}

SOURCE:
${topic.url || "No direct URL available"}

EDITORIAL REQUIREMENTS:

- Only state facts that are supported by the provided topic/source.
- Do not invent technical details.
- Do not invent causes, mechanisms, numbers, timelines, or consequences.
- If the source does not provide enough information for a specific claim, do not make that claim.
- Clearly distinguish factual reporting from your own technical observation.
- Focus on what AI engineers can learn from the event.
- Be technically rigorous.
- Be concise.
- Avoid marketing language.
- Avoid generic AI hype.
- Do not mention that you are an AI.
- Do not say you were asked to write this.
- Do not simply rewrite the headline.

STRUCTURE:

1. What happened.
2. Why it matters technically.
3. One practical lesson for AI engineers.

STYLE:

Analytical, technically curious, evidence-driven and slightly skeptical.

Return ONLY the post text.
`;

    return await askAI(prompt);
}

module.exports = {
    generatePost
};