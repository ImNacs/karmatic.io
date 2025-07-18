/**
 * Motor de confianza para análisis anti-fraude de agencias automotrices
 * Versión simplificada para MVP - Fase 1
 */

import { Review, TrustAnalysis } from '../types';

// Palabras clave que indican problemas de fraude o malas prácticas
const FRAUD_KEYWORDS = [
  // Fraude directo
  'fraude', 'estafa', 'robo', 'robaron', 'timadores', 'ladrones',
  
  // Prácticas deshonestas
  'engañan', 'engaño', 'mienten', 'mentira', 'mentirosos', 'tramposos',
  'ocultan', 'esconden', 'no dicen', 'no mencionan',
  
  // Problemas financieros
  'cobros ocultos', 'cobros extras', 'comisiones ocultas', 'cargos extras',
  'no respetan precio', 'cambian precio', 'precio diferente',
  
  // Problemas con documentos
  'papeles falsos', 'documentos falsos', 'sin factura', 'factura falsa',
  'no dan factura', 'problemas legales', 'sin papeles',
  
  // Problemas con vehículos
  'carros chocados', 'accidentados', 'golpeados', 'inundados',
  'kilometraje alterado', 'odómetro alterado', 'no funciona',
  
  // Servicio pésimo
  'pésimo servicio', 'terrible servicio', 'muy mal servicio',
  'no recomiendo', 'no vayan', 'eviten este lugar',
  
  // Problemas post-venta
  'no responden', 'no contestan', 'no se hacen responsables',
  'no dan garantía', 'no respetan garantía', 'abandonan clientes'
];

// Palabras clave que indican buenas prácticas y confianza
const TRUST_KEYWORDS = [
  // Honestidad
  'honestos', 'honestidad', 'transparentes', 'transparencia', 'claros',
  'sinceros', 'confiables', 'responsables', 'serios', 'formales',
  
  // Servicio excelente
  'excelente servicio', 'muy buen servicio', 'servicio increíble',
  'súper recomendado', 'altamente recomendado', 'los mejores',
  
  // Procesos claros
  'precios justos', 'sin sorpresas', 'todo claro', 'explicaron todo',
  'proceso transparente', 'sin cobros extras', 'precio real',
  
  // Post-venta
  'siempre responden', 'atienden bien', 'se hacen responsables',
  'cumplen garantía', 'apoyan después', 'seguimiento',
  
  // Profesionalismo
  'profesionales', 'expertos', 'conocen bien', 'experiencia',
  'papeles en orden', 'todo legal', 'factura correcta'
];

// Palabras que indican respuesta del negocio a quejas
const RESPONSE_INDICATORS = [
  'respuesta del propietario', 'response from owner', 'respuesta de',
  'comentario del negocio', 'el negocio respondió', 'management response'
];

/**
 * Calcula el porcentaje de reviews positivas (4-5 estrellas)
 */
function calculatePositiveReviewsPercent(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  
  const positiveReviews = reviews.filter(review => review.rating >= 4);
  return Math.round((positiveReviews.length / reviews.length) * 100);
}

/**
 * Cuenta palabras clave de fraude en las reviews
 */
function countFraudKeywords(reviews: Review[]): number {
  let fraudCount = 0;
  
  reviews.forEach(review => {
    // Validar que el texto existe antes de procesarlo
    if (!review.text) return;
    
    const reviewText = review.text.toLowerCase();
    
    FRAUD_KEYWORDS.forEach(keyword => {
      if (reviewText.includes(keyword)) {
        fraudCount++;
      }
    });
  });
  
  return fraudCount;
}

/**
 * Cuenta palabras clave de confianza en las reviews
 */
function countTrustKeywords(reviews: Review[]): number {
  let trustCount = 0;
  
  reviews.forEach(review => {
    // Validar que el texto existe antes de procesarlo
    if (!review.text) return;
    
    const reviewText = review.text.toLowerCase();
    
    TRUST_KEYWORDS.forEach(keyword => {
      if (reviewText.includes(keyword)) {
        trustCount++;
      }
    });
  });
  
  return trustCount;
}

/**
 * Calcula el porcentaje de quejas que recibieron respuesta
 */
function calculateResponseRate(reviews: Review[]): number {
  // Considerar reviews negativas (1-2 estrellas) como quejas
  const complaints = reviews.filter(review => review.rating <= 2);
  
  if (complaints.length === 0) return 100; // Sin quejas = 100%
  
  const respondedComplaints = complaints.filter(review => review.response);
  
  return Math.round((respondedComplaints.length / complaints.length) * 100);
}

/**
 * Detecta patrones sospechosos en los ratings
 */
function detectRatingPattern(reviews: Review[]): 'natural' | 'sospechoso' {
  if (reviews.length < 10) return 'natural'; // Muy pocas reviews para detectar patrón
  
  const ratings = reviews.map(r => r.rating);
  const ratingCounts = [0, 0, 0, 0, 0, 0]; // Índices 0-5 para ratings 0-5
  
  ratings.forEach(rating => {
    ratingCounts[rating]++;
  });
  
  // Detectar si hay demasiados 5s y muy pocos 2-4 (patrón de reviews falsas)
  const fiveStarPercent = (ratingCounts[5] / reviews.length) * 100;
  const middleRatingsPercent = ((ratingCounts[2] + ratingCounts[3] + ratingCounts[4]) / reviews.length) * 100;
  
  // Sospechoso si >80% son 5 estrellas y <10% son ratings medios
  if (fiveStarPercent > 80 && middleRatingsPercent < 10) {
    return 'sospechoso';
  }
  
  return 'natural';
}

/**
 * Genera red flags basadas en el análisis
 */
function generateRedFlags(
  fraudKeywords: number,
  responseRate: number,
  ratingPattern: 'natural' | 'sospechoso',
  positivePercent: number
): string[] {
  const redFlags: string[] = [];
  
  if (fraudKeywords > 5) {
    redFlags.push(`${fraudKeywords} menciones de fraude o estafa detectadas`);
  }
  
  if (responseRate < 30) {
    redFlags.push(`Solo ${responseRate}% de quejas reciben respuesta`);
  }
  
  if (ratingPattern === 'sospechoso') {
    redFlags.push('Patrón sospechoso en ratings (posibles reviews falsas)');
  }
  
  if (positivePercent < 40) {
    redFlags.push(`Solo ${positivePercent}% de reviews son positivas`);
  }
  
  return redFlags;
}

/**
 * Genera green flags basadas en el análisis
 */
function generateGreenFlags(
  trustKeywords: number,
  responseRate: number,
  ratingPattern: 'natural' | 'sospechoso',
  positivePercent: number
): string[] {
  const greenFlags: string[] = [];
  
  if (trustKeywords > 10) {
    greenFlags.push(`${trustKeywords} menciones de honestidad y transparencia`);
  }
  
  if (responseRate > 70) {
    greenFlags.push(`${responseRate}% de quejas reciben respuesta del negocio`);
  }
  
  if (ratingPattern === 'natural') {
    greenFlags.push('Patrón natural en ratings (reviews auténticas)');
  }
  
  if (positivePercent > 80) {
    greenFlags.push(`${positivePercent}% de reviews son positivas`);
  }
  
  return greenFlags;
}

/**
 * Calcula el trust score principal (0-100)
 */
function calculateTrustScore(
  positivePercent: number,
  fraudKeywords: number,
  responseRate: number,
  ratingPattern: 'natural' | 'sospechoso'
): number {
  let score = 0;
  
  // Base score del porcentaje de reviews positivas (40% del total)
  score += (positivePercent / 100) * 40;
  
  // Penalizar por palabras clave de fraude (30% del total)
  const fraudPenalty = Math.min(fraudKeywords * 3, 30); // Max 30 puntos de penalización
  score += 30 - fraudPenalty;
  
  // Bonificar por tasa de respuesta (20% del total)
  score += (responseRate / 100) * 20;
  
  // Bonificar por patrón natural (10% del total)
  score += ratingPattern === 'natural' ? 10 : 0;
  
  // Asegurar que esté entre 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determina el nivel de confianza basado en el score
 */
function determineTrustLevel(score: number): 'muy_alta' | 'alta' | 'media' | 'baja' | 'muy_baja' {
  if (score >= 85) return 'muy_alta';
  if (score >= 70) return 'alta';
  if (score >= 55) return 'media';
  if (score >= 40) return 'baja';
  return 'muy_baja';
}

/**
 * Función principal que analiza las reviews y genera el trust analysis
 */
export function analyzeTrust(reviews: Review[]): TrustAnalysis {
  console.log(`🔍 Analizando confianza de ${reviews.length} reviews...`);
  
  // Calcular métricas básicas
  const positiveReviewsPercent = calculatePositiveReviewsPercent(reviews);
  const fraudKeywordsCount = countFraudKeywords(reviews);
  const trustKeywordsCount = countTrustKeywords(reviews);
  const responseRate = calculateResponseRate(reviews);
  const ratingPattern = detectRatingPattern(reviews);
  
  // Calcular trust score
  const trustScore = calculateTrustScore(
    positiveReviewsPercent,
    fraudKeywordsCount,
    responseRate,
    ratingPattern
  );
  
  // Determinar nivel de confianza
  const trustLevel = determineTrustLevel(trustScore);
  
  // Generar flags
  const redFlags = generateRedFlags(fraudKeywordsCount, responseRate, ratingPattern, positiveReviewsPercent);
  const greenFlags = generateGreenFlags(trustKeywordsCount, responseRate, ratingPattern, positiveReviewsPercent);
  
  const result: TrustAnalysis = {
    trustScore,
    trustLevel,
    metrics: {
      positiveReviewsPercent,
      fraudKeywordsCount,
      responseRate,
      ratingPattern
    },
    redFlags,
    greenFlags
  };
  
  console.log(`✅ Trust analysis completado:`, {
    trustScore,
    trustLevel,
    redFlags: redFlags.length,
    greenFlags: greenFlags.length
  });
  
  return result;
}

/**
 * Función de utilidad para obtener un resumen rápido del trust level
 */
export function getTrustSummary(trustAnalysis: TrustAnalysis): string {
  const { trustScore, trustLevel, redFlags, greenFlags } = trustAnalysis;
  
  const levelMessages = {
    muy_alta: '🟢 Confianza muy alta',
    alta: '🟢 Confianza alta',
    media: '🟡 Confianza media',
    baja: '🟠 Confianza baja',
    muy_baja: '🔴 Confianza muy baja'
  };
  
  return `${levelMessages[trustLevel]} (${trustScore}/100) - ${redFlags.length} alertas, ${greenFlags.length} señales positivas`;
}