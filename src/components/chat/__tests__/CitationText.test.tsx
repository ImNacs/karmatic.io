/**
 * @fileoverview Tests para el componente CitationText
 * @module components/chat/__tests__/CitationText.test
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CitationText, useCitationIndices } from '../CitationText'
import { renderHook } from '@testing-library/react'

describe('CitationText', () => {
  const mockCitations = [
    {
      id: '1',
      url: 'https://google.com/maps',
      title: 'Google Maps',
      type: 'google_places' as const
    },
    {
      id: '2',
      url: 'https://nissan.mx',
      title: 'Nissan México',
      type: 'website' as const
    }
  ]

  it('renderiza texto sin citations correctamente', () => {
    render(<CitationText text="Texto sin citations" />)
    expect(screen.getByText('Texto sin citations')).toBeInTheDocument()
  })

  it('renderiza texto con citations como botones', () => {
    render(
      <CitationText 
        text="Encontré 5 agencias[1] en tu zona[2]" 
        citations={mockCitations}
      />
    )
    
    expect(screen.getByText('Encontré 5 agencias')).toBeInTheDocument()
    expect(screen.getByText('[1]')).toBeInTheDocument()
    expect(screen.getByText('en tu zona')).toBeInTheDocument()
    expect(screen.getByText('[2]')).toBeInTheDocument()
  })

  it('llama onCitationClick cuando se hace click en una citation', () => {
    const handleClick = jest.fn()
    
    render(
      <CitationText 
        text="Texto con citation[1]" 
        citations={mockCitations}
        onCitationClick={handleClick}
      />
    )
    
    fireEvent.click(screen.getByText('[1]'))
    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('los botones de citation tienen el tamaño mínimo de 44px', () => {
    render(
      <CitationText 
        text="Citation[1]" 
        citations={mockCitations}
      />
    )
    
    const button = screen.getByText('[1]')
    expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]')
  })

  it('deshabilita citations sin fuente correspondiente', () => {
    render(
      <CitationText 
        text="Citation sin fuente[3]" 
        citations={mockCitations} // Solo hay 2 citations
      />
    )
    
    const button = screen.getByText('[3]')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50')
  })
})

describe('useCitationIndices', () => {
  it('extrae índices de citations del texto', () => {
    const { result } = renderHook(() => 
      useCitationIndices('Texto con [1] y [2] y otra vez [1]')
    )
    
    expect(result.current).toEqual([1, 2])
  })

  it('retorna array vacío si no hay citations', () => {
    const { result } = renderHook(() => 
      useCitationIndices('Texto sin citations')
    )
    
    expect(result.current).toEqual([])
  })
})