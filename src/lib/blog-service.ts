import { createClient } from '@supabase/supabase-js';
import { RouletteService } from './roulette-service';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const groqApiKey = import.meta.env.GROQ_API_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: 'lore' | 'addons' | 'raids' | 'class-guide' | 'community';
  author: string;
  image_url: string;
  created_at: string;
  likes_count: number;
  is_hidden: boolean;
}

export class BlogService {
  /**
   * Genera un post usando Groq AI
   */
  static async generatePost(topic?: string, isTest: boolean = false): Promise<Partial<BlogPost>> {
    if (!groqApiKey) throw new Error('GROQ_API_KEY no configurada');

    // 1. Verificar límite diario (6 posts máx) si no es test
    if (!isTest) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error: countError } = await supabase
        .from('rd_blog_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (countError) throw countError;
      if (count !== null && count >= 6) {
        throw new Error('Límite diario de crónicas alcanzado (máx 6 por día)');
      }
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
      'la evolución del meta-juego: de simples talentos a Theorycrafting extremo'
    ];

    const narrativeStyles = [
      'Reportaje de investigación periodística',
      'Narración épica en primera persona (estilo diario)',
      'Análisis técnico con toques de humor negro',
      'Recopilación de curiosidades tipo "Sabías que..."',
      'Entrevista ficticia a un veterano de la versión 3.3.5',
      'Crónica de un evento histórico del juego',
      'Ensayo filosófico sobre la comunidad de Northrend'
    ];

    const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
    const randomStyle = narrativeStyles[Math.floor(Math.random() * narrativeStyles.length)];
    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `Actúa como un narrador legendario y experto cultural de World of Warcraft. 
    ${isTest ? 'ESTO ES UNA PRUEBA DE FORMATO. ' : ''}
    Tu misión es generar una crónica para el blog que sea FASCINANTE, ÚNICA y ROMPA CON LO CONVENCIONAL.
    
    TEMA: ${topic || randomTopic}
    ESTILO NARRATIVO OBLIGATORIO: ${randomStyle}
    SEMILLA DE VARIEDAD: ${randomSeed}

    REGLAS DE ORO PARA EVITAR LA MONOTONÍA:
    1. PROHIBIDO empezar con "En el vasto mundo de Azeroth..." o introducciones genéricas.
    2. ESTRUCTURA LIBRE: No sigas el esquema clásico de Introducción -> Secciones -> Conclusión. 
    3. Si el estilo es un reportaje, usa entrevistas o datos crudos. Si es un diario, usa emociones y descripciones vívidas.
    4. Usa un lenguaje que solo un jugador veterano entendería, pero con un estilo literario de alta calidad.
    5. Enfócate en el LADO HUMANO y CURIOSO del juego, no solo en mecánicas.

    REQUISITOS TÉCNICOS:
    1. Título: Magnético, diferente, que incite a hacer clic inmediatamente.
    2. Slug: URL amigable.
    3. Excerpt: Un gancho que deje al lector con ganas de más.
    4. Content: HTML profesional. Usa elementos variados (<blockquote> para citas, <b>, <ul>, <h2> solo si es necesario). El contenido debe ser extenso y absorbente.
    5. Categoría: Elige entre 'lore', 'addons', 'raids', 'class-guide', 'community'.
    
    RESPONDE ÚNICAMENTE EN FORMATO JSON:
    {
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "content": "...",
      "category": "..."
    }`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0, // Máxima creatividad para evitar patrones repetitivos
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error de Groq API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('La IA no devolvió ninguna respuesta válida.');
    }

    const content = JSON.parse(data.choices[0].message.content);
    
    return {
      ...content,
      author: 'Guía Colmillo',
      image_url: '/images/raids/default.jpg',
      created_at: new Date().toISOString(),
      is_hidden: false
    };
  }

  /**
   * Da o quita me gusta a un post y otorga recompensa (toggle)
   */
  static async likePost(postId: string, ip: string) {
    const ipHash = RouletteService.getIpHash(ip);
    const actionId = `blog_like_${postId}`;

    const { data: existingLike } = await supabase
      .from('rd_blog_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('ip_hash', ipHash)
      .single();

    if (existingLike) {
      await supabase.from('rd_blog_likes').delete().eq('id', existingLike.id);
      const { data: post } = await supabase.from('rd_blog_posts').select('likes_count').eq('id', postId).single();
      await supabase.from('rd_blog_posts').update({ likes_count: Math.max(0, (post?.likes_count || 1) - 1) }).eq('id', postId);
      return { success: true, liked: false };
    } else {
      await supabase.from('rd_blog_likes').insert([{ post_id: postId, ip_hash: ipHash }]);
      const { data: post } = await supabase.from('rd_blog_posts').select('likes_count').eq('id', postId).single();
      await supabase.from('rd_blog_posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', postId);
      
      const reward = await RouletteService.grantReward(ip, actionId, 1);
      return { success: true, liked: true, rewarded: reward.success };
    }
  }

  /**
   * Da o quita me gusta a un comentario y otorga recompensa (toggle)
   */
  static async likeComment(commentId: string, ip: string) {
    const ipHash = RouletteService.getIpHash(ip);
    const actionId = `blog_comment_like_${commentId}`;

    const { data: existingLike } = await supabase
      .from('rd_blog_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('ip_hash', ipHash)
      .single();

    if (existingLike) {
      await supabase.from('rd_blog_comment_likes').delete().eq('id', existingLike.id);
      const { data: comment } = await supabase.from('rd_blog_comments').select('likes_count').eq('id', commentId).single();
      await supabase.from('rd_blog_comments').update({ likes_count: Math.max(0, (comment?.likes_count || 1) - 1) }).eq('id', commentId);
      return { success: true, liked: false };
    } else {
      await supabase.from('rd_blog_comment_likes').insert([{ comment_id: commentId, ip_hash: ipHash }]);
      const { data: comment } = await supabase.from('rd_blog_comments').select('likes_count').eq('id', commentId).single();
      await supabase.from('rd_blog_comments').update({ likes_count: (comment?.likes_count || 0) + 1 }).eq('id', commentId);
      
      const reward = await RouletteService.grantReward(ip, actionId, 1);
      return { success: true, liked: true, rewarded: reward.success };
    }
  }
}
