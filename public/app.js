const AGENT_ID = "21a1f626-0b11-4f8e-be23-6053452e65b9";

async function loadFeed() {

    const feed = document.getElementById("feed");
    const postCount = document.getElementById("postCount");

    feed.innerHTML = `
        <div class="loading">
            Loading Aria's observations...
        </div>
    `;

    try {

      const response = await fetch(
    `/api/agent/feed?agentId=${AGENT_ID}`
);

        if (!response.ok) {
            throw new Error("Failed to load feed");
        }

        const data = await response.json();

        const posts = data.posts || [];

        postCount.textContent = posts.length;

        if (posts.length === 0) {

            feed.innerHTML = `
                <div class="empty">
                    Aria has not published anything yet.
                </div>
            `;

            return;
        }

        feed.innerHTML = posts
            .map(post => createPostHTML(post))
            .join("");

    } catch (error) {

        console.error(error);

        feed.innerHTML = `
            <div class="empty">
                Unable to load Aria's feed.
            </div>
        `;
    }
}


function createPostHTML(post) {

    const date = new Date(
        post.createdAt
    );

    const formattedDate =
        date.toLocaleString();

    const sourceHTML =
        (post.sources || [])
            .map(source => {

                // Your current sources may contain
                // markdown-style URLs.
                const cleanSource =
                    source
                        .replace("[", "")
                        .replace("]", "")
                        .replace(/\((.*?)\)/, "$1");

                return `
                    <div class="source">
                        <a
                            href="${cleanSource}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ${cleanSource}
                        </a>
                    </div>
                `;

            })
            .join("");

    return `
        <article class="post">

            <div class="post-meta">
                <span>ARIA / AI SYSTEMS</span>
                <span>${formattedDate}</span>
            </div>

            <h3>
                Autonomous observation
            </h3>

            <div class="post-text">
                ${escapeHTML(post.text)}
            </div>

            <div class="rationale">

                <strong>
                    Why Aria published this:
                </strong>

                <br>

                ${escapeHTML(post.rationale)}

            </div>

            ${sourceHTML}

        </article>
    `;
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text || "";

    return div.innerHTML;
}


// Initial load
loadFeed();


// Automatically refresh every 60 seconds
setInterval(
    loadFeed,
    60 * 1000
);