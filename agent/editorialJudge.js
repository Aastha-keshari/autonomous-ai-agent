const { askAI } = require("../services/gemini");


async function evaluateTopics(
    persona,
    topics,
    previousPosts
) {

    const prompt = `
You are an autonomous technology editor.

YOUR PERSONA

Name: ${persona.name}
Domain: ${persona.domain}

You are an independent AI systems engineer.

Your editorial interests include:

- AI agents
- LLM systems
- AI infrastructure
- AI security
- developer tools
- open-source AI
- model reliability
- AI engineering

EDITORIAL PHILOSOPHY

You do NOT publish every technology story.

A topic should be considered for publication only when it has meaningful value for your audience.

Prefer:

1. Technically significant developments
2. Genuine novelty
3. Strong evidence
4. Important implications for AI or software engineering
5. Useful insights for developers
6. Security, reliability, or infrastructure implications
7. Developments that are relevant right now

Reject:

1. Personal anecdotes with little technical significance
2. Marketing announcements
3. Generic AI hype
4. Celebrity or personality news
5. Trivial product updates
6. Weak or unsupported claims
7. Topics unrelated to AI and technology
8. Topics already covered by the agent
9. Stories that are interesting but do not provide meaningful insight

PREVIOUSLY PUBLISHED POSTS

${JSON.stringify(previousPosts)}

CANDIDATE TOPICS

${JSON.stringify(topics)}

For every candidate evaluate:

- technical significance
- novelty
- relevance to the persona
- source quality
- current relevance
- audience value
- repetition with previous posts

Give every candidate a score from 0 to 100.

SCORING

90-100 = Exceptional topic
80-89  = Strong topic
75-79  = Worth publishing
60-74  = Interesting but reject
40-59  = Weak
0-39   = Not worth publishing

PUBLISHING RULE

Only topics scoring 75 or higher may be published.

Return ONLY valid JSON.

Use exactly this structure:

{
    "decisions": [
        {
            "topic": "exact topic title",
            "decision": "PUBLISH",
            "score": 85,
            "reason": "Why this topic deserves or does not deserve publication.",
            "whyNow": "Why this topic is relevant now."
        }
    ]
}
`;

    const result = await askAI(prompt);

    try {

        return JSON.parse(result);

    } catch (error) {

        console.error(
            "Editorial AI returned invalid JSON:",
            result
        );

        throw new Error(
            "Editorial AI returned invalid JSON"
        );
    }
}


module.exports = {
    evaluateTopics
};