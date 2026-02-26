import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Firebase configuration for backend
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBa006o6OBOXNMrJldG7FPa4TbM9GwN46M",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "mkienterprise.firebaseapp.com",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://mkienterprise-default-rtdb.firebaseio.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "mkienterprise",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "mkienterprise.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "973675247017",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:973675247017:web:3688020a7eac993f3140b8",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json()); // Parse JSON bodies

  // Helper to get R2 Config from Firebase
  async function getR2Config() {
    try {
      const snapshot = await get(ref(db, 'settings/r2'));
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (error) {
      console.error("Error fetching R2 config from Firebase:", error);
    }
    
    // Fallback to env if Firebase fails or doesn't have data
    return {
      accountId: process.env.R2_ACCOUNT_ID || "7b6b27d12265ebd16b19f2cf1577f778",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "ae5477fee595912616a3848650c63367",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "c51ff85d500d69a6bf123243400e26f8b03d2a7f400cc8b507a2448f5dbdcc1c",
      bucketName: process.env.R2_BUCKET_NAME || "mkibucket",
      publicUrl: "https://cloud.ironvalecraft.shop"
    };
  }

  // Generate Presigned URL for Upload
  app.post("/api/upload-url", async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      if (!filename || !contentType) {
        return res.status(400).json({ error: "Filename and contentType are required" });
      }

      const config = await getR2Config();
      
      const R2 = new S3Client({
        region: "auto",
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });

      const key = `uploads/${Date.now()}-${filename}`;
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: contentType,
      });

      // Generate the presigned URL
      const url = await getSignedUrl(R2, command, { expiresIn: 3600 });
      const publicUrl = `${config.publicUrl}/${key}`;

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
