/**
 * Test específico para el problema del historial que no carga al refrescar
 */

import { describe, test, expect, beforeEach } from '@jest/globals'

describe('Historial de búsquedas - Problema de recarga', () => {
  const baseUrl = 'http://localhost:3001'
  let sessionCookie: string

  beforeEach(async () => {
    // Crear una búsqueda para generar session cookie
    const saveResponse = await fetch(`${baseUrl}/api/search/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'Test Location',
        query: 'Test Query'
      }),
      credentials: 'include'
    })
    
    expect(saveResponse.ok).toBe(true)
    
    // Extraer la cookie de sesión de la respuesta
    const setCookieHeader = saveResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      const match = setCookieHeader.match(/karmatic_search_session=([^;]+)/)
      if (match) {
        sessionCookie = `karmatic_search_session=${match[1]}`
      }
    }
  })

  test('El historial debería cargar con la cookie de sesión', async () => {
    const response = await fetch(`${baseUrl}/api/search/history`, {
      headers: {
        'Cookie': sessionCookie
      },
      credentials: 'include'
    })
    
    expect(response.ok).toBe(true)
    
    const data = await response.json()
    console.log('Historia con cookie:', data)
    
    expect(data.searches).toHaveLength(1)
    expect(data.searches[0].searches).toHaveLength(1)
    expect(data.searches[0].searches[0].location).toBe('Test Location')
  })

  test('El historial debería estar vacío sin cookie de sesión', async () => {
    const response = await fetch(`${baseUrl}/api/search/history`, {
      credentials: 'include'
    })
    
    expect(response.ok).toBe(true)
    
    const data = await response.json()
    console.log('Historia sin cookie:', data)
    
    // Sin la cookie correcta, debería estar vacío
    expect(data.searches).toHaveLength(0)
  })

  test('Verificar que la cookie se persiste entre requests', async () => {
    // Hacer una segunda búsqueda con la misma sesión
    const saveResponse = await fetch(`${baseUrl}/api/search/save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie 
      },
      body: JSON.stringify({
        location: 'Second Location',
        query: 'Second Query'
      }),
      credentials: 'include'
    })
    
    expect(saveResponse.ok).toBe(true)
    
    // Verificar que ahora hay 2 búsquedas en el historial
    const historyResponse = await fetch(`${baseUrl}/api/search/history`, {
      headers: { 'Cookie': sessionCookie },
      credentials: 'include'
    })
    
    const data = await historyResponse.json()
    console.log('Historia después de segunda búsqueda:', data)
    
    expect(data.total).toBe(2)
  })
})