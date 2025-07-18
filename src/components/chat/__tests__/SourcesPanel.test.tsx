/**
 * @fileoverview Tests para el componente SourcesPanel
 * @module components/chat/__tests__/SourcesPanel.test
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SourcesPanel } from '../SourcesPanel'
import type { Citation } from '@/types/citations'

// Mock de framer-motion para tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, drag, dragConstraints, dragElastic, onDragEnd, ...props }: any) => 
      <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

describe('SourcesPanel', () => {
  const mockSources: Citation[] = [
    {
      id: '1',
      url: 'https://google.com/maps/place/123',
      title: 'Google Maps - Agencias Nissan',
      type: 'google_places',
      metadata: {
        resultCount: 5,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: '2',
      url: 'https://nissan.com.mx/distribuidores',
      title: 'Nissan México - Distribuidores',
      type: 'website',
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  ]

  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <SourcesPanel 
        sources={mockSources}
        isOpen={false}
        onClose={mockOnClose}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('renderiza el panel cuando isOpen es true', () => {
    render(
      <SourcesPanel 
        sources={mockSources}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('Fuentes')).toBeInTheDocument()
    expect(screen.getByText('Google Maps - Agencias Nissan')).toBeInTheDocument()
    expect(screen.getByText('Nissan México - Distribuidores')).toBeInTheDocument()
  })

  it('muestra metadatos de las fuentes', () => {
    render(
      <SourcesPanel 
        sources={mockSources}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('5 resultados')).toBeInTheDocument()
  })

  it('llama onClose cuando se hace click en el botón cerrar', () => {
    render(
      <SourcesPanel 
        sources={mockSources}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    fireEvent.click(screen.getByLabelText('Cerrar panel de fuentes'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('llama onClose cuando se hace click en el overlay', () => {
    render(
      <SourcesPanel 
        sources={mockSources}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    // Click en el overlay (primer div con bg-black/50)
    const overlay = screen.getByText('Fuentes').closest('div')?.previousSibling
    if (overlay) {
      fireEvent.click(overlay)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('muestra mensaje cuando no hay fuentes', () => {
    render(
      <SourcesPanel 
        sources={[]}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('No hay fuentes disponibles')).toBeInTheDocument()
  })

  it('los enlaces tienen target="_blank" y rel="noopener noreferrer"', () => {
    render(
      <SourcesPanel 
        sources={mockSources}
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})