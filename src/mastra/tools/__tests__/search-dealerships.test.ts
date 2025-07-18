/**
 * @fileoverview Tests para la herramienta searchDealerships
 * @module mastra/tools/__tests__/search-dealerships.test
 */

import { searchDealerships } from '../search-dealerships'

describe('searchDealerships tool', () => {
  it('debe tener la configuración correcta', () => {
    expect(searchDealerships.id).toBe('search_dealerships')
    expect(searchDealerships.name).toBe('Buscar Concesionarios')
    expect(searchDealerships.execute).toBeDefined()
  })

  it('debe incluir _sources en el schema de salida', () => {
    // Verificar que el outputSchema incluye _sources
    const outputShape = searchDealerships.outputSchema?.shape
    expect(outputShape).toBeDefined()
    expect(outputShape?._sources).toBeDefined()
  })
})