# Análisis de Costos por Consulta - Sistema Karmatic

## 💰 Estructura de Costos Actual (Enero 2025)

### 📊 Datos de Pruebas Realizadas
- **Agencias procesadas**: 10 en promedio por consulta
- **Reviews analizadas**: 28 reviews (ejemplo real de prueba)
- **Detección de fraude**: 17 menciones encontradas en las 28 reviews
- **Tiempo de respuesta**: ~47s sin Perplexity, ~3min con Perplexity completo

### 🔧 APIs Utilizadas por Consulta

#### 1. Google Places API
- **Costo**: $0.032 por consulta (Nearby Search)
- **Uso**: 1 llamada por consulta
- **Datos obtenidos**: Lista de agencias cercanas + 5 reviews básicas por agencia
- **Costo por consulta**: **$0.032**

#### 2. Apify Reviews Scraper
- **Costo**: $0.25 por 1,000 results
- **Uso**: 50 reviews por agencia × 10 agencias = 500 reviews
- **Cálculo**: (500 reviews ÷ 1,000) × $0.25 = $0.125
- **Costo por consulta**: **$0.125**

#### 3. Perplexity API (Optimizado)
**Análisis de Queries** (Kimi K2 via OpenRouter):
- **Modelo**: moonshot/moonshot-v1-32k
- **Costo**: $0.57 per 1M input tokens, $2.30 per 1M output tokens
- **Uso**: ~200 input tokens, ~100 output tokens
- **Cálculo**: (200 × $0.57 + 100 × $2.30) ÷ 1,000,000 = $0.00034
- **Costo por consulta**: **$0.00034**

**Análisis Profundo** (3 agencias top):
- **Modelo**: sonar-pro
- **Costo**: $1.00 per 1M input tokens, $3.00 per 1M output tokens
- **Uso**: ~300 input tokens × 3 agencias, ~150 output tokens × 3 agencias
- **Cálculo**: (900 × $1.00 + 450 × $3.00) ÷ 1,000,000 = $0.00225
- **Costo por consulta**: **$0.00225**

**Análisis de Sentimientos** (modo rápido):
- **Modelo**: sonar (básico)
- **Costo**: $0.60 per 1M input tokens, $1.80 per 1M output tokens
- **Uso**: ~500 input tokens, ~50 output tokens
- **Cálculo**: (500 × $0.60 + 50 × $1.80) ÷ 1,000,000 = $0.00039
- **Costo por consulta**: **$0.00039**

### 📈 Costo Total por Consulta

| Componente | Costo | Porcentaje |
|------------|-------|------------|
| Google Places API | $0.032 | 20.1% |
| Apify Reviews Scraper | $0.125 | 78.6% |
| Kimi K2 (Query Analysis) | $0.00034 | 0.2% |
| Perplexity Análisis Profundo | $0.00225 | 1.4% |
| Perplexity Sentimientos | $0.00039 | 0.2% |
| **TOTAL** | **$0.159** | **100%** |

### 💡 Análisis de Costos

**Costo por consulta**: **~$0.16 USD** (≈ $2.88 MXN)

**Distribución**:
- **78.6%** del costo viene de Apify (scraping de reviews)
- **20.1%** del costo viene de Google Places API
- **1.6%** del costo viene de modelos de AI (Perplexity/OpenRouter)

## 🎯 Optimizaciones Implementadas

### 1. Modelo Selection por Tarea
- **Query Analysis**: Kimi K2 (mejor precisión, costo moderado)
- **Deep Analysis**: sonar-pro (balance costo-beneficio)
- **Sentiment**: sonar básico (30% más económico)
- **FAQs**: sonar-pro (cuando sea necesario)

### 2. Strategies de Cache
- **Google Places**: 1 hora TTL
- **Apify Reviews**: 24 horas TTL
- **Perplexity Analysis**: 12 horas TTL
- **Ahorro estimado**: 40-60% en consultas repetitivas

### 3. Lazy Loading
- **Análisis profundo**: Solo para top 3 agencias
- **Sentimientos**: Solo cuando se solicita
- **FAQs**: Solo en modo premium

## 📊 Proyección de Costos por Volumen

### Escenario Conservador (100 consultas/día)
- **Costo diario**: $15.90 USD
- **Costo mensual**: $477 USD
- **Costo anual**: $5,724 USD

### Escenario Moderado (500 consultas/día)
- **Costo diario**: $79.50 USD
- **Costo mensual**: $2,385 USD
- **Costo anual**: $28,620 USD

### Escenario Alto (1,000 consultas/día)
- **Costo diario**: $159 USD
- **Costo mensual**: $4,770 USD
- **Costo anual**: $57,240 USD

## 💰 Optimizaciones Adicionales Posibles

### 1. Tier por Uso
- **Consultas básicas**: Sin análisis profundo = $0.157 (-1.3%)
- **Consultas premium**: Con análisis completo = $0.159
- **Consultas express**: Solo trust score = $0.032 (-80%)

### 2. Batch Processing
- **Agencias populares**: Pre-análisis nocturno
- **Ahorro estimado**: 25% en consultas frecuentes
- **Implementación**: Fase 2

### 3. Regional Caching
- **Por ciudad**: Cache de agencias por ubicación
- **Ahorro estimado**: 50% en Google Places
- **Implementación**: Fase 2

## 🎯 Recomendaciones

### Corto Plazo (Fase 1)
1. **Implementar cache agresivo** (40-60% ahorro)
2. **Tier de consultas** (básica vs premium)
3. **Rate limiting inteligente**

### Mediano Plazo (Fase 2)
1. **Batch processing** para agencias populares
2. **Regional caching** por ciudad
3. **Modelo de suscripción** para distribuir costos

### Largo Plazo (Fase 3)
1. **Modelo propio** para sentiment analysis
2. **Scraper interno** para reducir dependencia de Apify
3. **Partnerships** con agencias para datos directos

## 🚀 Modelo de Pricing Sugerido

### Plan Free
- **3 consultas/día**
- **Solo trust score básico**
- **Costo por usuario**: $0.096/día = $2.88/mes
- **Precio**: Gratis (adquisición de usuarios)

### Plan Pro
- **20 consultas/día**
- **Análisis completo**
- **Costo por usuario**: $3.18/día = $95.40/mes
- **Precio sugerido**: $299 MXN/mes (margen 64%)

### Plan Premium
- **100 consultas/día**
- **Análisis profundo + FAQs**
- **Costo por usuario**: $15.90/día = $477/mes
- **Precio sugerido**: $1,299 MXN/mes (margen 70%)

## 📈 ROI Esperado

Con **1,000 usuarios activos**:
- **80% Plan Free** (800 usuarios): $0 ingresos, $2,304 costos
- **15% Plan Pro** (150 usuarios): $44,850 ingresos, $14,310 costos
- **5% Plan Premium** (50 usuarios): $64,950 ingresos, $23,850 costos

**Total mensual**:
- **Ingresos**: $109,800 MXN
- **Costos**: $40,464 MXN
- **Margen bruto**: 63%
- **Ganancia neta**: $69,336 MXN/mes

## 🔍 Conclusiones

1. **Costo actual optimizado**: $0.159 por consulta
2. **Principal driver**: Apify reviews (78.6% del costo)
3. **Modelos AI**: Solo 1.6% del costo total
4. **Escalabilidad**: Modelo viable con plan de pricing adecuado
5. **Margen objetivo**: 60-70% con optimizaciones implementadas

El sistema actual es **cost-effective** y **scalable** con las optimizaciones implementadas.