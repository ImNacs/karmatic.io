/**
 * Motor de confianza para análisis anti-fraude de agencias automotrices
 * Versión simplificada para MVP - Fase 1
 */

import { Review, TrustAnalysis } from '../types';

// Tipos para las métricas adicionales
export interface ReviewMetrics {
  processedReviewsCount: number;
  averageRatingSample: number | null;
  ratingDistributionSample: { 1: number; 2: number; 3: number; 4: number; 5: number };
  karmaScoreSample: number | null;
  responseRatePercentage: number;
  newestReviewDateSample: string | null;
  oldestReviewDateSample: string | null;
  reviewFrequencySample: string | null;
  reviewFrequencyCategory: 'Muy Activa' | 'Activa' | 'Moderada' | 'Baja' | 'Inactiva' | 'No Determinada';
  avgDaysBetweenReviews: number | null;
  daysSinceLastReview: number | null;
  avgReviewsPerMonth: number | null;
}

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
 * Función principal que analiza las reviews y genera el trust analysis con métricas extendidas
 */
export function analyzeTrustWithMetrics(reviews: Review[]): {
  trustAnalysis: TrustAnalysis;
  reviewMetrics: ReviewMetrics;
} {
  console.log(`🔍 Analizando confianza de ${reviews.length} reviews...`);
  
  // Calcular métricas detalladas
  const reviewMetrics = calculateReviewMetrics(reviews);
  
  // Calcular métricas básicas de trust
  const positiveReviewsPercent = calculatePositiveReviewsPercent(reviews);
  const fraudKeywordsCount = countFraudKeywords(reviews);
  const trustKeywordsCount = countTrustKeywords(reviews);
  const responseRate = calculateResponseRate(reviews);
  const ratingPattern = detectRatingPattern(reviews);
  
  // Calcular trust score mejorado usando Karma Score si está disponible
  let trustScore = calculateTrustScore(
    positiveReviewsPercent,
    fraudKeywordsCount,
    responseRate,
    ratingPattern
  );
  
  // Ajustar trust score con Karma Score si está disponible
  if (reviewMetrics.karmaScoreSample !== null) {
    // Ponderar 20% del Karma Score en el trust score final
    trustScore = Math.round(trustScore * 0.8 + reviewMetrics.karmaScoreSample * 0.2);
  }
  
  // Determinar nivel de confianza
  const trustLevel = determineTrustLevel(trustScore);
  
  // Generar flags mejoradas con métricas adicionales
  const redFlags = generateRedFlags(fraudKeywordsCount, responseRate, ratingPattern, positiveReviewsPercent);
  const greenFlags = generateGreenFlags(trustKeywordsCount, responseRate, ratingPattern, positiveReviewsPercent);
  
  // Agregar flags basadas en frecuencia
  if (reviewMetrics.reviewFrequencyCategory === 'Inactiva' && reviewMetrics.daysSinceLastReview !== null && reviewMetrics.daysSinceLastReview > 180) {
    redFlags.push(`Agencia inactiva: ${reviewMetrics.daysSinceLastReview} días sin reseñas`);
  }
  
  if (reviewMetrics.reviewFrequencyCategory === 'Muy Activa' && reviewMetrics.avgReviewsPerMonth !== null && reviewMetrics.avgReviewsPerMonth > 10) {
    greenFlags.push(`Agencia muy activa: ${reviewMetrics.avgReviewsPerMonth} reseñas por mes`);
  }
  
  const trustAnalysis: TrustAnalysis = {
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
    karmaScore: reviewMetrics.karmaScoreSample,
    frequency: reviewMetrics.reviewFrequencyCategory,
    redFlags: redFlags.length,
    greenFlags: greenFlags.length
  });
  
  return { trustAnalysis, reviewMetrics };
}

/**
 * Función principal que analiza las reviews y genera el trust analysis (versión simplificada para compatibilidad)
 */
export function analyzeTrust(reviews: Review[]): TrustAnalysis {
  const { trustAnalysis } = analyzeTrustWithMetrics(reviews);
  return trustAnalysis;
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

/**
 * Calcula el Karma Score basado en la distribución de ratings
 * Usa pesos: 1⭐ = -4, 2⭐ = -2, 3⭐ = 0, 4⭐ = +1, 5⭐ = +2
 */
function calculateKarmaScore(ratingDistribution: { [key: number]: number }): number | null {
  const weights = { 1: -4, 2: -2, 3: 0, 4: +1, 5: +2 };
  
  // Calcular total de reseñas
  const totalReviews = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  
  if (totalReviews === 0) {
    return null;
  }
  
  // Calcular puntos totales de karma
  let totalKarmaPoints = 0;
  for (let rating = 1; rating <= 5; rating++) {
    totalKarmaPoints += (ratingDistribution[rating] || 0) * weights[rating];
  }
  
  // Calcular rango teórico
  const maxTheoreticalPoints = totalReviews * weights[5];
  const minTheoreticalPoints = totalReviews * weights[1];
  const range = maxTheoreticalPoints - minTheoreticalPoints;
  
  if (range === 0) {
    return 50; // Valor neutral si no hay rango
  }
  
  // Normalizar a escala 0-100
  const karmaScore = ((totalKarmaPoints - minTheoreticalPoints) / range) * 100;
  
  return parseFloat(karmaScore.toFixed(2));
}

/**
 * Formatea la frecuencia de reseñas en una descripción legible
 */
function formatReviewFrequency(
  startDate: Date, 
  endDate: Date, 
  reviewCount: number
): {
  description: string | null;
  category: ReviewMetrics['reviewFrequencyCategory'];
  avgDaysBetween: number | null;
} {
  if (!startDate || !endDate || reviewCount <= 1) {
    return {
      description: null,
      category: "No Determinada",
      avgDaysBetween: null
    };
  }
  
  const timeDiffMillis = endDate.getTime() - startDate.getTime();
  if (timeDiffMillis <= 0) {
    return {
      description: "Múltiples en el mismo día",
      category: "Muy Activa",
      avgDaysBetween: 0
    };
  }
  
  const timeDiffDays = timeDiffMillis / (1000 * 60 * 60 * 24);
  const avgDaysPerReview = timeDiffDays / (reviewCount - 1);
  
  let description: string;
  let category: ReviewMetrics['reviewFrequencyCategory'];
  
  if (avgDaysPerReview < 0.5) {
    description = "Varias por día";
    category = "Muy Activa";
  } else if (avgDaysPerReview < 1.5) {
    description = "Aprox. 1 cada día";
    category = "Muy Activa";
  } else if (avgDaysPerReview < 7) {
    description = `Aprox. 1 cada ${Math.round(avgDaysPerReview)} días`;
    category = "Muy Activa";
  } else if (avgDaysPerReview < 30) {
    const weeks = Math.round(avgDaysPerReview / 7);
    description = `Aprox. 1 cada ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    category = "Activa";
  } else if (avgDaysPerReview < 90) {
    const months = Math.round(avgDaysPerReview / 30.44);
    description = months === 1 ? "Aprox. 1 cada mes" : `Aprox. 1 cada ${months} meses`;
    category = "Moderada";
  } else if (avgDaysPerReview < 180) {
    const months = Math.round(avgDaysPerReview / 30.44);
    description = `Aprox. 1 cada ${months} meses`;
    category = "Baja";
  } else {
    const months = Math.round(avgDaysPerReview / 30.44);
    description = `Aprox. 1 cada ${months} meses`;
    category = "Inactiva";
  }
  
  return { 
    description, 
    category, 
    avgDaysBetween: Math.round(avgDaysPerReview) 
  };
}

/**
 * Calcula métricas detalladas de las reseñas
 */
export function calculateReviewMetrics(reviews: Review[]): ReviewMetrics {
  const processedReviewsCount = reviews.length;
  
  // Inicializar métricas
  let totalStarsSum = 0;
  let validRatingsCount = 0;
  let reviewsRespondedCount = 0;
  const ratingDistributionSample = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let oldestReviewDate: Date | null = null;
  let newestReviewDate: Date | null = null;
  
  // Si no hay reseñas, retornar métricas vacías
  if (processedReviewsCount === 0) {
    return {
      processedReviewsCount: 0,
      averageRatingSample: null,
      ratingDistributionSample,
      karmaScoreSample: null,
      responseRatePercentage: 0,
      newestReviewDateSample: null,
      oldestReviewDateSample: null,
      reviewFrequencySample: null,
      reviewFrequencyCategory: "No Determinada",
      avgDaysBetweenReviews: null,
      daysSinceLastReview: null,
      avgReviewsPerMonth: null,
    };
  }
  
  // Procesar cada reseña
  for (const review of reviews) {
    // Contar ratings
    if (typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5) {
      totalStarsSum += review.rating;
      validRatingsCount++;
      ratingDistributionSample[review.rating]++;
    }
    
    // Contar respuestas
    if (review.response) {
      reviewsRespondedCount++;
    }
    
    // Procesar fechas
    if (review.date) {
      try {
        const reviewDate = new Date(review.date);
        if (!isNaN(reviewDate.getTime())) {
          if (!oldestReviewDate || reviewDate < oldestReviewDate) {
            oldestReviewDate = reviewDate;
          }
          if (!newestReviewDate || reviewDate > newestReviewDate) {
            newestReviewDate = reviewDate;
          }
        }
      } catch (e) {
        // Ignorar fechas inválidas
      }
    }
  }
  
  // Calcular métricas finales
  const averageRatingSample = validRatingsCount > 0 
    ? parseFloat((totalStarsSum / validRatingsCount).toFixed(2)) 
    : null;
    
  const responseRatePercentage = processedReviewsCount > 0 
    ? Math.round((reviewsRespondedCount / processedReviewsCount) * 100) 
    : 0;
    
  const karmaScoreSample = calculateKarmaScore(ratingDistributionSample);
  
  // Calcular frecuencia de reseñas
  let frequencyData = { 
    description: null as string | null, 
    category: "No Determinada" as ReviewMetrics['reviewFrequencyCategory'], 
    avgDaysBetween: null as number | null 
  };
  let daysSinceLastReview: number | null = null;
  let avgReviewsPerMonth: number | null = null;
  
  if (processedReviewsCount >= 2 && oldestReviewDate && newestReviewDate) {
    // Ordenar reseñas por fecha
    const sortedReviews = reviews
      .filter(r => r.date)
      .map(r => ({ ...r, dateObj: new Date(r.date) }))
      .filter(r => !isNaN(r.dateObj.getTime()))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    
    if (sortedReviews.length > 0) {
      // Días desde la última reseña
      const latestReviewDate = sortedReviews[0].dateObj;
      daysSinceLastReview = Math.round((new Date().getTime() - latestReviewDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Frecuencia basada en las últimas 5 reseñas
      const recentReviews = sortedReviews.slice(0, 5);
      if (recentReviews.length >= 2) {
        const newestDate = recentReviews[0].dateObj;
        const oldestDate = recentReviews[recentReviews.length - 1].dateObj;
        frequencyData = formatReviewFrequency(oldestDate, newestDate, recentReviews.length);
      }
    }
    
    // Promedio de reseñas por mes
    const timeDiffDays = (newestReviewDate.getTime() - oldestReviewDate.getTime()) / (1000 * 60 * 60 * 24);
    const monthsSpanned = Math.max(timeDiffDays / 30.44, 1);
    avgReviewsPerMonth = parseFloat((processedReviewsCount / monthsSpanned).toFixed(2));
  } else if (processedReviewsCount === 1 && newestReviewDate) {
    daysSinceLastReview = Math.round((new Date().getTime() - newestReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    avgReviewsPerMonth = 1; // Una reseña en el período
  }
  
  return {
    processedReviewsCount,
    averageRatingSample,
    ratingDistributionSample,
    karmaScoreSample,
    responseRatePercentage,
    newestReviewDateSample: newestReviewDate?.toISOString() || null,
    oldestReviewDateSample: oldestReviewDate?.toISOString() || null,
    reviewFrequencySample: frequencyData.description,
    reviewFrequencyCategory: frequencyData.category,
    avgDaysBetweenReviews: frequencyData.avgDaysBetween,
    daysSinceLastReview,
    avgReviewsPerMonth,
  };
}