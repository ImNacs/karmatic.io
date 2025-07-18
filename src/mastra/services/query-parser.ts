/**
 * Parser de consultas de usuario para búsquedas automotrices
 * Versión simplificada con reglas básicas + fallback a Perplexity
 */

import { ParsedQuery, Location } from '../types';

// Marcas de autos más comunes en México
const MARCAS_CONOCIDAS = [
  'nissan', 'toyota', 'honda', 'mazda', 'ford', 'chevrolet', 'gmc',
  'hyundai', 'kia', 'volkswagen', 'audi', 'bmw', 'mercedes', 'volvo',
  'jeep', 'dodge', 'ram', 'chrysler', 'mitsubishi', 'suzuki', 'subaru',
  'infiniti', 'lexus', 'acura', 'cadillac', 'lincoln', 'buick',
  'peugeot', 'renault', 'fiat', 'alfa', 'mini', 'porsche', 'jaguar',
  'land rover', 'tesla', 'byd', 'mg', 'chery', 'geely', 'haval'
];

// Modelos comunes (lista básica)
const MODELOS_CONOCIDOS = [
  'sentra', 'versa', 'altima', 'rogue', 'murano', 'pathfinder', 'titan',
  'corolla', 'camry', 'rav4', 'highlander', 'tacoma', 'tundra', 'prius',
  'civic', 'accord', 'crv', 'hrv', 'pilot', 'ridgeline',
  'cx3', 'cx5', 'cx9', 'mazda3', 'mazda6',
  'focus', 'fiesta', 'fusion', 'escape', 'explorer', 'f150', 'ranger',
  'spark', 'aveo', 'cruze', 'malibu', 'equinox', 'traverse', 'tahoe', 'silverado'
];

// Palabras clave para precio
const PRECIO_KEYWORDS = {
  barato: ['barato', 'económico', 'accesible', 'low cost', 'bajo costo'],
  medio: ['medio', 'intermedio', 'promedio', 'estándar'],
  caro: ['caro', 'premium', 'lujo', 'alta gama', 'expensive']
};

// Palabras clave para financiamiento
const FINANCIAMIENTO_KEYWORDS = [
  'crédito', 'financiamiento', 'a crédito', 'financiado', 'mensualidades',
  'enganche', 'plan de pagos', 'apartado', 'abono'
];

/**
 * Extrae año de la consulta (2010-2025)
 */
function extractYear(query: string): number | undefined {
  const yearMatch = query.match(/\b(20[1-2][0-9]|2025)\b/);
  return yearMatch ? parseInt(yearMatch[1]) : undefined;
}

/**
 * Extrae marca del vehículo
 */
function extractMarca(query: string): string | undefined {
  const queryLower = query.toLowerCase();
  
  for (const marca of MARCAS_CONOCIDAS) {
    // Buscar marca completa o como parte de palabra
    const regex = new RegExp(`\\b${marca}\\b`, 'i');
    if (regex.test(queryLower)) {
      return marca;
    }
  }
  
  return undefined;
}

/**
 * Extrae modelo del vehículo
 */
function extractModelo(query: string): string | undefined {
  const queryLower = query.toLowerCase();
  
  for (const modelo of MODELOS_CONOCIDOS) {
    const regex = new RegExp(`\\b${modelo}\\b`, 'i');
    if (regex.test(queryLower)) {
      return modelo;
    }
  }
  
  return undefined;
}

/**
 * Extrae indicadores de precio
 */
function extractPrecio(query: string): 'barato' | 'medio' | 'caro' | undefined {
  const queryLower = query.toLowerCase();
  
  for (const [categoria, keywords] of Object.entries(PRECIO_KEYWORDS)) {
    for (const keyword of keywords) {
      if (queryLower.includes(keyword)) {
        return categoria as 'barato' | 'medio' | 'caro';
      }
    }
  }
  
  return undefined;
}

/**
 * Detecta si necesita financiamiento
 */
function extractFinanciamiento(query: string): boolean {
  const queryLower = query.toLowerCase();
  
  return FINANCIAMIENTO_KEYWORDS.some(keyword => 
    queryLower.includes(keyword)
  );
}

/**
 * Parser principal usando reglas básicas
 */
export function parseQuery(query: string, location: Location): ParsedQuery {
  console.log('🔍 Parseando query:', query);
  
  // Extraer información usando reglas
  const marca = extractMarca(query);
  const modelo = extractModelo(query);
  const año = extractYear(query);
  const precio = extractPrecio(query);
  const financiamiento = extractFinanciamiento(query);
  
  // Determinar método de parseo
  const hasExtractedInfo = marca || modelo || año || precio || financiamiento;
  const parseMethod = hasExtractedInfo ? 'regex' : 'fallback';
  
  const result: ParsedQuery = {
    originalQuery: query,
    marca,
    modelo,
    año,
    precio,
    financiamiento,
    location,
    parseMethod
  };
  
  console.log('✅ Query parseada:', {
    marca,
    modelo,
    año,
    precio,
    financiamiento,
    parseMethod
  });
  
  return result;
}

/**
 * TODO: Implementar fallback con Perplexity para queries complejas
 * Por ahora retornamos la query original si no se puede parsear
 */
export async function parseComplexQuery(query: string, location: Location): Promise<ParsedQuery> {
  console.log('🧠 Query compleja detectada, usando fallback básico');
  
  // Fallback simple por ahora
  return {
    originalQuery: query,
    location,
    parseMethod: 'fallback'
  };
}

/**
 * Función principal que decide qué parser usar
 */
export async function parseUserQuery(query: string, location: Location): Promise<ParsedQuery> {
  try {
    // Intentar parser con reglas primero
    const basicParsed = parseQuery(query, location);
    
    // Si no extrajo nada significativo, usar fallback
    if (basicParsed.parseMethod === 'fallback') {
      return await parseComplexQuery(query, location);
    }
    
    return basicParsed;
    
  } catch (error) {
    console.error('❌ Error parseando query:', error);
    
    // Retornar estructura básica en caso de error
    return {
      originalQuery: query,
      location,
      parseMethod: 'fallback'
    };
  }
}