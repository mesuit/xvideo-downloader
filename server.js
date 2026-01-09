const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// ==========================================
// 1. SEARCH ENDPOINT
// ==========================================
app.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "No query provided" });

  try {
    const response = await fetch(`https://apiskeith.vercel.app/search/searchxvideos?q=${encodeURIComponent(q)}`, { headers: HEADERS });
    const rawData = await response.json();

    let videoList = rawData.result || [];

    const cleanList = videoList.map(item => ({
        title: item.title,
        duration: item.duration,
        image: item.thumbnail, 
        thumbnail: item.thumbnail,
        url: item.url,
        link: item.url,
        quality: item.quality || "HD"
    }));

    res.json({ success: true, result: cleanList });

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// ==========================================
// 2. VIDEO DETAILS ENDPOINT (*** FIXED ***)
// ==========================================
app.get("/video", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No video URL provided" });

  try {
    console.log(`Fetching details for: ${url}`);
    const response = await fetch(`https://apiskeith.vercel.app/download/xvideos?url=${encodeURIComponent(url)}`, { headers: HEADERS });
    const data = await response.json();

    // 1. FIND THE VIDEO DATA
    // The API wraps it deeply: result -> data -> video_quality
    const innerData = data.result?.data || data.result || {};
    
    let videoUrl = "";

    // 2. EXTRACT LINK FROM 'video_quality' ARRAY
    if (innerData.video_quality && Array.isArray(innerData.video_quality)) {
        // Usually the array contains the video URL as a string, OR objects like {url: '...'}
        // We grab the last one as it's often the highest quality
        const lastItem = innerData.video_quality[innerData.video_quality.length - 1];
        videoUrl = lastItem.url || lastItem; 
    } else if (innerData.url) {
        videoUrl = innerData.url;
    }

    if (!videoUrl) {
        console.log("Still no link found. API Response:", JSON.stringify(data));
        return res.status(404).json({ error: "Video link not found in API" });
    }

    console.log("Success! Found video URL.");

    // 3. SEND TO FRONTEND (Using keys your frontend expects)
    res.json({
        success: true,
        title: innerData.title || "Video",
        download_url: videoUrl, // <--- Key fix: Matches your frontend code
        views: innerData.views || "N/A",
        image: innerData.image || ""
    });

  } catch (err) {
    console.error("Video Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

// ==========================================
// 3. DOWNLOAD PROXY
// ==========================================
app.get("/download", async (req, res) => {
  const { url, title } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    console.log(`Streaming: ${url}`);
    const videoResponse = await fetch(url, { headers: HEADERS });
    if (!videoResponse.ok) throw new Error("Failed to fetch video stream");

    const safeTitle = (title || "video").replace(/[^a-zA-Z0-9]/g, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    videoResponse.body.pipe(res);

  } catch (err) {
    console.error("Download Error:", err);
    res.redirect(url); // Fallback: If proxy fails, just redirect user to the link
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
