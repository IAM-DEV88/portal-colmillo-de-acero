const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { path } = JSON.parse(event.body);
    if (!path) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Path is required' })
      };
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ralivarwsyunylsswbuk.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Increment view count
    const { error: incrementError } = await supabase
      .rpc('increment_view_count', { page_path: path });

    if (incrementError) throw incrementError;

    // Get current page views
    const { data: pageData, error: pageError } = await supabase
      .from('page_views')
      .select('view_count')
      .eq('page_path', path)
      .single();

    if (pageError) throw pageError;

    // Get total views across all pages
    const { data: allPages, error: allPagesError } = await supabase
      .from('page_views')
      .select('view_count');

    if (allPagesError) throw allPagesError;

    const totalViews = allPages.reduce((sum, page) => sum + (page.view_count || 0), 0);

    return {
      statusCode: 200,
      body: JSON.stringify({
        views: pageData?.view_count || 0,
        totalViews: totalViews
      })
    };

  } catch (error) {
    console.error('Error in track-view function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      })
    };
  }
};
