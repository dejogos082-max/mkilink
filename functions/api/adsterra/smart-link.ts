export async function onRequestGet(context: any) {
  const { env } = context;
  const apiKey = env.ADSTERRA_API_KEY || "ea82811a47ef05494e248828de87b519";

  try {
    const response = await fetch("https://api3.adsterratools.com/publisher/smart-links.json", {
      headers: {
        "X-API-Key": apiKey,
      },
    });
    
    const data: any = await response.json();
    const items = data?.data?.items || [];
    const activeLink = items.find((item: any) => item.status === 'Active' || item.status === 3);
    
    if (activeLink) {
      return new Response(JSON.stringify({ url: activeLink.url }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "No active smart link found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
