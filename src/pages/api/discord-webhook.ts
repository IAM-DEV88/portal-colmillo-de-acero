export const prerender = false;

export const POST = async ({ request, url }) => {
  const type = url.searchParams.get('type');
  
  let webhookUrl;
  if (type === 'public') {
    webhookUrl = import.meta.env.DISCORD_PUBLIC_WEBHOOK_URL;
  } else {
    // Default or 'admin' / 'private'
    webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
  }

  if (!webhookUrl) {
    console.error(`Webhook URL not configured for type: ${type}`);
    return new Response(JSON.stringify({ error: 'Server Webhook URL not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const contentType = request.headers.get('content-type') || '';

  try {
    let response;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const outboundFormData = new FormData();
      
      for (const [key, value] of formData.entries()) {
        outboundFormData.append(key, value);
      }
      
      response = await fetch(webhookUrl, {
        method: 'POST',
        body: outboundFormData
      });
    } else {
       return new Response(JSON.stringify({ error: "Unsupported content type" }), { 
         status: 400,
         headers: { 'Content-Type': 'application/json' }
       });
    }

    if (!response.ok) {
        const text = await response.text();
        console.error(`Discord API Error (${response.status}):`, text);
        return new Response(JSON.stringify({ error: `Discord API Error: ${text}` }), { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error('Proxy Error:', e);
    return new Response(JSON.stringify({ error: e.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
};
