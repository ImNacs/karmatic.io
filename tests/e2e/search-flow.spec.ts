import { test, expect } from '@playwright/test'

test.describe('Flujo de Búsqueda E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('Usuario anónimo puede realizar búsqueda completa', async ({ page }) => {
    // 1. Verificar que la página carga
    await expect(page).toHaveTitle(/Karmatic/)
    
    // 2. Completar formulario de búsqueda
    await page.fill('input[placeholder*="ciudad"]', 'Miami')
    await page.fill('input[placeholder*="marca"]', 'Honda')
    
    // 3. Hacer clic en buscar
    await page.click('button:has-text("Buscar")')
    
    // 4. Esperar redirección a resultados
    await page.waitForURL('**/explorer/**', { timeout: 10000 })
    
    // 5. Verificar que estamos en la página de resultados
    const url = page.url()
    expect(url).toContain('/explorer/')
    
    // 6. Verificar elementos de la página de resultados
    await expect(page.locator('text=Miami')).toBeVisible()
    await expect(page.locator('text=Honda')).toBeVisible()
    
    // 7. Verificar que el mapa está presente
    await expect(page.locator('#map')).toBeVisible()
  })

  test('Límite de búsqueda para usuarios anónimos', async ({ page }) => {
    // Primera búsqueda debe funcionar
    await page.fill('input[placeholder*="ciudad"]', 'Miami')
    await page.click('button:has-text("Buscar")')
    await page.waitForURL('**/explorer/**')
    
    // Volver a inicio
    await page.goto('http://localhost:3000')
    
    // Segunda búsqueda debe mostrar límite
    await page.fill('input[placeholder*="ciudad"]', 'Orlando')
    await page.click('button:has-text("Buscar")')
    
    // Verificar mensaje de límite
    await expect(page.locator('text=límite')).toBeVisible({ timeout: 5000 })
  })

  test('Historial de búsquedas aparece correctamente', async ({ page }) => {
    // Realizar una búsqueda
    await page.fill('input[placeholder*="ciudad"]', 'Miami')
    await page.fill('input[placeholder*="marca"]', 'Toyota')
    await page.click('button:has-text("Buscar")')
    await page.waitForURL('**/explorer/**')
    
    // Volver a inicio
    await page.goto('http://localhost:3000')
    
    // Verificar que aparece en historial
    await expect(page.locator('text=Miami - Toyota')).toBeVisible()
    await expect(page.locator('text=Hoy')).toBeVisible()
  })

  test('Navegación a búsqueda desde historial', async ({ page }) => {
    // Realizar búsqueda
    await page.fill('input[placeholder*="ciudad"]', 'Miami')
    await page.fill('input[placeholder*="marca"]', 'Nissan')
    await page.click('button:has-text("Buscar")')
    await page.waitForURL('**/explorer/**')
    const searchUrl = page.url()
    
    // Volver a inicio
    await page.goto('http://localhost:3000')
    
    // Click en historial
    await page.click('text=Miami - Nissan')
    
    // Verificar que volvemos a la misma búsqueda
    await expect(page).toHaveURL(searchUrl)
  })

  test('Chat AI funciona en página de resultados', async ({ page }) => {
    // Ir a una búsqueda
    await page.fill('input[placeholder*="ciudad"]', 'Miami')
    await page.click('button:has-text("Buscar")')
    await page.waitForURL('**/explorer/**')
    
    // Abrir chat (si hay botón)
    const chatButton = page.locator('button[aria-label*="chat"], button:has-text("Chat")')
    if (await chatButton.isVisible()) {
      await chatButton.click()
      
      // Verificar que el chat está abierto
      await expect(page.locator('[role="dialog"], .chat-panel')).toBeVisible()
      
      // Enviar mensaje
      await page.fill('textarea, input[type="text"]', '¿Cuáles son los mejores dealers?')
      await page.keyboard.press('Enter')
      
      // Esperar respuesta
      await expect(page.locator('text=assistant')).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Verificación de APIs', () => {
  test('API check-limit responde correctamente', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/search/check-limit')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('remaining')
    expect(data).toHaveProperty('canSearch')
  })

  test('API history responde correctamente', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/search/history')
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('searches')
    expect(data).toHaveProperty('total')
  })

  test('API save guarda búsquedas correctamente', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/search/save', {
      data: {
        location: 'Test City',
        query: 'Test Query',
        placeId: 'test-place-123',
        coordinates: { lat: 25.7617, lng: -80.1918 },
        results: []
      }
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('searchId')
    expect(data.success).toBe(true)
  })
})