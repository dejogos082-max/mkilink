export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { code, userId } = body;
    const ADMIN_CODE = "362136";

    if (!code || !userId) {
      return new Response(JSON.stringify({ error: "Code and userId are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (code !== ADMIN_CODE) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update Firebase
    const firebaseDbUrl = env.VITE_FIREBASE_DATABASE_URL || "https://mkienterprise-default-rtdb.firebaseio.com";
    
    // Using REST API to update role
    const updateRes = await fetch(`${firebaseDbUrl}/users/${userId}/role.json`, {
        method: 'PUT',
        body: JSON.stringify("AdminUser"),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!updateRes.ok) {
        throw new Error("Failed to update Firebase");
    }

    return new Response(JSON.stringify({ success: true, message: "Admin role granted" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Admin Verification Error:", error);
    return new Response(JSON.stringify({ error: `Failed to grant admin role: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
