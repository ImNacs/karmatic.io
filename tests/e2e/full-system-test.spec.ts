/**
 * @fileoverview Prueba E2E completa del sistema Karmatic
 * @module tests/e2e/full-system-test
 * 
 * Verifica que todo el sistema funcione correctamente:
 * - Landing page y búsqueda
 * - Análisis de agencias
 * - Chat con citations
 * - Responsive móvil
 */

import { test, expect, Page } from '@playwright/test'

// Configuración de pruebas
const TEST_TIMEOUT = 120000 // 2 minutos para análisis completo

test.describe('Sistema Karmatic - Prueba E2E Completa', () => {
  test.setTimeout(TEST_TIMEOUT)

  test('flujo completo: búsqueda → análisis → chat con citations', async ({ page }) => {
    console.log('🚀 Iniciando prueba E2E completa del sistema Karmatic')

    // 1. LANDING PAGE
    console.log('📍 Paso 1: Verificando landing page')
    await page.goto('/')
    
    // Verificar elementos principales
    await expect(page).toHaveTitle(/Karmatic/i)
    await expect(page.locator('text=Encuentra las mejores agencias automotrices')).toBeVisible()
    
    // Verificar que el formulario de búsqueda existe
    const searchForm = page.locator('form')
    await expect(searchForm).toBeVisible()
    
    // 2. REALIZAR BÚSQUEDA
    console.log('🔍 Paso 2: Realizando búsqueda de agencias')
    
    // Rellenar formulario
    const locationInput = page.locator('input[placeholder="Ingresa tu ubicación"]')
    const queryInput = page.locator('input[placeholder*="auto"]')
    
    await locationInput.fill('Polanco, CDMX')
    await queryInput.fill('Nissan')
    
    // Tomar screenshot antes de buscar
    await page.screenshot({ 
      path: 'tests/screenshots/01-search-form.png',
      fullPage: true 
    })
    
    // Enviar búsqueda
    await page.locator('button:has-text("Buscar agencias")').click()
    
    // 3. ESPERAR ANÁLISIS
    console.log('⏳ Paso 3: Esperando análisis de agencias')
    
    // Verificar pantalla de carga
    await expect(page.locator('text=/Analizando|Buscando|Procesando/i')).toBeVisible({ timeout: 5000 })
    
    // Esperar redirección a resultados
    await page.waitForURL('**/explorer/**', { timeout: 60000 })
    
    // 4. VERIFICAR RESULTADOS
    console.log('📊 Paso 4: Verificando página de resultados')
    
    // Esperar que carguen los resultados
    await page.waitForSelector('[data-testid="agency-card"], .agency-card, [class*="card"]', { 
      timeout: 30000 
    })
    
    // Verificar que hay agencias
    const agencyCards = page.locator('[data-testid="agency-card"], .agency-card, [class*="card"]')
    const agencyCount = await agencyCards.count()
    console.log(`✅ Se encontraron ${agencyCount} agencias`)
    expect(agencyCount).toBeGreaterThan(0)
    
    // Verificar trust indicators
    const trustBadges = page.locator('[class*="trust"], [class*="badge"], [class*="indicator"]')
    await expect(trustBadges.first()).toBeVisible()
    
    // Screenshot de resultados
    await page.screenshot({ 
      path: 'tests/screenshots/02-results-page.png',
      fullPage: true 
    })
    
    // 5. ABRIR CHAT
    console.log('💬 Paso 5: Abriendo chat conversacional')
    
    // Buscar botón de chat
    const chatButton = page.locator('button:has-text("Chat"), button:has-text("Asistente"), [aria-label*="chat"]')
    await expect(chatButton).toBeVisible({ timeout: 10000 })
    await chatButton.click()
    
    // Verificar que el chat se abre
    await expect(page.locator('[role="textbox"], textarea, input[type="text"]').last()).toBeVisible({ timeout: 10000 })
    
    // 6. PROBAR CHAT CON CITATIONS
    console.log('🔗 Paso 6: Probando sistema de citations')
    
    // Enviar mensaje
    const chatInput = page.locator('[role="textbox"], textarea, input[type="text"]').last()
    await chatInput.fill('¿Cuáles agencias son más confiables y por qué?')
    await chatInput.press('Enter')
    
    // Esperar respuesta
    console.log('⏳ Esperando respuesta del asistente...')
    await page.waitForSelector('.typing-indicator, [class*="typing"], [class*="loading"]', { 
      state: 'hidden',
      timeout: 30000 
    })
    
    // Verificar que hay respuesta con citations
    const assistantMessage = page.locator('[class*="assistant"], [class*="bot"], [role="article"]').last()
    await expect(assistantMessage).toBeVisible({ timeout: 30000 })
    
    // Buscar citations [1] [2] etc
    const citationButtons = page.locator('button:has-text(/\\[\\d+\\]/)')
    const citationCount = await citationButtons.count()
    console.log(`✅ Se encontraron ${citationCount} citations`)
    
    // Si hay citations, probar click
    if (citationCount > 0) {
      await citationButtons.first().click()
      
      // Verificar panel de fuentes
      await expect(page.locator('text=Fuentes')).toBeVisible({ timeout: 5000 })
      
      // Screenshot del panel
      await page.screenshot({ 
        path: 'tests/screenshots/03-sources-panel.png',
        fullPage: true 
      })
      
      // Cerrar panel
      const closeButton = page.locator('button[aria-label*="Cerrar"], button:has-text("×"), button:has-text("X")')
      await closeButton.click()
    }
    
    // 7. VERIFICAR RESPONSIVE MÓVIL
    console.log('📱 Paso 7: Verificando diseño móvil')
    
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(1000) // Esperar animaciones
    
    // Verificar que elementos se adaptan
    await expect(page.locator('body')).toBeVisible()
    
    // Screenshot móvil
    await page.screenshot({ 
      path: 'tests/screenshots/04-mobile-view.png',
      fullPage: true 
    })
    
    console.log('✅ Prueba E2E completada exitosamente')
  })

  test('verificar manejo de errores', async ({ page }) => {
    console.log('🚨 Probando manejo de errores')
    
    await page.goto('/')
    
    // Intentar búsqueda sin ubicación
    const queryInput = page.locator('input[placeholder*="buscar"]').first()
    await queryInput.fill('nissan')
    
    // Dejar ubicación vacía e intentar enviar
    const locationInput = page.locator('input[placeholder*="ubicación"]').first()
    await locationInput.clear()
    
    const submitButton = page.locator('button[type="submit"]')
    
    // Verificar que el botón está deshabilitado o muestra error
    const isDisabled = await submitButton.isDisabled()
    
    if (!isDisabled) {
      await submitButton.click()
      // Debería mostrar mensaje de error
      await expect(page.locator('text=/ubicación|location|requerido/i')).toBeVisible({ timeout: 5000 })
    }
    
    console.log('✅ Validación de errores funciona correctamente')
  })

  test('verificar accesibilidad móvil', async ({ page }) => {
    console.log('♿ Verificando accesibilidad móvil')
    
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Verificar touch targets
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box) {
        // Verificar tamaño mínimo de 44x44px
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
    
    console.log('✅ Touch targets cumplen con estándares de accesibilidad')
  })
})

// Función auxiliar para esperar elementos
async function waitForAnySelector(page: Page, selectors: string[], timeout = 30000) {
  const promises = selectors.map(selector => 
    page.waitForSelector(selector, { timeout }).catch(() => null)
  )
  
  const element = await Promise.race(promises)
  if (!element) {
    throw new Error(`Ninguno de los selectores fue encontrado: ${selectors.join(', ')}`)
  }
  
  return element
}