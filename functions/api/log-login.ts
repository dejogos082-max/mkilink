import { getDatabase, ref, push, serverTimestamp } from "firebase/database";
import { initializeApp } from "firebase/app";

// Re-using the config from server.ts logic or environment variables
// Since this is a Cloudflare Function, we use `env`
export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { userId, ip, userAgent } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "UserId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Firebase (if not already done globally, but here we do it per request context usually or reuse)
    // Note: In CF Workers/Pages, we might need to use the REST API if the SDK has issues,
    // but the JS SDK often works. Let's try REST API for reliability and size.
    
    const firebaseDbUrl = env.VITE_FIREBASE_DATABASE_URL || "https://mkienterprise-default-rtdb.firebaseio.com";
    
    const logEntry = {
        ip: ip || request.headers.get("CF-Connecting-IP") || "unknown",
        userAgent: userAgent || request.headers.get("User-Agent") || "unknown",
        timestamp: Date.now() // serverTimestamp() is for SDK, here we use Date.now()
    };

    // REST API Push
    const response = await fetch(`${firebaseDbUrl}/users/${userId}/loginHistory.json`, {
        method: 'POST',
        body: JSON.stringify(logEntry),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        throw new Error("Failed to write to Firebase");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Login History Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
