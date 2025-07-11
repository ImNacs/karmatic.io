import { test, expect } from '@playwright/test'

test.describe('AI Assistant', () => {
  test('should show chat panel when clicking floating button on search page', async ({ page }) => {
    // Navigate to a search results page
    await page.goto('http://localhost:3001/explorer/cmcyh6zot0001ctz25ad5dvk0')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if floating AI button is visible
    const floatingButton = page.locator('button').filter({ hasText: /AI Assistant|Sparkles/ }).or(
      page.locator('button:has(svg.lucide-sparkles)').or(
        page.locator('button').filter({ has: page.locator('svg[class*="w-6"][class*="h-6"]') })
      )
    )
    
    // Debug: Take screenshot before clicking
    await page.screenshot({ path: 'before-click.png', fullPage: true })
    
    // Check if button exists
    const buttonCount = await floatingButton.count()
    console.log('Found buttons:', buttonCount)
    
    if (buttonCount > 0) {
      // Log button details
      const buttonBox = await floatingButton.first().boundingBox()
      console.log('Button location:', buttonBox)
      
      // Click the floating button
      await floatingButton.first().click({ force: true })
      
      // Wait a bit for animation
      await page.waitForTimeout(1000)
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-click.png', fullPage: true })
      
      // Check if chat panel is visible
      const chatPanel = page.locator('[role="dialog"], .fixed.inset-0, div:has(> div > h2:text("AI Assistant"))')
      const isPanelVisible = await chatPanel.isVisible()
      
      console.log('Is panel visible:', isPanelVisible)
      
      // Check for backdrop
      const backdrop = page.locator('.bg-black\\/40, .backdrop-blur-sm')
      const isBackdropVisible = await backdrop.isVisible()
      console.log('Is backdrop visible:', isBackdropVisible)
      
      // Check console errors
      page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()))
      
      // Expect panel to be visible
      expect(isPanelVisible).toBeTruthy()
    } else {
      throw new Error('AI Assistant floating button not found on search page')
    }
  })
  
  test('should NOT show floating button on home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3001/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check that floating AI button is NOT visible
    const floatingButton = page.locator('button:has(svg.lucide-sparkles)').or(
      page.locator('button').filter({ has: page.locator('svg[class*="w-6"][class*="h-6"]') })
    )
    
    const buttonCount = await floatingButton.count()
    console.log('Buttons found on home page:', buttonCount)
    
    // Expect no AI button on home page
    expect(buttonCount).toBe(0)
  })
})