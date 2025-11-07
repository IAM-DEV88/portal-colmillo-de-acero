// This file is no longer needed as we've moved the functionality to the client-side
// Keeping it as a placeholder to avoid breaking existing links

export async function post() {
  return new Response(JSON.stringify({
    message: 'This endpoint is deprecated. View counting is now handled client-side.',
    view_count: 0,
    total_views: 0
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}