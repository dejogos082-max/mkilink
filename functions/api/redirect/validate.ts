export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const SECRET_KEY = env.JWT_SECRET || "your-secret-key-change-this";

    // Decode Token
    const decoded = JSON.parse(atob(token));
    const { linkId, timestamp, ip, sig } = decoded;
    
    // 1. Verify IP
    const currentIp = request.headers.get("CF-Connecting-IP") || "unknown";
    if (ip !== "unknown" && currentIp !== "unknown" && ip !== currentIp) {
        console.warn(`IP mismatch: ${ip} vs ${currentIp}`);
    }

    // 2. Verify Timestamp (Anti-Bypass)
    const now = Date.now();
    const elapsed = now - timestamp;
    if (elapsed < 3000) { // Minimum 3 seconds
        return new Response(JSON.stringify({ error: "Too fast! Please wait for the countdown." }), {
            status: 429,
            headers: { "Content-Type": "application/json" }
        });
    }
    
    if (elapsed > 3600000) { // Expire after 1 hour
        return new Response(JSON.stringify({ error: "Token expired" }), {
            status: 410,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 3. Verify Signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const key = await crypto.subtle.importKey(
      "raw", 
      keyData, 
      { name: "HMAC", hash: "SHA-256" }, 
      false, 
      ["verify"]
    );
    
    const payload = `${linkId}|${timestamp}|${ip}`;
    const signatureBytes = new Uint8Array(sig.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));
    
    const isValid = await crypto.subtle.verify(
      "HMAC", 
      key, 
      signatureBytes, 
      encoder.encode(payload)
    );

    if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        });
    }

    // 4. Fetch Real URL from Firebase
    const firebaseDbUrl = env.VITE_FIREBASE_DATABASE_URL || "https://mkienterprise-default-rtdb.firebaseio.com";
    const linkRes = await fetch(`${firebaseDbUrl}/short_links/${linkId}.json`);
    const linkData = await linkRes.json();

    if (!linkData || !linkData.originalUrl) {
        return new Response(JSON.stringify({ error: "Link not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ url: linkData.originalUrl }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Token Validation Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
