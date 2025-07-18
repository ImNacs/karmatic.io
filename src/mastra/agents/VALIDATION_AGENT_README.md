# Agente de Validación Automotriz - Mastra

## Descripción

El agente de validación es un agente Mastra que determina si un negocio es una agencia automotriz legítima mediante el análisis de reseñas usando IA. Utiliza el modelo DeepSeek-chat para realizar validación binaria.

## Arquitectura Mastra

```
mastra/
├── agents/
│   ├── index.ts         # Exporta todos los agentes
│   ├── chat.ts          # Agente conversacional principal
│   └── validation.ts    # Agente de validación automotriz
├── tools/               # Herramientas para los agentes
└── index.ts            # Instancia principal de Mastra
```

## Flujo de Validación

```
Input (agencia + reseñas)
    ↓
Validación rápida por nombre
    ↓
Si no es obvio → Agente Mastra
    ↓
Análisis con DeepSeek-chat
    ↓
Resultado binario + confianza
```

## Configuración

### Variables de entorno

```env
OPENROUTER_API_KEY=tu-api-key-aqui
```

### Configuración en `config.ts`

```typescript
validation: {
  enabled: true,
  reviewsToAnalyze: 15,              // Máximo de reseñas a analizar
  minReviewsForAnalysis: 5,          // Mínimo para análisis confiable
  validationModel: 'deepseek-chat',  // Modelo a usar
}
```

## Uso del Agente

### 1. Validación rápida (sin IA)

```typescript
import { quickValidate } from '@/mastra/agents/validation';

const result = quickValidate({
  name: "Honda Motos México"
});
// Resultado: { isValid: false, category: 'motocicletas', ... }
```

### 2. Validación completa con IA

```typescript
import { validateWithAgent } from '@/mastra/agents/validation';

const result = await validateWithAgent({
  agency: {
    name: "Toyota Del Valle",
    placeId: "xyz789",
    rating: 4.5,
    totalReviews: 150
  },
  reviews: [
    { 
      text: "Excelente agencia, compré mi Corolla aquí", 
      rating: 5, 
      timeCreated: "2024-01-15" 
    },
    // más reseñas...
  ]
});
```

### 3. Integración con EnhancedAgencyValidator

```typescript
import { EnhancedAgencyValidator } from '@/lib/karmatic/enhanced-validator';

const validator = new EnhancedAgencyValidator();
const result = await validator.validateAgency(agency, reviews);
```

## Categorías de Validación

- `agencia_autos`: Venta de autos nuevos/seminuevos ✅
- `motocicletas`: Agencias de motos ❌
- `renta`: Renta/leasing de autos ❌
- `taller`: Solo servicio mecánico ❌
- `otro`: Negocios no automotrices ❌

## Criterios del Agente

### Inclusión (✅)
- Agencias que VENDEN autos nuevos o seminuevos
- Concesionarios oficiales de marcas
- Lotes de autos con venta directa
- Agencias multimarca con inventario propio

### Exclusión (❌)
- Talleres mecánicos (solo servicio)
- Agencias de motocicletas
- Renta de autos o leasing
- Refaccionarias o autopartes
- Car wash o detallado
- Gasolineras
- Gestorías vehiculares
- Cualquier negocio no automotriz

## Ventajas de usar Mastra

1. **Arquitectura modular**: Agentes separados por responsabilidad
2. **Tipado fuerte**: Schemas con Zod para entrada/salida
3. **Manejo de errores**: Fallbacks automáticos
4. **Integración**: Fácil de combinar con otros agentes
5. **Observabilidad**: Logs y métricas integradas

## Ejemplo de respuesta

```typescript
{
  isAutomotiveAgency: true,
  confidence: 95,
  category: 'agencia_autos',
  reason: 'Múltiples reseñas mencionan compra de vehículos nuevos',
  automotiveScore: 92,
  excludedCategories: []
}
```

## Costos

- DeepSeek-chat via OpenRouter: ~$0.0001 por validación
- Muy económico comparado con GPT-4

## Próximos pasos

1. Agregar más modelos (GPT-4, Claude, etc.)
2. Implementar cache distribuido
3. Métricas de precisión
4. Fine-tuning del modelo