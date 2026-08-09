const express = require("express");
const crypto = require("crypto");

const {
    startAgent
} = require("../agent/autonomousAgent");

const db = require("../database/database");

const router = express.Router();


// =====================================================
// INITIALIZE AGENT
// POST /api/agent/init
// =====================================================

router.post("/init", (req, res) => {

    try {

        const { persona } = req.body;


        // Validate persona
        if (!persona) {

            return res.status(400).json({
                error: "Persona is required"
            });

        }


        if (!persona.name || !persona.domain) {

            return res.status(400).json({
                error: "Persona name and domain are required"
            });

        }


        // Generate unique agent ID
        const agentId = crypto.randomUUID();

        const createdAt = new Date().toISOString();


        // Create agent
        const insertAgent = db.prepare(`
            INSERT INTO agents (
                id,
                name,
                domain,
                created_at,
                active
            )
            VALUES (?, ?, ?, ?, ?)
        `);


        insertAgent.run(
            agentId,
            persona.name,
            persona.domain,
            createdAt,
            1
        );


        // Start autonomous agent
        startAgent(agentId);


        console.log(
            "Agent initialized:",
            {
                id: agentId,
                name: persona.name,
                domain: persona.domain,
                createdAt
            }
        );


        return res.status(200).json({
            agentId
        });


    } catch (error) {

        console.error(
            "Agent initialization error:",
            error
        );


        return res.status(500).json({
            error: "Failed to initialize agent"
        });

    }

});




router.get("/feed", (req, res) => {

    try {

        const { agentId } = req.query;


        // Validate agentId
        if (!agentId) {

            return res.status(400).json({
                error: "agentId is required"
            });

        }


        // Check agent exists
        const agent = db.prepare(`
            SELECT id
            FROM agents
            WHERE id = ?
        `).get(agentId);


        if (!agent) {

            return res.status(404).json({
                error: "Agent not found"
            });

        }


        // Get all posts newest first
        const posts = db.prepare(`
            SELECT
                id,
                created_at,
                text,
                rationale,
                sources
            FROM posts
            WHERE agent_id = ?
            ORDER BY created_at DESC
        `).all(agentId);


        // Convert DB format to API format
        const formattedPosts = posts.map(post => {

            let sources = [];

            try {

                sources = JSON.parse(post.sources || "[]");

            } catch (error) {

                sources = [];

            }


            return {
                id: post.id,
                createdAt: post.created_at,
                text: post.text,
                rationale: post.rationale,
                sources
            };

        });


        return res.status(200).json({
            posts: formattedPosts
        });


    } catch (error) {

        console.error(
            "Feed error:",
            error
        );


        return res.status(500).json({
            error: "Failed to retrieve feed"
        });

    }

});


module.exports = router;