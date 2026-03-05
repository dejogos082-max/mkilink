import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, update, push } from "firebase/database";
import nodemailer from "nodemailer";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Stripe Setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "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", {
  apiVersion: "2025-02-24.acacia" as any, // Cast to any to avoid TS error with future/beta versions
});

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  // IP Banning Middleware
  app.use(async (req, res, next) => {
    try {
      // Get client IP
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ipString = Array.isArray(clientIp) ? clientIp[0] : clientIp;
      
      if (ipString) {
        // Clean IP (remove ipv6 prefix if present for ipv4)
        const cleanIp = ipString.replace(/^::ffff:/, '');
        
        // Attach clean IP to request for later use
        (req as any).clientIp = cleanIp;

        const bannedIpsSnapshot = await get(ref(db, "banned_ips"));
        if (bannedIpsSnapshot.exists()) {
          const bannedIps = bannedIpsSnapshot.val();
          for (const key in bannedIps) {
            if (bannedIps[key].ip === cleanIp) {
              return res.status(403).send("Acesso negado. Seu IP foi banido.");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking banned IPs:", error);
    }
    next();
  });

  // Get Client IP Endpoint
  app.get("/api/ip", (req, res) => {
    res.json({ ip: (req as any).clientIp || "127.0.0.1" });
  });

  // GeoIP Endpoint
  app.get("/api/geo", async (req, res) => {
    try {
      let ip = (req as any).clientIp || req.ip;
      
      // Handle localhost/private IPs for testing
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
          // Try to get public IP if local
          try {
            const publicIpRes = await axios.get('https://api.ipify.org?format=json');
            ip = publicIpRes.data.ip;
          } catch (e) {
             return res.json({ country: 'Localhost', countryCode: 'LO' });
          }
      }

      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      if (response.data && response.data.status === 'success') {
          res.json({ 
              country: response.data.country, 
              countryCode: response.data.countryCode,
              city: response.data.city
          });
      } else {
          res.json({ country: 'Unknown', countryCode: 'UN' });
      }
    } catch (error) {
      console.error("GeoIP Error:", error);
      res.json({ country: 'Unknown', countryCode: 'UN' });
    }
  });

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

  // Admin Verification Endpoint
  app.post("/api/admin/verify-code", async (req, res) => {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: "Code and userId are required" });
    }

    try {
      // Check if code exists in database
      const codesSnapshot = await get(ref(db, "admin_codes"));
      let isValidCode = false;

      if (codesSnapshot.exists()) {
        const codesData = codesSnapshot.val();
        for (const key in codesData) {
          if (codesData[key].code === code) {
            isValidCode = true;
            break;
          }
        }
      }

      // Fallback to hardcoded code if no codes exist in DB yet
      if (!isValidCode) {
        return res.status(401).json({ error: "Invalid code" });
      }

      // Set admin role in Firebase Database
      await set(ref(db, `users/${userId}/role`), "AdminUser");
      
      res.json({ success: true, message: "Admin role granted" });
    } catch (error) {
      console.error("Admin Verification Error:", error);
      res.status(500).json({ error: "Failed to grant admin role" });
    }
  });

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

  // MFA Endpoints
  const mfaCodes = new Map<string, { code: string, expires: number }>();

  app.post("/api/mfa/send-code", async (req, res) => {
    return res.status(503).json({ error: "MFA is currently in maintenance mode" });
    /*
    const { userId, email } = req.body;
    if (!userId || !email) return res.status(400).json({ error: "Missing data" });

    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

      mfaCodes.set(userId, { code, expires });

      console.log(`[MFA] Code for ${email}: ${code}`);
      
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          await transporter.sendMail({
            from: `"MKI Links PRO" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Seu código de verificação - MKI Links PRO",
            text: `Seu código de verificação é: ${code}. Ele expira em 5 minutos.`,
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4f46e5;">Verificação de Segurança</h2>
                <p>Você está tentando fazer login no MKI Links PRO. Use o código abaixo para continuar:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">${code}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Este código expira em 5 minutos. Se você não solicitou este código, ignore este e-mail.</p>
              </div>
            `
          });
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
          // Continue anyway for development, but in production we might want to fail
        }
      }
      
      res.json({ success: true, message: "Code sent to email" });
    } catch (error) {
      console.error("MFA Send Error:", error);
      res.status(500).json({ error: "Failed to send MFA code" });
    }
    */
  });

  app.post("/api/mfa/verify-code", async (req, res) => {
    return res.status(503).json({ error: "MFA is currently in maintenance mode" });
    /*
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: "Missing data" });

    const stored = mfaCodes.get(userId);
    if (!stored) return res.status(401).json({ error: "No code found or expired" });

    if (Date.now() > stored.expires) {
      mfaCodes.delete(userId);
      return res.status(401).json({ error: "Code expired" });
    }

    if (stored.code === code) {
      mfaCodes.delete(userId);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid code" });
    }
    */
  });

  // hCaptcha Verification Endpoint
  app.post("/api/verify-hcaptcha", async (req, res) => {
    const { token } = req.body;
    const secret = process.env.HCAPTCHA_SECRET || "ES_e3e3c0fb840a4f05a81c290a712e1e18";

    // Bypass for AI Studio Preview if configured or if token is "mock-token"
    const origin = req.get('origin') || '';
    const isPreview = origin.includes('run.app') || origin.includes('localhost');

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
        // If in preview/dev environment and verification fails (likely due to domain mismatch), allow it.
        if (isPreview) {
            console.warn("hCaptcha verification failed but allowed in preview:", data["error-codes"]);
            return res.json({ success: true, warning: "Bypassed in preview" });
        }
        res.status(400).json({ success: false, error: data["error-codes"] });
      }
    } catch (error) {
      console.error("hCaptcha Verification Error:", error);
      // In preview, allow even on error to prevent blocking
      if (isPreview) {
          return res.json({ success: true, warning: "Bypassed on error in preview" });
      }
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  });

  // Log Login Endpoint
  app.post("/api/log-login", async (req, res) => {
    try {
      const { userId, userAgent, email } = req.body;
      const ip = (req as any).clientIp || "127.0.0.1";
      
      if (userId) {
        // Update user's main record with email and latest IP
        const updates: any = {
          lastIp: ip,
          lastLoginAt: Date.now()
        };
        if (email) updates.email = email;
        
        await update(ref(db, `users/${userId}`), updates);

        // Add to history
        const historyRef = ref(db, `users/${userId}/loginHistory`);
        await push(historyRef, {
          ip,
          timestamp: Date.now(),
          userAgent: userAgent || "Unknown",
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Log Login Error:", error);
      res.status(500).json({ error: "Failed to log login" });
    }
  });

  // Stripe Endpoints
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planId, userId, userEmail, successUrl, cancelUrl } = req.body;

      if (!planId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Map planId to Stripe Price ID
      // NOTE: You should replace these with your actual Stripe Price IDs
      // For now, we'll create ad-hoc prices or use test IDs
      let priceId;
      let productName;
      let amount; // in cents

      switch (planId) {
        case "premium":
          productName = "Workspace Premium";
          amount = 2900; // R$ 29.00
          break;
        case "business":
          productName = "Workspace Empresarial";
          amount = 9900; // R$ 99.00
          break;
        default:
          return res.status(400).json({ error: "Invalid plan ID" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: productName,
              },
              unit_amount: amount,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl || `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.origin}/checkout/cancel`,
        customer_email: userEmail,
        metadata: {
          userId: userId,
          planId: planId,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId) {
          console.log(`Payment successful for user ${userId} and plan ${planId}`);
          
          // Update user subscription in Firebase
          try {
            const subscriptionData = {
              planId: planId,
              status: "active",
              startDate: Date.now(),
              stripeSessionId: session.id,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            };
            
            await update(ref(db, `users/${userId}/subscription`), subscriptionData);
            await update(ref(db, `users/${userId}/profile`), { plan: planId }); // Update profile plan as well
          } catch (dbError) {
            console.error("Error updating Firebase after payment:", dbError);
          }
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
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
