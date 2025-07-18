# Organización Final de Configuraciones

## 📁 Archivos de Configuración

### 1. `config.ts` - Configuración Operacional
**Propósito**: Configuración de OPERACIÓN del sistema

```
├── 1. APIs EXTERNAS
│   ├── Google Places (radio, idioma, query)
│   ├── Apify Reviews (método, período, límites)
│   └── Perplexity/OpenRouter (modelo, top agencias)
│
├── 2. PROCESAMIENTO
│   ├── Pipeline (batches, timeouts, límites)
│   └── Optimizaciones (cache, paralelismo)
│
├── 3. VALIDACIÓN (respaldo básico)
│   └── Keywords mínimas si falla JSON
│
├── 4. ANÁLISIS
│   └── Trust Engine (pesos, niveles)
│
└── 5. COSTOS
    └── Límites y tracking
```

### 2. `filtering-criteria.json` - Criterios de Filtrado
**Propósito**: TODOS los criterios de FILTRADO y VALIDACIÓN

```
├── SECCIÓN 1: FILTRADO POR TIPO
│   └── Tipos válidos, prohibidos, motos
│
├── SECCIÓN 2: FILTRADO POR NOMBRE
│   └── Keywords prohibidas, marcas
│
├── SECCIÓN 3: FILTRADO POR RESEÑAS
│   └── Categorías: moto, renta, servicio, fraude
│
├── SECCIÓN 4: FILTRADO POR DOMINIO
│   └── Dominios prohibidos (marketplaces)
│
├── SECCIÓN 5: KEYWORDS GENERALES
│   └── Automotriz vs No automotriz
│
├── SECCIÓN 6: UMBRALES
│   └── Mínimos, máximos, porcentajes
│
├── SECCIÓN 7: SCORING
│   └── Puntos base, bonus, penalizaciones
│
└── SECCIÓN 8: FEATURES
    └── Toggles on/off
```

## 🔄 Flujo de Uso

1. **Sistema inicia** → Carga `config.ts`
2. **Necesita filtrar** → Carga `filtering-criteria.json`
3. **JSON falla** → Usa respaldo de `config.ts`
4. **Procesa** → Aplica criterios del JSON
5. **Analiza** → Usa configuración operacional

## 📝 Reglas Simples

### Para cambiar CÓMO funciona el sistema:
→ Editar `config.ts`
- Radio de búsqueda
- Timeouts
- Modelos de IA
- Límites de procesamiento

### Para cambiar QUÉ filtra el sistema:
→ Editar `filtering-criteria.json`
- Keywords
- Tipos de negocio
- Umbrales
- Features on/off

## 🎯 Parámetros Clave Aclarados

| Parámetro | Valor | Ubicación | Propósito |
|-----------|-------|-----------|-----------|
| `minReviewsForAnalysis` | 5 | JSON | ¿Analizo o no? |
| `maxReviewsToAnalyze` | 15 | JSON | ¿Cuántas analizo? |
| `radiusMeters` | 5000 | config.ts | Radio de búsqueda |
| `maxAgencies` | 10 | config.ts | Límite de procesamiento |
| `expandSearchRadius` | false | JSON | ¿Expando si hay pocos? |
| `includeMotorcycles` | false | JSON | ¿Incluyo motos? |

## ✅ Beneficios de esta Organización

1. **No hay duplicación** - Cada config en un solo lugar
2. **Claro propósito** - Operación vs Filtrado
3. **Fácil mantenimiento** - Sabes dónde cambiar qué
4. **JSON prioridad** - Cambios sin recompilar
5. **Respaldo robusto** - Si falla JSON, hay básicos

## 🚀 Próximos Pasos Sugeridos

1. Crear UI para editar `filtering-criteria.json`
2. Endpoint para recargar configuración en caliente
3. Logs de qué configuración se está usando
4. Validación de JSON al inicio
5. Tests unitarios de cada sección