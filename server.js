const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// In CommonJS, __dirname is globally available, so we don't need the URL workaround
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// 1. SEARCH ENDPOINT
app.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "No query provided" });

  try {
    const response = await fetch(`https://apis.davidcyriltech.my.id/search/xvideo?text=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// 2. VIDEO DETAILS ENDPOINT
app.get("/video", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No video URL provided" });

  try {
    const response = await fetch(`https://apis.davidcyriltech.my.id/xvideo?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Video Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

// 3. DOWNLOAD PROXY ENDPOINT
app.get("/download", async (req, res) => {
  const { url, title } = req.query;
  if (!url || !title) return res.status(400).json({ error: "No URL or title provided" });

  try {
    // Get direct stream link
    const apiResponse = await fetch(`https://apis-keith.vercel.app/download/porn?url=${encodeURIComponent(url)}`);
    const data = await apiResponse.json();

    if (!data || !data.result || !data.result.url) {
      throw new Error("Failed to get download link from external API");
    }

    const downloadUrl = data.result.url;

    // Stream content to client
    const videoResponse = await fetch(downloadUrl);
    if (!videoResponse.ok) throw new Error("Failed to fetch video stream");

    // Sanitize title
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "_");

    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    videoResponse.body.pipe(res);
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({ error: "Failed to download video" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
