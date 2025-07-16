# Implementación de la Metodología Perplexity para Análisis de Agencias Automotrices

## Arquitectura del Sistema Basada en Perplexity

Para implementar la metodología Perplexity en tu sistema de análisis de agencias automotrices, necesitas adaptar sus componentes principales a tu caso de uso específico. La arquitectura debe procesar los inputs `(lat, lng, query)` y generar recomendaciones verificables sobre la mejor agencia para comprar un auto.

## Componentes del Sistema

### 1. Motor de Interpretación de Consultas (Query Understanding)

El primer componente procesa la consulta del usuario y extrae intención, entidades y contexto específico del dominio automotriz.

**Funcionalidad:**
- Análisis semántico de consultas como "Toyota Camry 2022 cerca de mi ubicación"
- Identificación de entidades clave: marca, modelo, año, tipo de vehículo, precio
- Clasificación de intención: compra, arrendamiento, intercambio, financiamiento, etc...
- Detección de consultas fuera de dominio (OOD) para filtrar queries irrelevantes[1]

**Implementación práctica:**
```
Input: "Busco una Toyota Camry 2022 usada, con financiamiento, 19.4326, -99.1332"
Output: {
  intención: "compra_vehiculo",
  entidades: {
    marca: "Toyota",
    modelo: "Camry", 
    año: 2022,
    condición: "usada",
    ubicación: {lat: 19.4326, lng: -99.1332},
    servicios: ["financiamiento"]
  },
  contexto: "búsqueda_local_con_servicios"
}
```

### 2. Sistema de Recuperación Híbrida (Hybrid Retrieval)

Como Perplexity, tu sistema debe combinar múltiples fuentes de información en tiempo real para obtener datos completos sobre agencias automotrices.

**Agentes de Búsqueda Paralelos:**

| Agente | Función | Fuente de Datos | Tiempo de Respuesta |
|--------|---------|----------------|-------------------|
| **Places Agent** | Encuentra agencias cercanas | Google Places API | 200-400ms |
| **Inventory Agent** | Busca inventario específico | Web scraping dealership sites | 1-3s |
| **Reviews Agent** | Recopila reseñas y ratings | Google Reviews, Yelp, DealerRater | 500ms-1s |
| **Pricing Agent** | Compara precios de mercado | Cars.com, AutoTrader, Edmunds | 1-2s |
| **Reputation Agent** | Analiza reputación online | Menciones web, redes sociales, BBB | 2-4s |

**Búsqueda Vectorial:**
- Embeddings de descripciones de agencias, servicios y especialidades
- Índice vectorial con Upstash Vector para búsqueda semántica
- Búsqueda híbrida combinando vectores + filtros geoespaciales[2][3]

### 3. Procesamiento RAG de Tres Etapas

Siguiendo la metodología Perplexity, implementa un pipeline RAG refinado:

**Etapa 1: Recuperación Gruesa (Coarse Retrieval)**
- Búsqueda inicial en un radio de 50km usando PostGIS
- Filtrado por tipo de negocio (car_dealer) y status operativo
- Recuperación de ~50 agencias candidatas con diversidad sampling[4]

**Etapa 2: Reranking Neural**
- Modelo cross-encoder (DeBERTa-v3) para calcular relevancia
- Puntuación basada en: proximidad, inventario match, rating, servicios
- Filtrado de agencias con score 85%
- Satisfacción de usuario: >4.5/5
- Tasa de conversión: >15%

Esta implementación adapta la metodología probada de Perplexity al dominio específico de agencias automotrices, manteniendo los principios de búsqueda híbrida, procesamiento RAG y respuestas citadas, mientras optimiza para tu caso de uso particular con inputs geoespaciales y recomendaciones de compra de vehículos.

[1] https://www.appypieautomate.ai/blog/what-is-perplexity-ai
[2] https://arxiv.org/html/2409.17383
[3] https://www.ibm.com/think/topics/vector-search
[4] https://www.linkedin.com/pulse/technical-architecture-operational-mechanics-perplexitys-kashish-vaid-bjgkc
[5] https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research
[6] https://dealerai.com/proximity-search-optimize-inventory-for-auto-groups/
[7] https://tech.cars.com/understanding-auto-retailers-and-their-competitors-using-embeddings-and-graph-networks-753caaaef427?gi=91ca2262fc9e
[8] https://impel.ai/blog/rag-to-richer-ai-interactions-the-tech-behind-dealer-specific-ai/
[9] https://dealerai.com/how-multi-agent-ai-is-transforming-online-conversations-for-dealerships/
[10] https://ahvanguard.com/how-perplexity-ai-transforms-data-analysis/
[11] https://www.carscommerce.inc/best-match/
[12] https://autosphere.ca/dealerships/2025/03/11/multi-agent-generative-ai-delivers-a-more-powerful-and-adaptive-experience-than-basic-ai/
[13] https://searchengineland.com/google-local-car-dealership-inventory-search-results-348051
[14] https://www.atlantis-press.com/article/25856143.pdf
[15] https://www.linkedin.com/pulse/case-study-perplexity-ai-simple-guide-its-story-success-sutar-9kjpc
[16] https://www.searchenginejournal.com/google-introduces-structured-data-for-car-dealership-inventory/498575/
[17] https://www.youtube.com/watch?v=QAgDPbIbvik
[18] https://developers.google.com/vehicle-listings/integration-process/dealer-matching
[19] https://www.fullpath.com/blog/ai-agents-for-car-dealers-what-are-they-and-how-are-they-revolutionizing-automotive-retail/
[20] https://beam.ai/llm/perplexity/
[21] https://www.youtube.com/watch?v=_AIMRcwJOCg
[22] https://www.youtube.com/watch?v=CtzSnarauCo
[23] https://www.youtube.com/watch?v=pTcQy5MHCUg
[24] http://www.autorevo.com/pdf/automotive-SEO-whitepaper.pdf
[25] https://www.33rdsquare.com/web-scraping-in-automotive-industry/
[26] https://www.salesforce.com/agentforce/what-is-rag/
[27] https://scrapingant.com/blog/web-scraping-automotive
[28] https://www.cloudflare.com/learning/ai/retrieval-augmented-generation-rag/
[29] https://arxiv.org/pdf/2409.17383.pdf
[30] https://apify.com/autoscraping/webmotors-collect-by-url
[31] https://arxiv.org/abs/2411.19443
[32] https://www.crawlerhub.com/industries/automotive
[33] https://www.linkedin.com/posts/getimpel_new-ai-advancements-revolutionizing-dealerships-activity-7345082448470298624-F7kS
[34] https://www.tigerdata.com/blog/a-beginners-guide-to-vector-embeddings
[35] https://code.likeagirl.io/web-scraping-for-car-sales-data-433f82550127?gi=642562368ad5
[36] https://github.com/thaisaraujom/automotive-agent-rag
[37] https://www.meilisearch.com/blog/what-are-vector-embeddings
[38] https://web.instantapi.ai/blog/web-scraping-in-the-automotive-repair-sector-tracking-service-trends
[39] https://www.ijrti.org/papers/IJRTI2503050.pdf
[40] https://realpython.com/chromadb-vector-database/
[41] https://www.awaz.ai/blog/building-an-ai-assistant-for-car-dealership-appointment-scheduling
[42] https://www.seodiscovery.com/seo-for-car-dealers.php
[43] https://dealerai.com
[44] https://www.autoalert.com/autoassistant/
[45] https://www.jazel.com/automotive-seo/
[46] https://www.awaz.ai/blog/building-an-ai-assistant-for-car-dealership-test-drives
[47] https://www.dealer.com/solutions/seo/
[48] https://www.autoconverse.co.uk
[49] https://synthflow.ai/industry-use-cases/car-dealership
[50] https://www.techtimes.com/articles/309249/20250130/automotive-seo-strategies.htm
[51] https://softblues.io/blog/ai-for-car-dealerships/
[52] https://www.fullpath.com/blog/guide-to-implementing-ai-at-your-dealership/
[53] https://loganix.com/seo-for-car-dealerships/
[54] https://www.qburst.com/downloads/car-dealer-chatbot.pdf
[55] https://www.cdkglobal.com/ai
[56] https://www.bruceclay.com/seo/industry/automotive/dealerships/
[57] https://www.ai-assistant.io