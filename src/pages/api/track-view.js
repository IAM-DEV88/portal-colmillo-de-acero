import { createClient } from '@supabase/supabase-js';

// Hardcoded for testing - replace with your actual values
const supabaseUrl = 'https://ralivarwsyunylsswbuk.supabase.co';
const supabaseAnonKey = 'your_supabase_anon_key_here';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function post({ request }) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return new Response(JSON.stringify({ error: 'Path is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Increment view count
    const { error: incrementError } = await supabase
      .rpc('increment_view_count', { page_path: path });

    if (incrementError) {
      console.error('Error incrementing view count:', incrementError);
    }

    // Get current page views
    const { data: pageData, error: pageError } = await supabase
      .from('page_views')
      .select('view_count')
      .eq('page_path', path)
      .single();

    if (pageError) {
      console.error('Error getting page views:', pageError);
      return new Response(JSON.stringify({ 
        error: 'Error getting page views',
        view_count: 0,
        total_views: 0
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Get total views across all pages
    const { data: allPages, error: allPagesError } = await supabase
      .from('page_views')
      .select('view_count');

    const totalViews = allPages?.reduce((sum, page) => sum + (page.view_count || 0), 0) || 0;

    return new Response(JSON.stringify({
      view_count: pageData?.view_count || 0,
      total_views: totalViews
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-view:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      view_count: 0,
      total_views: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}