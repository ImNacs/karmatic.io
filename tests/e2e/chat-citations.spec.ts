/**
 * @fileoverview Pruebas E2E para el sistema de citations en el chat
 * @module tests/e2e/chat-citations.spec
 */

import { test, expect } from '@playwright/test'

test.describe('Sistema de Citations en Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de búsqueda
    await page.goto('/')
  })

  test('flujo completo de búsqueda con citations', async ({ page }) => {
    // 1. Realizar una búsqueda
    await page.fill('input[placeholder*="buscar"]', 'agencias nissan polanco')
    await page.fill('input[placeholder*="ubicación"]', 'Polanco, CDMX')
    await page.click('button[type="submit"]')
    
    // 2. Esperar resultados
    await page.waitForURL(/\/explorer\//)
    await expect(page.locator('text=Analizando')).toBeVisible()
    
    // 3. Abrir el chat
    await page.click('button:has-text("Chat")')
    await page.waitForSelector('[role="textbox"]')
    
    // 4. Enviar mensaje que debería generar citations
    await page.fill('[role="textbox"]', '¿Cuáles agencias recomiendas?')
    await page.keyboard.press('Enter')
    
    // 5. Esperar respuesta con citations
    await page.waitForSelector('.citation-text', { timeout: 30000 })
    
    // 6. Verificar que hay citations [1] [2] etc
    const citationButtons = await page.locator('button:has-text("[1]")')
    await expect(citationButtons.first()).toBeVisible()
    
    // 7. Click en una citation
    await citationButtons.first().click()
    
    // 8. Verificar que se abre el panel de fuentes
    await expect(page.locator('text=Fuentes')).toBeVisible()
    await expect(page.locator('text=Google Maps')).toBeVisible()
    
    // 9. Cerrar panel de fuentes
    await page.click('button[aria-label="Cerrar panel de fuentes"]')
    await expect(page.locator('text=Fuentes')).not.toBeVisible()
  })

  test('citations en móvil tienen touch targets correctos', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }
    
    // Navegar a resultados existentes (para ahorrar tiempo)
    await page.goto('/explorer/test-search-id')
    
    // Abrir chat
    await page.click('button:has-text("Chat")')
    
    // Enviar mensaje
    await page.fill('[role="textbox"]', 'Dame información')
    await page.keyboard.press('Enter')
    
    // Esperar citations
    await page.waitForSelector('.citation-text button')
    
    // Verificar tamaño de touch targets
    const citationButton = await page.locator('.citation-text button').first()
    const box = await citationButton.boundingBox()
    
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('panel de fuentes se desliza desde abajo en móvil', async ({ page, browserName }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navegar a resultados
    await page.goto('/explorer/test-search-id')
    
    // Abrir chat y enviar mensaje
    await page.click('button:has-text("Chat")')
    await page.fill('[role="textbox"]', 'Información con fuentes')
    await page.keyboard.press('Enter')
    
    // Esperar y clickear citation
    await page.waitForSelector('button:has-text("[1]")')
    await page.click('button:has-text("[1]")')
    
    // Verificar animación del panel
    const panel = await page.locator('.fixed.bottom-0.z-50')
    await expect(panel).toBeVisible()
    
    // Verificar que se puede cerrar arrastrando hacia abajo
    const panelBox = await panel.boundingBox()
    if (panelBox) {
      await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + 20)
      await page.mouse.down()
      await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + 200, { steps: 10 })
      await page.mouse.up()
      
      // Panel debería cerrarse
      await expect(panel).not.toBeVisible()
    }
  })
})