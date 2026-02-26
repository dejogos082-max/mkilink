export const onRequestGet = async (context: any) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const linkId = url.searchParams.get("linkId");

    if (!linkId) {
      return new Response(JSON.stringify({ error: "LinkId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const SECRET_KEY = env.JWT_SECRET || "your-secret-key-change-this";

    // Rate Limiting (Basic IP check)
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    
    // Generate Token
    const timestamp = Date.now();
    const payload = `${linkId}|${timestamp}|${ip}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const key = await crypto.subtle.importKey(
      "raw", 
      keyData, 
      { name: "HMAC", hash: "SHA-256" }, 
      false, 
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC", 
      key, 
      encoder.encode(payload)
    );
    
    // Convert signature to hex
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const token = btoa(JSON.stringify({ linkId, timestamp, ip, sig: hashHex }));

    return new Response(JSON.stringify({ token }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Token Generation Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
