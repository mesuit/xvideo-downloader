import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Search X videos
app.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "No query provided" });

  try {
    const response = await fetch(`https://apis.davidcyriltech.my.id/search/xvideo?text=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Fetch video info
app.get("/video", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No video URL provided" });

  try {
    const response = await fetch(`https://apis.davidcyriltech.my.id/xvideo?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

// **Download endpoint using external API**
app.get("/download", async (req, res) => {
  const { url, title } = req.query;
  if (!url || !title) return res.status(400).json({ error: "No URL or title provided" });

  try {
    // Call the external API to get the direct download link
    const apiResponse = await fetch(`https://apis-keith.vercel.app/download/porn?url=${encodeURIComponent(url)}`);
    const data = await apiResponse.json();

    if (!data || !data.result || !data.result.url) {
      throw new Error("Failed to get download link from external API");
    }

    const downloadUrl = data.result.url;

    // Stream the video to the user
    const videoResponse = await fetch(downloadUrl);
    if (!videoResponse.ok) throw new Error("Failed to fetch video from external URL");

    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
    res.setHeader("Content-Type", "video/mp4");
    videoResponse.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to download video" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
