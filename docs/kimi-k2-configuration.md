# 🤖 Configuración de Kimi K2 con OpenRouter

## ¿Qué es Kimi K2?

Kimi K2 es un modelo de lenguaje de última generación desarrollado por MoonshotAI, optimizado específicamente para tareas agénticas. Sus características principales incluyen:

- **128K tokens de contexto**: Puede procesar documentos muy largos
- **Arquitectura MoE**: Mixture of Experts con 1 billón de parámetros totales
- **Especialización agéntica**: Optimizado para uso de herramientas y automatización
- **Costo eficiente**: $0.57/1M tokens entrada, $2.30/1M tokens salida

## Configuración Rápida

### 1. Obtener API Key de OpenRouter

1. Ve a [OpenRouter](https://openrouter.ai/)
2. Crea una cuenta o inicia sesión
3. Genera una API key en la sección de configuración
4. Copia la API key

### 2. Configurar Variables de Entorno

Edita tu archivo `.env` o `.env.local`:

```env
# Configuración de OpenRouter
OPENROUTER_API_KEY=sk-or-v1-tu-api-key-aqui

# Selección de modelo (opcional, por defecto usa Kimi K2)
AI_MODEL=moonshotai/kimi-k2
```

### 3. Modelos Disponibles

Puedes cambiar el modelo modificando la variable `AI_MODEL`:

#### Modelos Premium
- `moonshotai/kimi-k2` - Mejor para tareas agénticas y herramientas
- `anthropic/claude-3-5-sonnet` - Mejor para conversación general
- `openai/gpt-4-turbo-preview` - Modelo versátil de OpenAI

#### Modelos Rápidos y Económicos
- `anthropic/claude-3-haiku` - Muy rápido, buena calidad
- `openai/gpt-3.5-turbo` - Económico y rápido

#### Modelos Open Source
- `google/gemini-pro` - Tiene tier gratuito
- `meta-llama/llama-3-70b-instruct` - Modelo abierto

## Casos de Uso de Kimi K2

### 1. Análisis de Código
```javascript
// Kimi K2 puede analizar repositorios completos
const response = await agent.generate([{
  role: "user",
  content: "Analiza este repositorio y encuentra posibles mejoras de rendimiento"
}]);
```

### 2. Automatización de Tareas
```javascript
// Excelente para encadenar múltiples operaciones
const response = await agent.generate([{
  role: "user",
  content: "1. Lee el archivo config.json\n2. Valida la estructura\n3. Genera documentación\n4. Crea tests unitarios"
}]);
```

### 3. Procesamiento de Documentos Largos
```javascript
// Aprovecha los 128K tokens de contexto
const response = await agent.generate([{
  role: "user",
  content: `Aquí está el manual completo de 200 páginas: ${manualContent}\n\nResume los puntos clave y genera una guía rápida.`
}]);
```

## Comparación de Rendimiento

| Tarea | Kimi K2 | Claude 3.5 | GPT-4 |
|-------|----------|------------|-------|
| Uso de herramientas | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Análisis de código | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Conversación | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Costo-beneficio | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Velocidad | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## Verificar la Configuración

Para verificar que Kimi K2 está configurado correctamente:

```bash
# Ejecuta el script de prueba
node scripts/test-streaming.js

# O usa curl
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"¿Qué modelo eres?"}]}'
```

## Optimización de Costos

### Tips para reducir costos con Kimi K2:

1. **Limita el contexto**: No incluyas información redundante
2. **Usa límites de tokens**: Configura `max_tokens` apropiadamente
3. **Cachea respuestas**: Para consultas repetitivas
4. **Compresión semántica**: Resume contextos largos antes de enviarlos

### Ejemplo de configuración optimizada:

```javascript
const response = await agent.generate(messages, {
  maxTokens: 500,        // Limita la respuesta
  temperature: 0.3,      // Reduce variabilidad
  // Solo incluye contexto relevante
  context: relevantContext.slice(-5000)
});
```

## Solución de Problemas

### El modelo no responde
1. Verifica que `OPENROUTER_API_KEY` esté configurada
2. Revisa los logs del servidor para errores específicos
3. Confirma que el modelo ID sea correcto: `moonshotai/kimi-k2`

### Respuestas lentas
1. Kimi K2 puede ser más lento en consultas complejas
2. Considera usar `anthropic/claude-3-haiku` para respuestas rápidas
3. Implementa streaming para mejorar la percepción de velocidad

### Costos elevados
1. Monitorea el uso en el dashboard de OpenRouter
2. Implementa límites de tokens
3. Considera modelos más económicos para tareas simples

## Recursos Adicionales

- [Documentación de OpenRouter](https://openrouter.ai/docs)
- [Página del modelo Kimi K2](https://openrouter.ai/moonshotai/kimi-k2)
- [GitHub de MoonshotAI](https://github.com/MoonshotAI/Kimi-K2)
- [Benchmarks y comparaciones](https://openrouter.ai/benchmarks)

---

**Última actualización**: Julio 2025