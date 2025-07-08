import { test, expect } from '@playwright/test'

test.describe('Desktop Map Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('should display desktop-optimized layout on large screens', async ({ page }) => {
    // Check that desktop component is rendered
    await expect(page.locator('[data-testid="desktop-map"]')).toBeVisible()
    
    // Verify split view with sidebar and map
    await expect(page.locator('[data-testid="agency-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    
    // Check header toolbar
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="view-mode-toggle"]')).toBeVisible()
    await expect(page.locator('[data-testid="filters-button"]')).toBeVisible()
  })

  test('should show enhanced markers with rating information', async ({ page }) => {
    // Wait for markers to load
    await page.waitForSelector('[data-testid="agency-marker"]')
    
    // Check marker content
    const marker = page.locator('[data-testid="agency-marker"]').first()
    await expect(marker).toContainText(/\d\.\d/) // Rating
    await expect(marker).toContainText('reseñas')
  })

  test('should display agency list in sidebar', async ({ page }) => {
    // Check agency list items
    const agencyItems = page.locator('[data-testid="agency-list-item"]')
    await expect(agencyItems).toHaveCount(await agencyItems.count())
    
    // Verify agency card content
    const firstAgency = agencyItems.first()
    await expect(firstAgency.locator('[data-testid="agency-name"]')).toBeVisible()
    await expect(firstAgency.locator('[data-testid="agency-rating"]')).toBeVisible()
    await expect(firstAgency.locator('[data-testid="agency-reviews"]')).toBeVisible()
    await expect(firstAgency.locator('[data-testid="agency-distance"]')).toBeVisible()
  })

  test('should highlight marker on agency hover', async ({ page }) => {
    const firstAgency = page.locator('[data-testid="agency-list-item"]').first()
    const agencyId = await firstAgency.getAttribute('data-agency-id')
    
    // Hover over agency in list
    await firstAgency.hover()
    
    // Check corresponding marker is highlighted
    const marker = page.locator(`[data-testid="agency-marker"][data-agency-id="${agencyId}"]`)
    await expect(marker).toHaveClass(/hover|highlighted/)
  })

  test('should open detailed panel on marker click', async ({ page }) => {
    // Click on a marker
    await page.locator('[data-testid="agency-marker"]').first().click()
    
    // Check detail panel appears
    await expect(page.locator('[data-testid="agency-detail-panel"]')).toBeVisible()
    
    // Verify panel content
    const detailPanel = page.locator('[data-testid="agency-detail-panel"]')
    await expect(detailPanel.locator('[data-testid="agency-name"]')).toBeVisible()
    await expect(detailPanel.locator('[data-testid="tabs"]')).toBeVisible()
    
    // Check tabs
    await expect(detailPanel.locator('[data-testid="tab-overview"]')).toBeVisible()
    await expect(detailPanel.locator('[data-testid="tab-reviews"]')).toBeVisible()
    await expect(detailPanel.locator('[data-testid="tab-details"]')).toBeVisible()
  })

  test('should switch between view modes', async ({ page }) => {
    // Test split view (default)
    await expect(page.locator('[data-testid="agency-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    
    // Switch to map only
    await page.locator('[data-testid="view-mode-map"]').click()
    await expect(page.locator('[data-testid="agency-sidebar"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
    
    // Switch to list only
    await page.locator('[data-testid="view-mode-list"]').click()
    await expect(page.locator('[data-testid="agency-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="map-container"]')).not.toBeVisible()
  })

  test('should filter agencies by search term', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="agency-list-item"]').count()
    
    // Search for specific term
    await searchInput.fill('MG')
    await searchInput.press('Enter')
    
    // Check filtered results
    const filteredCount = await page.locator('[data-testid="agency-list-item"]').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
    
    // Verify all results contain search term
    const agencies = page.locator('[data-testid="agency-list-item"]')
    for (let i = 0; i < await agencies.count(); i++) {
      const text = await agencies.nth(i).textContent()
      expect(text?.toLowerCase()).toContain('mg')
    }
  })

  test('should select agencies for analysis', async ({ page }) => {
    // Select first agency
    const firstAgency = page.locator('[data-testid="agency-list-item"]').first()
    await firstAgency.locator('[data-testid="select-button"]').click()
    
    // Check selection state
    await expect(firstAgency).toHaveClass(/selected/)
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('1')
    
    // Select second agency
    const secondAgency = page.locator('[data-testid="agency-list-item"]').nth(1)
    await secondAgency.locator('[data-testid="select-button"]').click()
    
    // Check analysis button is enabled
    const analyzeButton = page.locator('[data-testid="analyze-button"]')
    await expect(analyzeButton).toBeEnabled()
    await expect(analyzeButton).toContainText('2')
  })

  test('should open comparison modal with multiple selections', async ({ page }) => {
    // Select 2 agencies
    await page.locator('[data-testid="agency-list-item"]').first().locator('[data-testid="select-button"]').click()
    await page.locator('[data-testid="agency-list-item"]').nth(1).locator('[data-testid="select-button"]').click()
    
    // Click compare button
    await page.locator('[data-testid="compare-button"]').click()
    
    // Check comparison modal
    await expect(page.locator('[data-testid="comparison-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="comparison-metrics"]')).toBeVisible()
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Click on first marker to open detail
    await page.locator('[data-testid="agency-marker"]').first().click()
    await expect(page.locator('[data-testid="agency-detail-panel"]')).toBeVisible()
    
    // Press Escape to close
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="agency-detail-panel"]')).not.toBeVisible()
    
    // Select agencies and use Ctrl+Enter to analyze
    await page.locator('[data-testid="agency-list-item"]').first().locator('[data-testid="select-button"]').click()
    await page.keyboard.press('Control+Enter')
    
    // Should trigger analysis (check for loading state or redirect)
    await expect(page.locator('[data-testid="analyze-button"]')).toHaveAttribute('disabled')
  })

  test('should change map type', async ({ page }) => {
    // Click satellite view
    await page.locator('[data-testid="map-type-satellite"]').click()
    
    // Verify map type changed (this would need actual Google Maps API check)
    await expect(page.locator('[data-testid="map-type-satellite"]')).toHaveClass(/active|selected/)
    
    // Switch to terrain
    await page.locator('[data-testid="map-type-terrain"]').click()
    await expect(page.locator('[data-testid="map-type-terrain"]')).toHaveClass(/active|selected/)
  })

  test('should fit bounds to show all agencies', async ({ page }) => {
    // Click fit bounds button
    await page.locator('[data-testid="fit-bounds-button"]').click()
    
    // Check all markers are visible (would need viewport intersection check)
    const markers = page.locator('[data-testid="agency-marker"]')
    const markerCount = await markers.count()
    
    for (let i = 0; i < markerCount; i++) {
      await expect(markers.nth(i)).toBeInViewport()
    }
  })

  test('should toggle filters panel', async ({ page }) => {
    // Initially hidden
    await expect(page.locator('[data-testid="filters-panel"]')).not.toBeVisible()
    
    // Click filters button
    await page.locator('[data-testid="filters-button"]').click()
    
    // Check filters panel appears
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible()
    
    // Verify filter options
    await expect(page.locator('[data-testid="filter-rating"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-distance"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-open-now"]')).toBeVisible()
  })

  test('should preserve state when switching view modes', async ({ page }) => {
    // Select an agency
    await page.locator('[data-testid="agency-list-item"]').first().locator('[data-testid="select-button"]').click()
    
    // Switch to map only
    await page.locator('[data-testid="view-mode-map"]').click()
    
    // Switch back to split
    await page.locator('[data-testid="view-mode-split"]').click()
    
    // Check selection is preserved
    await expect(page.locator('[data-testid="agency-list-item"]').first()).toHaveClass(/selected/)
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('1')
  })
})