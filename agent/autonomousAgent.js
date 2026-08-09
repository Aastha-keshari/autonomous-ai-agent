const crypto = require("crypto");

const {
    getHackerNewsStories
} = require("../services/hackernews");

const {
    evaluateTopics
} = require("./editorialJudge");

const {
    generatePost
} = require("./postWriter");

const db = require("../database/database");

// =====================================================
// AUTONOMOUS AGENT CONFIGURATION
// =====================================================

// Agent timers
const runningAgents = new Map();

// Run every 2 hours
const INTERVAL = 2 * 60 * 60 * 1000;

// =====================================================
// RUN ONE AUTONOMOUS CYCLE
// =====================================================

async function runAgentCycle(agentId) {

    try {

        console.log(
            `[Agent ${agentId}] Starting autonomous cycle`
        );

        // =================================================
        // 1. GET AGENT
        // =================================================

        const agent = db.prepare(`
            SELECT
                id,
                name,
                domain,
                active
            FROM agents
            WHERE id = ?
        `).get(agentId);

        if (!agent) {

            console.log(
                `[Agent ${agentId}] Agent not found`
            );

            return;
        }

        if (!agent.active) {

            console.log(
                `[Agent ${agentId}] Agent inactive`
            );

            return;
        }

        // =================================================
        // 2. DISCOVER LIVE TOPICS
        // =================================================

        const topics = await getHackerNewsStories();

        console.log(
            `[Agent ${agentId}] Discovered ${topics.length} topics`
        );

        if (!topics || topics.length === 0) {

            console.log(
                `[Agent ${agentId}] No topics discovered`
            );

            return;
        }

        // =================================================
        // 3. LOAD MEMORY
        // =================================================

        const previousPosts = db.prepare(`
            SELECT
                text,
                topic,
                created_at
            FROM posts
            WHERE agent_id = ?
            ORDER BY created_at DESC
            LIMIT 30
        `).all(agentId);

        console.log(
            `[Agent ${agentId}] Loaded ${previousPosts.length} previous posts as memory`
        );

        // =================================================
        // 4. EDITORIAL JUDGMENT
        // =================================================

        const evaluation = await evaluateTopics(
            {
                name: agent.name,
                domain: agent.domain
            },
            topics,
            previousPosts
        );

        // Safety check
        if (
            !evaluation ||
            !Array.isArray(evaluation.decisions)
        ) {

            console.log(
                `[Agent ${agentId}] Invalid editorial evaluation`
            );

            return;
        }

        

        const publishable = evaluation.decisions.filter(
            item =>
                item &&
                item.decision === "PUBLISH" &&
                Number(item.score) >= 75
        );

        console.log(
            `[Agent ${agentId}] ${publishable.length} topics passed editorial threshold`
        );

        if (publishable.length === 0) {

            console.log(
                `[Agent ${agentId}] No topic met publishing threshold`
            );

            return;
        }

        
        publishable.sort(
            (a, b) =>
                Number(b.score) - Number(a.score)
        );

       

        let selectedDecision = null;
        let selectedTopic = null;

        for (const decision of publishable) {

            const topic = topics.find(
                item =>
                    item.title === decision.topic
            );

            if (!topic) {
                continue;
            }

            

            const existingPost = db.prepare(`
                SELECT id
                FROM posts
                WHERE agent_id = ?
                AND topic = ?
                LIMIT 1
            `).get(
                agentId,
                topic.title
            );

            if (existingPost) {

                console.log(
                    `[Agent ${agentId}] Skipping previously published topic: ${topic.title}`
                );

                continue;
            }

            selectedDecision = decision;
            selectedTopic = topic;

            break;
        }

        

        if (!selectedTopic) {

            console.log(
                `[Agent ${agentId}] All publishable topics were already published`
            );

            return;
        }

        console.log(
            `[Agent ${agentId}] Selected topic: ${selectedTopic.title}`
        );

        console.log(
            `[Agent ${agentId}] Editorial score: ${selectedDecision.score}`
        );

       

        const text = await generatePost(
            {
                name: agent.name,
                domain: agent.domain
            },
            selectedTopic
        );

        if (!text || !text.trim()) {

            console.log(
                `[Agent ${agentId}] AI generated an empty post`
            );

            return;
        }

        
        const rationale =
            `${selectedDecision.reason} ` +
            `This topic is relevant now because ` +
            `${selectedDecision.whyNow}`;

        
        const postId = crypto.randomUUID();

        // Always store UTC ISO timestamp
        const createdAt =
            new Date().toISOString();

        

        const sources =
            selectedTopic.url
                ? [selectedTopic.url]
                : [];

       

        db.prepare(`
            INSERT INTO posts (
                id,
                agent_id,
                topic,
                text,
                rationale,
                sources,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            postId,
            agentId,
            selectedTopic.title,
            text.trim(),
            rationale,
            JSON.stringify(sources),
            createdAt
        );

        

        console.log(
            `[Agent ${agentId}] Published: ${selectedTopic.title}`
        );

        console.log(
            `[Agent ${agentId}] Score: ${selectedDecision.score}`
        );

        console.log(
            `[Agent ${agentId}] Post ID: ${postId}`
        );

    } catch (error) {

        console.error(
            `[Agent ${agentId}] Autonomous cycle failed:`,
            error
        );
    }
}



function startAgent(agentId) {

    // Prevent duplicate timers
    if (runningAgents.has(agentId)) {

        console.log(
            `[Agent ${agentId}] Already running`
        );

        return;
    }

    console.log(
        `[Agent ${agentId}] Starting autonomous agent`
    );

    

    runAgentCycle(agentId);

   

    const interval = setInterval(
        () => {

            runAgentCycle(agentId);

        },
        INTERVAL
    );

    // Store timer
    runningAgents.set(
        agentId,
        interval
    );

    console.log(
        `[Agent ${agentId}] Next autonomous cycle in 2 hours`
    );
}



function stopAgent(agentId) {

    const interval =
        runningAgents.get(agentId);

    if (!interval) {

        console.log(
            `[Agent ${agentId}] No running agent found`
        );

        return;
    }

    clearInterval(interval);

    runningAgents.delete(agentId);

    console.log(
        `[Agent ${agentId}] Autonomous agent stopped`
    );
}


module.exports = {
    startAgent,
    stopAgent,
    runAgentCycle
};