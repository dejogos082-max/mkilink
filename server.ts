import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json()); // Parse JSON bodies

  // R2 S3 Client
  const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });

  // Generate Presigned URL for Upload
  app.post("/api/upload-url", async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) {
        return res.status(400).json({ error: "Filename and contentType are required" });
      }

      const key = `uploads/${Date.now()}-${filename}`;
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(R2, command, { expiresIn: 3600 });
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      res.json({ uploadUrl: url, publicUrl });
    } catch (error) {
      console.error("R2 Presigned URL Error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // API Proxy for Adsterra
  app.get("/api/adsterra/smart-link", async (req, res) => {
    try {
      const response = await axios.get(
        "https://api3.adsterratools.com/publisher/smart-links.json",
        {
          headers: {
            "X-API-Key": process.env.ADSTERRA_API_KEY || "ea82811a47ef05494e248828de87b519",
          },
        }
      );
      
      // Find the first active smart link
      // The API response structure based on docs: { data: { items: [...] } }
      const items = response.data?.data?.items || [];
      const activeLink = items.find((item: any) => item.status === 'Active' || item.status === 3); // 3 is Active per docs
      
      if (activeLink) {
        res.json({ url: activeLink.url });
      } else {
        res.status(404).json({ error: "No active smart link found" });
      }
    } catch (error) {
      console.error("Adsterra API Error:", error);
      res.status(500).json({ error: "Failed to fetch smart link" });
    }
  });

  // hCaptcha Verification Endpoint
  app.post("/api/verify-hcaptcha", async (req, res) => {
    const { token } = req.body;
    const secret = process.env.HCAPTCHA_SECRET || "ES_e3e3c0fb840a4f05a81c290a712e1e18";

    if (!token) {
      return res.status(400).json({ success: false, error: "Token is required" });
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', secret);
      params.append('response', token);
      
      const response = await axios.post(
        "https://api.hcaptcha.com/siteverify",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const data = response.data;
      if (data.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: data["error-codes"] });
      }
    } catch (error) {
      console.error("hCaptcha Verification Error:", error);
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
