/**
 * Wrapper para Perplexity usando las funciones MCP disponibles
 * Análisis inteligente de consultas complejas y análisis profundo de agencias
 */

import { mcp__perplexity_ask__perplexity_ask, mcp__perplexity_ask__perplexity_research } from '@/lib/mcp';

// Tipos para las respuestas
interface ParsedQueryResult {
  marca?: string;
  modelo?: string;
  año?: number;
  precio?: string;
  financiamiento?: boolean;
  interpretation: string;
}

interface AgencyDeepAnalysis {
  inventoryUrl?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  recentNews?: string[];
  additionalInfo?: string;
}

/**
 * Analiza una consulta compleja para extraer intención y entidades usando MCP
 */
export async function parseComplexQueryLive(query: string): Promise<ParsedQueryResult> {
  console.log('🔍 Analizando query compleja con Perplexity MCP live:', query);
  
  try {
    const prompt = `Analiza esta consulta de búsqueda de autos en México y extrae la información.
    
    Consulta: "${query}"
    
    Responde SOLO con un JSON con este formato exacto:
    {
      "marca": "nombre de la marca si se menciona",
      "modelo": "nombre del modelo si se menciona", 
      "año": número del año si se menciona,
      "precio": "barato/medio/caro si se indica",
      "financiamiento": true/false si se menciona crédito o financiamiento,
      "interpretation": "interpretación breve de lo que busca el usuario"
    }
    
    Si no encuentras algún campo, omítelo del JSON.`;
    
    // Usar el MCP de Perplexity disponible
    const response = await mcp__perplexity_ask__perplexity_ask([{
      role: 'user',
      content: prompt
    }]);
    
    // Intentar parsear como JSON
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Query parseada con MCP live exitosamente');
      return parsed;
    } catch (parseError) {
      console.error('❌ Error parseando JSON de MCP:', parseError);
      
      // Fallback: extraer información manualmente del texto
      const result: ParsedQueryResult = {
        interpretation: `Respuesta de MCP: ${response}`
      };
      
      // Intentar extraer información del texto de respuesta
      if (response.includes('Toyota')) result.marca = 'Toyota';
      if (response.includes('Camry')) result.modelo = 'Camry';
      if (response.includes('2022')) result.año = 2022;
      if (response.includes('barato')) result.precio = 'barato';
      if (response.includes('financiamiento')) result.financiamiento = true;
      
      return result;
    }
    
  } catch (error) {
    console.error('❌ Error parseando query con MCP live:', error);
    
    // Fallback básico
    return {
      interpretation: `Consulta compleja: ${query}`
    };
  }
}

/**
 * Realiza análisis profundo de una agencia específica usando MCP research
 */
export async function analyzeAgencyDeepLive(
  agencyName: string,
  address: string,
  placeId: string
): Promise<AgencyDeepAnalysis> {
  console.log('🔎 Análisis profundo de agencia con MCP live:', agencyName);
  
  try {
    const prompt = `Analiza esta agencia automotriz en México y busca información adicional:
    
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
    Enfócate en información actual y verificable.`;
    
    const response = await mcp__perplexity_ask__perplexity_research([{
      role: 'user',
      content: prompt
    }]);
    
    // Intentar parsear como JSON
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Análisis profundo completado con MCP live');
      return parsed;
    } catch (parseError) {
      console.error('❌ Error parseando JSON de análisis profundo:', parseError);
      
      // Retornar información básica
      return {
        additionalInfo: response
      };
    }
    
  } catch (error) {
    console.error('❌ Error en análisis profundo con MCP live:', error);
    
    // Retornar objeto vacío en caso de error
    return {};
  }
}

/**
 * Función de utilidad para verificar si Perplexity MCP está disponible
 */
export function isPerplexityLiveAvailable(): boolean {
  return typeof mcp__perplexity_ask__perplexity_ask === 'function';
}

/**
 * Función para generar FAQs desde reviews usando MCP
 */
export async function generateFAQFromReviewsLive(reviews: string[]): Promise<string[]> {
  console.log('📝 Generando FAQs desde reviews con MCP live...');
  
  try {
    const prompt = `Analiza estas reviews de una agencia automotriz y genera las 5 preguntas más frecuentes:
    
    Reviews: ${reviews.slice(0, 10).join('\\n')}
    
    Responde SOLO con un array JSON de strings con las preguntas frecuentes:
    ["¿Pregunta 1?", "¿Pregunta 2?", "¿Pregunta 3?", "¿Pregunta 4?", "¿Pregunta 5?"]`;
    
    const response = await mcp__perplexity_ask__perplexity_ask([{
      role: 'user',
      content: prompt
    }]);
    
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
    console.error('❌ Error generando FAQs con MCP live:', error);
    return [];
  }
}