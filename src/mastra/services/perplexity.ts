/**
 * Wrapper para Perplexity API y OpenRouter
 * Análisis inteligente de consultas complejas y análisis profundo de agencias
 * Soporte para modelos de Perplexity y OpenRouter (Kimi K2, etc.)
 */

// Configuración de APIs
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Tipos para la respuesta de Perplexity
interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Realiza una consulta a Perplexity API o OpenRouter
 */
async function queryPerplexity(
  prompt: string,
  model: string = 'sonar-pro'
): Promise<string> {
  
  // Determinar si usar OpenRouter o Perplexity basado en el modelo
  const isOpenRouterModel = model.includes('kimi') || model.includes('openrouter/');
  
  if (isOpenRouterModel) {
    return await queryOpenRouter(prompt, model);
  } else {
    return await queryPerplexityDirect(prompt, model);
  }
}

/**
 * Consulta directa a Perplexity API
 */
async function queryPerplexityDirect(
  prompt: string,
  model: string = 'sonar-pro'
): Promise<string> {
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY no configurada');
  }
  
  console.log('🧠 Consultando Perplexity:', prompt.substring(0, 100) + '...');
  
  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }
    
    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    console.log(`✅ Respuesta de Perplexity (${data.usage.total_tokens} tokens)`);
    
    return content;
    
  } catch (error) {
    console.error('❌ Error consultando Perplexity:', error);
    throw error;
  }
}

/**
 * Consulta a OpenRouter API (para modelos como Kimi K2)
 */
async function queryOpenRouter(
  prompt: string,
  model: string = 'openrouter/auto'
): Promise<string> {
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY no configurada');
  }
  
  console.log('🌐 Consultando OpenRouter:', prompt.substring(0, 100) + '...');
  
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://karmatic.io', // Requerido por OpenRouter
        'X-Title': 'Karmatic Analysis System'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }
    
    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    console.log(`✅ Respuesta de OpenRouter (${data.usage?.total_tokens || 'N/A'} tokens)`);
    
    return content;
    
  } catch (error) {
    console.error('❌ Error consultando OpenRouter:', error);
    throw error;
  }
}

/**
 * Analiza una consulta compleja para extraer intención y entidades
 * TODO: Implementar cuando necesitemos fallback para queries complejas
 */
export async function parseComplexQuery(query: string): Promise<{
  marca?: string;
  modelo?: string;
  año?: number;
  precio?: string;
  financiamiento?: boolean;
  interpretation: string;
}> {
  
  console.log('🔍 Analizando query compleja con Perplexity:', query);
  
  const prompt = `
  Analiza esta consulta de búsqueda de autos en México y extrae la información:
  
  Consulta: "${query}"
  
  Responde SOLO con un JSON con este formato:
  {
    "marca": "nombre de la marca si se menciona",
    "modelo": "nombre del modelo si se menciona", 
    "año": número del año si se menciona,
    "precio": "barato/medio/caro si se indica",
    "financiamiento": true/false si se menciona crédito o financiamiento,
    "interpretation": "interpretación breve de lo que busca el usuario"
  }
  
  Si no encuentras algún campo, omítelo del JSON.
  `;
  
  try {
    // Usar el modelo óptimo para análisis complejo de queries
    const response = await queryPerplexity(prompt, getOptimalModel('query_parsing'));
    
    // Intentar parsear la respuesta como JSON
    const parsed = JSON.parse(response);
    
    return parsed;
    
  } catch (error) {
    console.error('❌ Error parseando query compleja:', error);
    
    // Fallback básico
    return {
      interpretation: `Consulta compleja: ${query}`
    };
  }
}

/**
 * Realiza análisis profundo de una agencia específica
 * Busca información adicional como inventario, redes sociales, noticias
 */
export async function analyzeAgencyDeep(
  agencyName: string,
  address: string,
  placeId: string
): Promise<{
  inventoryUrl?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  recentNews?: string[];
  additionalInfo?: string;
}> {
  
  console.log('🔎 Análisis profundo de agencia:', agencyName);
  
  const prompt = `
  Analiza esta agencia automotriz en México y busca información adicional:
  
  Agencia: ${agencyName}
  Dirección: ${address}
  
  Busca y responde SOLO con un JSON con este formato:
  {
    "inventoryUrl": "URL del inventario si la encuentras",
    "socialMedia": {
      "facebook": "URL de Facebook si existe",
      "instagram": "URL de Instagram si existe", 
      "website": "URL del sitio web oficial si existe"
    },
    "recentNews": ["noticia reciente 1", "noticia reciente 2"],
    "additionalInfo": "información adicional relevante encontrada"
  }
  
  Si no encuentras información, omite esos campos del JSON.
  Enfócate en información actual y verificable.
  `;
  
  try {
    // Usar el modelo óptimo para análisis profundo
    const response = await queryPerplexity(prompt, getOptimalModel('deep_analysis'));
    
    // Limpiar respuesta de markdown code blocks
    let cleanResponse = response;
    
    // Remover code blocks de markdown
    if (response.includes('```json')) {
      cleanResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
    } else if (response.includes('```')) {
      cleanResponse = response
        .replace(/```\s*/g, '')
        .trim();
    }
    
    // Intentar parsear la respuesta como JSON
    const parsed = JSON.parse(cleanResponse);
    
    console.log('✅ Análisis profundo completado');
    
    return parsed;
    
  } catch (error) {
    console.error('❌ Error en análisis profundo:', error);
    
    // Retornar objeto vacío en caso de error
    return {};
  }
}

/**
 * Genera un resumen de sentimientos rápido y económico
 * Usa el modelo más básico para análisis de sentimientos
 */
export async function analyzeSentimentQuick(reviews: string[]): Promise<{
  sentiment: 'positivo' | 'neutral' | 'negativo';
  confidence: number;
  summary: string;
}> {
  console.log('😊 Analizando sentimientos (modo rápido):', reviews.length, 'reviews');
  
  if (reviews.length === 0) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      summary: 'No hay reviews para analizar'
    };
  }
  
  try {
    const sampleReviews = reviews.slice(0, 10).join('\n');
    
    const prompt = `
    Analiza el sentimiento general de estas reviews de una agencia automotriz:
    
    Reviews: ${sampleReviews}
    
    Responde SOLO con un JSON:
    {
      "sentiment": "positivo/neutral/negativo",
      "confidence": número entre 0 y 1,
      "summary": "resumen breve del sentimiento general"
    }
    `;
    
    // Usar el modelo óptimo para análisis de sentimientos
    const response = await queryPerplexity(prompt, getOptimalModel('sentiment'));
    
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch (parseError) {
      console.error('❌ Error parseando análisis de sentimiento:', parseError);
      
      // Fallback básico
      const positiveCount = reviews.filter(r => 
        r.toLowerCase().includes('excelente') || 
        r.toLowerCase().includes('bueno') ||
        r.toLowerCase().includes('recomendo')
      ).length;
      
      const negativeCount = reviews.filter(r => 
        r.toLowerCase().includes('malo') || 
        r.toLowerCase().includes('fraude') ||
        r.toLowerCase().includes('estafa')
      ).length;
      
      if (positiveCount > negativeCount) {
        return { sentiment: 'positivo', confidence: 0.7, summary: 'Mayoría de reviews positivas' };
      } else if (negativeCount > positiveCount) {
        return { sentiment: 'negativo', confidence: 0.7, summary: 'Mayoría de reviews negativas' };
      } else {
        return { sentiment: 'neutral', confidence: 0.5, summary: 'Reviews mixtas' };
      }
    }
    
  } catch (error) {
    console.error('❌ Error en análisis de sentimiento:', error);
    return {
      sentiment: 'neutral',
      confidence: 0,
      summary: 'Error analizando sentimientos'
    };
  }
}

/**
 * Genera FAQs desde reviews usando modelo optimizado
 */
export async function generateFAQFromReviews(reviews: string[]): Promise<string[]> {
  console.log('📝 Generando FAQs desde reviews');
  
  if (reviews.length === 0) {
    return [];
  }
  
  try {
    const sampleReviews = reviews.slice(0, 15).join('\n');
    
    const prompt = `
    Analiza estas reviews de una agencia automotriz y genera 3 preguntas frecuentes:
    
    Reviews: ${sampleReviews}
    
    Responde SOLO con un array JSON:
    ["¿Pregunta 1?", "¿Pregunta 2?", "¿Pregunta 3?"]
    `;
    
    // Usar el modelo óptimo para generación de FAQs
    const response = await queryPerplexity(prompt, getOptimalModel('faq_generation'));
    
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (parseError) {
      console.error('❌ Error parseando FAQs:', parseError);
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error generando FAQs:', error);
    return [];
  }
}

/**
 * Función de utilidad para verificar si Perplexity está disponible
 */
export function isPerplexityAvailable(): boolean {
  return !!PERPLEXITY_API_KEY;
}

/**
 * Función de utilidad para verificar si OpenRouter está disponible
 */
export function isOpenRouterAvailable(): boolean {
  return !!OPENROUTER_API_KEY;
}

/**
 * Obtiene el mejor modelo disponible para cada tipo de tarea
 */
export function getOptimalModel(task: 'query_parsing' | 'deep_analysis' | 'sentiment' | 'faq_generation'): string {
  // Importar configuración
  const { DEEP_ANALYSIS_CONFIG } = require('../config/analysis.config');
  
  // Si es análisis profundo, usar el modelo configurado
  if (task === 'deep_analysis') {
    const configuredModel = DEEP_ANALYSIS_CONFIG.defaultModel;
    
    // Mapear nombres de modelos si es necesario
    if (configuredModel === 'kimi-k2') {
      return 'moonshotai/kimi-k2';
    }
    
    return configuredModel;
  }
  
  // Para otras tareas, usar lógica original
  switch (task) {
    case 'query_parsing':
      // Para análisis complejo de queries - usar Kimi K2 si está disponible
      if (isOpenRouterAvailable()) {
        return 'moonshot/moonshot-v1-32k'; // Kimi K2 - excelente para razonamiento
      }
      return 'sonar-reasoning-pro'; // Fallback a Perplexity
      
    case 'sentiment':
      // Para análisis de sentimientos - modelo más básico
      return 'sonar';
      
    case 'faq_generation':
      // Para generación de FAQs - sonar-pro balanceado
      return 'sonar-pro';
      
    default:
      return 'sonar-pro'; // Modelo por defecto
  }
}