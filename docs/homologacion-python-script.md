# Homologación con Script Python - Resumen de Cambios

## Cambios Realizados

### 1. Tipos de Negocio Válidos
**Agregados del script Python:**
- `car_wash`
- `car_detailer`

**Justificación:** Aunque son servicios, muchas agencias tienen estos servicios integrados.

### 2. Keywords Prohibidas en Nombres
**Agregado del script Python:**
- `taller` - Para excluir talleres mecánicos independientes

### 3. Keywords de Renta en Reseñas
**Agregados del script Python:**
- `renta de coches`
- `renta de automóviles`

### 4. Keywords de Solo Servicio
**Agregados del script Python:**
- `solo son servicio`
- `sólo son servicio`

### 5. Marcas de Autos
**Simplificado para coincidir con Python:**
- Removidas marcas de lujo poco comunes en México
- Mantenidas solo las marcas principales del mercado mexicano

**Marcas eliminadas:**
- chrysler, dodge, gmc, infiniti, jaguar, jeep, land rover, lexus, lincoln, mercedes-benz, mini, peugeot, porsche, ram, tesla, vw (manteniendo volkswagen)

### 6. Keywords de Fraude
**Simplificado siguiendo Python:**
- Mantenidos solo: `estafa`, `estafadores`, `engaño`, `engañoso`, `mentira`, `mentiroso`, `fraude`, `fraudulento`
- Eliminados términos más agresivos que podrían ser falsos positivos

### 7. Dominios Web Prohibidos
**Agregados del script Python (sitios de USA):**
- `autotrader.com`
- `carfax.com`
- `cars.com`
- `carvana.com`
- `carmax.com`
- `shift.com`
- `vroom.com`

### 8. Umbrales
**Ajustado para coincidir:**
- `minReviewsForAnalysis`: 15 → 5 (más flexible)

### 9. Eliminaciones
**Removido (no en Python):**
- Dominios "trusted" - No tiene sentido dar bonificaciones por dominio
- Keywords muy específicas de fraude que generan falsos positivos
- Marcas de autos de lujo poco comunes

## Diferencias Mantenidas

### 1. Keywords Automotrices en config.ts
Mantenemos keywords adicionales que son útiles para el contexto mexicano:
- Términos financieros: `enganche`, `mensualidad`
- Términos de proceso: `garantía`, `trámite`

### 2. Features Adicionales
Nuestro sistema tiene características que el Python no tiene:
- `expandSearchRadius` - Expansión automática del radio
- `cacheValidationResults` - Cache de resultados
- `detectFalsePositives` - Detección inteligente

### 3. Sistema de Scoring
Más sofisticado que el Python:
- Score base configurable
- Multiplicadores por rating
- Bonus por cantidad de reseñas
- Penalizaciones graduales

## Resumen

La homologación se enfocó en:
1. ✅ Alinear listas de keywords y tipos
2. ✅ Simplificar donde el script Python es más conservador
3. ✅ Mantener mejoras propias del sistema
4. ✅ Eliminar elementos que no agregan valor (dominios trusted)

El sistema ahora es más consistente con el script Python original mientras mantiene las mejoras implementadas.