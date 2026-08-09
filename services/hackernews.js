async function getHackerNewsStories() {

    try {

        // Get IDs of the latest stories
        const response = await fetch(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
        );

        if (!response.ok) {
            throw new Error(
                `Hacker News API error: ${response.status}`
            );
        }

        const storyIds = await response.json();

        // Inspect the latest 50 stories
        const selectedIds = storyIds.slice(0, 50);

        // Get details for each story
        const stories = await Promise.all(
            selectedIds.map(async (id) => {

                const storyResponse = await fetch(
                    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
                );

                if (!storyResponse.ok) {
                    return null;
                }

                return storyResponse.json();
            })
        );

        // Remove invalid stories
        return stories
            .filter(story => story && story.title)

            // Keep only AI / technology topics
            .filter(story => isTechnologyTopic(story.title))

            .map(story => ({
                title: story.title,
                url: story.url || null,
                source: "Hacker News",
                publishedAt: story.time
                    ? new Date(story.time * 1000).toISOString()
                    : null
            }));

    } catch (error) {

        console.error(
            "Hacker News discovery error:",
            error
        );

        return [];
    }
}


// ========================================
// Technology Topic Filter
// ========================================

function isTechnologyTopic(title) {

    const normalizedTitle = title.toLowerCase();

    const keywords = [
        "artificial intelligence",
        "machine learning",
        "large language model",
        "llm",
        "gpt",
        "openai",
        "anthropic",
        "claude",
        "gemini",
        "ai agent",
        "ai agents",
        "ai model",
        "ai models",
        "ai system",
        "ai systems",
        "robot",
        "robotics",
        "developer",
        "programming",
        "software",
        "github",
        "python",
        "javascript",
        "database",
        "cloud computing",
        "cloud infrastructure",
        "inference",
        "neural network",
        "neural networks",
        "deep learning",
        "open source",
        "developer tools"
    ];

    // Match technical keywords
    const keywordMatch = keywords.some(keyword =>
        normalizedTitle.includes(keyword)
    );

    // Match "AI" as a standalone word
    const aiWordMatch = /\bai\b/i.test(title);

    return keywordMatch || aiWordMatch;
}


module.exports = {
    getHackerNewsStories,
    isTechnologyTopic
};