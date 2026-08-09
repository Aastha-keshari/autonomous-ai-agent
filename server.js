const express = require("express");
const cors = require("cors");
require("dotenv").config();

const agentRoutes = require("./routes/agentRoutes");

// Initialize database
const db = require("./database/database");

// Autonomous agent
const {
    startAgent
} = require("./agent/autonomousAgent");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// FRONTEND
// =====================================================

app.use(express.static("public"));


// =====================================================
// API ROUTES
// =====================================================

app.use("/api/agent", agentRoutes);


// =====================================================
// ROOT ROUTE
// =====================================================

app.get("/", (req, res) => {

    res.json({
        message: "Autonomous AI Agent is running"
    });

});


// =====================================================
// RESTORE ACTIVE AGENTS
// =====================================================

// If the Node server restarts,
// restart all agents that are marked active
// in the database.

const activeAgents = db.prepare(`
    SELECT id
    FROM agents
    WHERE active = 1
`).all();

activeAgents.forEach(agent => {

    console.log(
        `[Server] Restoring autonomous agent: ${agent.id}`
    );

    startAgent(agent.id);

});


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});