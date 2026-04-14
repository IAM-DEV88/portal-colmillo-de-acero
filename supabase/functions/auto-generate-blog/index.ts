import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // 1. CONFIGURACIÓN DE VARIABLES
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const DISCORD_WEBHOOK = Deno.env.get('DISCORD_PUBLIC_WEBHOOK_URL');
    const SITE_URL = "https://colmillo.netlify.app"; 

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 2. VERIFICACIÓN DE LÍMITE DIARIO (Máx 2 por día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('rd_blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('author', 'Guía Colmillo')
      .gte('created_at', today.toISOString());

    if (countError) throw countError;
    
    if (count !== null && count >= 2) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Límite diario de publicaciones alcanzado (máx 2 por día).' 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const trendingTopics = [
      'el incidente de la Sangre Corrupta: la primera pandemia virtual',
      'jugadores reales que se convirtieron en NPCs de WoW',
      'la historia detrás de Leeroy Jenkins y su impacto cultural',
      'el funeral virtual saboteado: uno de los momentos más polémicos de WoW',
      'misterios sin resolver en los archivos de la versión 3.3.5',
      'la economía real de los Gold Farmers en la era de WotLK',
      'servidores privados vs oficiales: la lucha eterna por el 3.3.5',
      'el jugador que alcanzó nivel máximo sin salir de la zona de inicio',
      'mitos urbanos de Rasganorte que resultaron ser ciertos',
      'la evolución del meta-juego: de simples talentos a Theorycrafting extremo',
      'la misteriosa Isla de los Programadores: el easter egg más difícil de alcanzar',
      'por qué Ulduar es considerada la mejor banda de toda la historia de WoW',
      'el impacto de los addons en el equilibrio del juego: ¿comodidad o ventaja injusta?',
      'la tragedia de Arthas Menethil: ¿un héroe caído o un villano inevitable?',
      'el mercado negro de monturas raras: lo que los jugadores están dispuestos a pagar',
      'historias de amor y amistad que nacieron en las tabernas de Ventormenta y Orgrimmar',
      'cómo el parche 3.3.5 cambió para siempre la forma de jugar clases híbridas',
      'los jefes de banda que nunca llegaron al juego final pero están en el código',
      'el arte de la "Ninja Loot": anécdotas de los robos más legendarios en raids',
      'la comunidad de rol en WoW: cómo mantienen viva la inmersión en servidores privados'
    ];

    const narrativeStyles = [
      'Reportaje de investigación periodística',
      'Análisis técnico con toques de humor negro',
      'Recopilación de curiosidades tipo "Sabías que..."',
      'Crónica de un evento histórico del juego',
      'Ensayo filosófico sobre la comunidad de Northrend',
      'Manual de supervivencia para un recluta novato',
      'Leyenda susurrada por un anciano en una taberna de Dalaran',
      'Debate acalorado entre dos expertos en theorycrafting',
      'Poema épico o balada sobre un héroe olvidado',
      'Documento "filtrado" de los archivos de la Ciudadela de la Corona de Hielo'
    ];

    const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
    const randomStyle = narrativeStyles[Math.floor(Math.random() * narrativeStyles.length)];
    const randomSeed = Math.random().toString(36).substring(7);

    // 3. GENERACIÓN CON GROQ (LLAMA 3.3 70B)
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', 
        messages: [
          {
            role: 'system',
            content: `Actúa como un experto cultural de World of Warcraft. 
    Tu misión es generar una publicación para el blog que sea FASCINANTE, ÚNICA y ROMPA CON LO CONVENCIONAL. 
     
    TEMA: ${randomTopic}
    ESTILO NARRATIVO OBLIGATORIO: ${randomStyle}
    SEMILLA DE VARIEDAD: ${randomSeed}

    REGLAS DE ORO PARA EVITAR LA MONOTONÍA:
    1. PROHIBIDO empezar con "En el vasto mundo de Azeroth..." o introducciones genéricas.
    2. ESTRUCTURA LIBRE: No sigas el esquema clásico de Introducción -> Secciones -> Conclusión. 
    3. Si el estilo es un reportaje, usa entrevistas o datos crudos. Si es un debate, usa diferentes puntos de vista.
    4. Usa un lenguaje que solo un jugador veterano entendería (menciona ítems, hechizos, zonas específicas), pero con un estilo literario de alta calidad.
    5. Enfócate en el LADO HUMANO, lo bizarro y lo CURIOSO del juego. 
    6. EVITA el tono condescendiente. Habla como un veterano a otro.
    7. No uses más de 3 párrafos de la misma longitud seguidos. Rompe el ritmo.

    REQUISITOS TÉCNICOS:
    1. Título: Magnético, diferente, que incite a hacer clic inmediatamente.
    2. Slug: URL amigable.
    3. Excerpt: Un gancho que deje al lector con ganas de más.
    4. Content: HTML profesional. Usa elementos variados (<blockquote> para citas, <b>, <ul>, <h2> solo si es necesario). El contenido debe ser extenso, absorbente y visualmente dinámico.
    5. Categoría: Elige entre 'lore', 'addons', 'raids', 'class-guide', 'community'.
    6. Nuestra comunidad juega en la versión 3.3.5a (WotLK).
     
    RESPONDE ÚNICAMENTE EN FORMATO JSON:
    {
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "content": "...",
      "category": "..."
    }`
          },
          { role: 'user', content: 'Genera la crónica ahora.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 1.0
      })
    });

    const aiData = await aiResponse.json();
    const content = JSON.parse(aiData.choices[0].message.content);

    const validCategories = ['lore', 'addons', 'raids', 'class-guide', 'community'];
    const catKey = validCategories.includes(content.category) ? content.category : 'community';

    // 4. INSERCIÓN EN LA TABLA CORRECTA (rd_blog_posts)
    const postToInsert = {
      ...content,
      category: catKey,
      author: 'Guía Colmillo',
      image_url: '/images/raids/default.jpg',
      is_hidden: false,
      created_at: new Date().toISOString()
    };

    const { data: insertedData, error: dbError } = await supabase
      .from('rd_blog_posts')
      .insert([postToInsert])
      .select()
      .single();

    if (dbError) throw dbError;

    // 5. NOTIFICACIÓN CENTRALIZADA EN DISCORD
    if (DISCORD_WEBHOOK && insertedData) {
      const categoryEmoji = { lore: '📜', addons: '🔧', raids: '⚔️', 'class-guide': '📖', community: '🤝' };
      const emoji = categoryEmoji[insertedData.category] || '📰';
      const postUrl = `${SITE_URL}/blog/${insertedData.slug}`;

      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Guía Colmillo",
          avatar_url: `${SITE_URL}/images/logo.png`,
          content: "📢 **¡Nueva publicación!**",
          embeds: [{
            title: `${emoji} NUEVA PUBLICACION: ${insertedData.title}`,
            description: `${insertedData.excerpt}\n\n[**【 Leer publicación Completa 】**](${postUrl})\n\n¡Pásate por el blog y deja tu comentario!`,
            url: postUrl,
            color: 0xF59E0B, // Ámbar
            image: { url: `${SITE_URL}${insertedData.image_url}` },
            footer: { text: "Portal Web Colmillo de Acero • Blog", icon_url: `${SITE_URL}/images/logo.png` },
            timestamp: new Date().toISOString()
          }]
        })
      });
    }

    return new Response(JSON.stringify({ success: true, post: insertedData }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
})
