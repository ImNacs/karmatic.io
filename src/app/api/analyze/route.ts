/**
 * Endpoint principal para análisis de agencias automotrices
 * Maneja las consultas de usuarios y retorna agencias con análisis de confianza
 * Versión simplificada para MVP - Fase 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseQuery } from '@/mastra/services/query-parser';
import { runAnalysisPipeline, getPipelineSummary } from '@/mastra/services/pipeline';
import { Location, ParsedQuery, AnalysisResponse, KarmaticError } from '@/mastra/types';

// Configuración del endpoint
const ENDPOINT_CONFIG = {
  // Límites de rate limiting (por ahora básico)
  maxRequestsPerMinute: 10,
  
  // Timeouts
  maxExecutionTime: 45000, // 45 segundos máximo
  
  // Validación de entrada
  maxQueryLength: 200,
  maxRadius: 50000, // 50km máximo
  
  // Configuración de cache
  cacheEnabled: true,
  cacheTTL: 3600 // 1 hora
};

/**
 * Interfaz para el request body
 */
interface AnalyzeRequest {
  query?: string | null;  // Query es opcional
  location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
  };
  options?: {
    radius?: number;
    maxResults?: number;
    includeDeepAnalysis?: boolean;
  };
}

/**
 * Función para validar el request
 */
function validateRequest(body: any): { isValid: boolean; error?: string } {
  // Validar query si existe
  if (body.query !== null && body.query !== undefined) {
    if (typeof body.query !== 'string') {
      return { isValid: false, error: 'Query debe ser string o null' };
    }
    
    if (body.query.length > ENDPOINT_CONFIG.maxQueryLength) {
      return { isValid: false, error: `Query demasiado largo (max ${ENDPOINT_CONFIG.maxQueryLength} caracteres)` };
    }
  }
  
  // Validar location
  if (!body.location || typeof body.location !== 'object') {
    return { isValid: false, error: 'Location es requerido' };
  }
  
  if (typeof body.location.lat !== 'number' || typeof body.location.lng !== 'number') {
    return { isValid: false, error: 'Coordenadas lat/lng son requeridas y deben ser números' };
  }
  
  // Validar rangos de coordenadas (México aproximadamente)
  if (body.location.lat < 14.5 || body.location.lat > 32.7 || 
      body.location.lng < -118.4 || body.location.lng > -86.7) {
    return { isValid: false, error: 'Coordenadas fuera del rango válido para México' };
  }
  
  // Validar opciones si existen
  if (body.options) {
    if (body.options.radius && (body.options.radius < 1000 || body.options.radius > ENDPOINT_CONFIG.maxRadius)) {
      return { isValid: false, error: `Radio inválido (min: 1000m, max: ${ENDPOINT_CONFIG.maxRadius}m)` };
    }
    
    if (body.options.maxResults && (body.options.maxResults < 1 || body.options.maxResults > 20)) {
      return { isValid: false, error: 'maxResults debe estar entre 1 y 20' };
    }
  }
  
  return { isValid: true };
}

/**
 * Función para crear respuesta de error
 */
function createErrorResponse(code: string, message: string, statusCode: number = 400): NextResponse {
  const error: KarmaticError = {
    code,
    message,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json({ error }, { status: statusCode });
}

/**
 * Handler principal para POST requests
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('🚀 Nueva solicitud de análisis recibida');
  
  try {
    // Parsear body
    let body: AnalyzeRequest;
    try {
      body = await request.json();
    } catch (error) {
      console.error('❌ Error parseando JSON:', error);
      return createErrorResponse('INVALID_JSON', 'Request body debe ser JSON válido');
    }
    
    // Validar request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      console.error('❌ Request inválido:', validation.error);
      return createErrorResponse('INVALID_REQUEST', validation.error!);
    }
    
    console.log('✅ Request validado:', {
      query: body.query,
      location: body.location,
      options: body.options
    });
    
    // Crear objetos para el pipeline
    const userLocation: Location = {
      lat: body.location.lat,
      lng: body.location.lng,
      address: body.location.address,
      city: body.location.city,
      state: body.location.state
    };
    
    // Parsear query del usuario
    console.log('🔍 Parseando query del usuario...');
    const parsedQuery: ParsedQuery = parseQuery(body.query || '', userLocation);
    
    console.log('✅ Query parseada:', {
      parseMethod: parsedQuery.parseMethod,
      marca: parsedQuery.marca,
      modelo: parsedQuery.modelo,
      año: parsedQuery.año,
      precio: parsedQuery.precio,
      financiamiento: parsedQuery.financiamiento
    });
    
    // Ejecutar pipeline de análisis
    console.log('🔄 Ejecutando pipeline de análisis...');
    const pipelineResult = await runAnalysisPipeline(parsedQuery, userLocation);
    
    // Crear respuesta
    const response: AnalysisResponse = {
      query: parsedQuery,
      agencies: pipelineResult.agencies,
      searchMetadata: {
        totalFound: pipelineResult.metadata.totalAgenciesFound,
        totalAnalyzed: pipelineResult.metadata.totalProcessed,
        executionTime: Date.now() - startTime,
        fromCache: false // TODO: Implementar cache
      },
      timestamp: new Date().toISOString()
    };
    
    // Log de resultados
    console.log('✅ Análisis completado:', {
      totalAgencies: response.agencies.length,
      executionTime: response.searchMetadata.executionTime,
      topTrustScore: response.agencies[0]?.trustAnalysis.trustScore || 0,
      summary: getPipelineSummary(pipelineResult)
    });
    
    // Retornar respuesta
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Determinar tipo de error
    if (error instanceof Error) {
      // Log detallado del error
      console.error('Tipo de error:', error.name);
      console.error('Mensaje de error:', error.message);
      
      if (error.message.includes('API')) {
        return createErrorResponse('API_ERROR', 'Error en API externa', 502);
      }
      
      if (error.message.includes('timeout')) {
        return createErrorResponse('TIMEOUT', 'Análisis tardó demasiado tiempo', 504);
      }
      
      if (error.message.includes('agencias')) {
        return createErrorResponse('NO_AGENCIES', 'No se encontraron agencias en la zona', 404);
      }
    }
    
    // Error genérico
    return createErrorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}

/**
 * Handler para GET requests - información del endpoint
 */
export async function GET(request: NextRequest) {
  const info = {
    name: 'Karmatic Analysis API',
    version: '1.0.0',
    description: 'API para análisis de agencias automotrices con scoring de confianza',
    phase: 'MVP Fase 1',
    endpoints: {
      analyze: {
        method: 'POST',
        description: 'Analiza agencias automotrices basado en query y ubicación',
        parameters: {
          query: 'string (requerido) - Consulta de búsqueda',
          location: 'object (requerido) - Coordenadas lat/lng',
          options: 'object (opcional) - Opciones adicionales'
        }
      }
    },
    limits: {
      maxQueryLength: ENDPOINT_CONFIG.maxQueryLength,
      maxRadius: ENDPOINT_CONFIG.maxRadius,
      maxExecutionTime: ENDPOINT_CONFIG.maxExecutionTime
    },
    features: {
      queryParsing: 'Reconocimiento de marca/modelo/año/precio',
      trustScoring: 'Análisis anti-fraude basado en reviews',
      geoSearch: 'Búsqueda geográfica con Google Places',
      reviewAnalysis: 'Análisis completo de reviews con Apify',
      deepAnalysis: 'Análisis profundo con Perplexity (top agencias)'
    }
  };
  
  return NextResponse.json(info, { status: 200 });
}

/**
 * Handler para OPTIONS requests (CORS)
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}