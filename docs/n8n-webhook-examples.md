# N8N Webhook Integration Examples

## 1. Location Search Webhook

### Request
**Endpoint:** `POST /webhook-test/locate-agencies`

```json
{
  "location": "Ciudad de México, CDMX, México",
  "query": "KIA Forte 2018",
  "coordinates": {
    "lat": 19.4326,
    "lng": -99.1332
  },
  "placeId": "ChIJB5fZAuX_0YURjUbOHp_8HkY",
  "placeDetails": {
    "description": "Ciudad de México, CDMX, México",
    "mainText": "Ciudad de México",
    "secondaryText": "CDMX, México"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "karmatic-web"
}
```

### Expected Response
```json
{
  "success": true,
  "agencies": [
    {
      "id": "agency_001",
      "name": "KIA Motors Ciudad de México",
      "address": "Av. Insurgentes Sur 1234, Col. Del Valle",
      "distance": "2.5 km",
      "rating": 4.5,
      "phoneNumber": "+52 55 1234 5678",
      "website": "https://kia-cdmx.com",
      "openingHours": [
        "Lun-Vie: 9:00-19:00",
        "Sáb: 9:00-14:00",
        "Dom: Cerrado"
      ],
      "latitude": 19.3765,
      "longitude": -99.1615,
      "placeId": "ChIJN1t_tDeuEmsRXYJNy9HqJYM"
    },
    {
      "id": "agency_002",
      "name": "Grupo Automotriz del Valle",
      "address": "Calz. de Tlalpan 2345, Col. Portales",
      "distance": "4.1 km",
      "rating": 4.2,
      "phoneNumber": "+52 55 9876 5432",
      "website": null,
      "openingHours": [
        "Lun-Sáb: 8:00-18:00",
        "Dom: Cerrado"
      ],
      "latitude": 19.3698,
      "longitude": -99.1420,
      "placeId": "ChIJN1t_tDeuEmsRXYJNy9HqKZN"
    }
  ],
  "totalResults": 2,
  "searchLocation": {
    "address": "Ciudad de México, CDMX, México",
    "lat": 19.4326,
    "lng": -99.1332
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Unable to fetch agencies",
  "message": "Google Places API rate limit exceeded",
  "agencies": [],
  "totalResults": 0
}
```

## 2. Agency Analysis Webhook

### Request
**Endpoint:** `POST /webhook-test/analyze-agencies`

```json
{
  "agencies": [
    {
      "id": "agency_001",
      "name": "KIA Motors Ciudad de México",
      "address": "Av. Insurgentes Sur 1234, Col. Del Valle",
      "rating": 4.5,
      "latitude": 19.3765,
      "longitude": -99.1615
    },
    {
      "id": "agency_002",
      "name": "Grupo Automotriz del Valle",
      "address": "Calz. de Tlalpan 2345, Col. Portales",
      "rating": 4.2,
      "latitude": 19.3698,
      "longitude": -99.1420
    }
  ],
  "userQuery": "KIA Forte 2018 con buen servicio post-venta",
  "userLocation": "Ciudad de México, CDMX, México",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### Expected Response
```json
{
  "success": true,
  "summary": "Basado en tu búsqueda de un KIA Forte 2018 con buen servicio post-venta, hemos analizado 2 agencias en tu área.",
  "recommendations": [
    {
      "agencyId": "agency_001",
      "agencyName": "KIA Motors Ciudad de México",
      "score": 0.95,
      "reasons": [
        "Concesionario oficial KIA con servicio especializado",
        "Calificación alta (4.5/5) en servicio al cliente",
        "Ubicación conveniente a 2.5 km de tu posición",
        "Cuenta con taller certificado y refacciones originales"
      ]
    },
    {
      "agencyId": "agency_002",
      "agencyName": "Grupo Automotriz del Valle",
      "score": 0.75,
      "reasons": [
        "Agencia multimarca con experiencia en KIA",
        "Buena calificación general (4.2/5)",
        "Precios competitivos en servicio",
        "Mayor distancia desde tu ubicación (4.1 km)"
      ]
    }
  ],
  "insights": [
    "KIA Motors Ciudad de México es la opción recomendada por ser concesionario oficial",
    "Ambas agencias tienen horarios de servicio de lunes a sábado",
    "Se recomienda agendar cita previa para servicio post-venta",
    "Considera comparar los planes de mantenimiento entre ambas opciones"
  ]
}
```

## Integration Notes

1. **CORS Configuration**: Ensure the n8n webhook accepts requests from your Next.js domain
2. **Error Handling**: Always return a response with `success: false` on errors
3. **Timeout**: Set reasonable timeouts (10-15 seconds) for webhook responses
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Authentication**: While currently unprotected, consider adding API key validation in production

## Testing with cURL

### Test Location Search
```bash
curl -X POST https://n8n.home/webhook-test/517cbd67-7833-4f29-b940-1b51c0f48193 \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Ciudad de México, CDMX, México",
    "query": "Toyota Corolla",
    "coordinates": {
      "lat": 19.4326,
      "lng": -99.1332
    },
    "placeId": "ChIJB5fZAuX_0YURjUbOHp_8HkY",
    "placeDetails": {
      "description": "Ciudad de México, CDMX, México",
      "mainText": "Ciudad de México",
      "secondaryText": "CDMX, México"
    },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "source": "karmatic-web"
  }'
```

### Test Agency Analysis
```bash
curl -X POST https://n8n.home/webhook-test/analyze-agencies-webhook-id \
  -H "Content-Type: application/json" \
  -d '{
    "agencies": [...],
    "userQuery": "Auto económico con buen rendimiento",
    "userLocation": "Ciudad de México"
  }'
```