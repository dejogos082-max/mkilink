export async function onRequestPost(context: any) {
  const { request, env } = context;
  const { token } = await request.json();
  const secret = env.HCAPTCHA_SECRET || "ES_e3e3c0fb840a4f05a81c290a712e1e18";

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: "Token is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    
    const response = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data: any = await response.json();
    if (data.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: data["error-codes"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
