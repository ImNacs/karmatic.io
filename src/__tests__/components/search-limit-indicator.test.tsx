import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { SearchLimitIndicator } from '@/components/search-limit-indicator';

describe('SearchLimitIndicator', () => {
  it('should display remaining searches', () => {
    render(<SearchLimitIndicator remaining={1} total={1} />);
    
    expect(screen.getByText('1 búsqueda gratuita restante')).toBeInTheDocument();
  });

  it('should show plural form for multiple searches', () => {
    render(<SearchLimitIndicator remaining={3} total={5} />);
    
    expect(screen.getByText('3 búsquedas gratuitas restantes')).toBeInTheDocument();
  });

  it('should show warning when no searches remaining', () => {
    render(<SearchLimitIndicator remaining={0} total={1} />);
    
    expect(screen.getByText('Sin búsquedas restantes')).toBeInTheDocument();
    expect(screen.getByText('Regístrate para búsquedas ilimitadas')).toBeInTheDocument();
  });

  it('should show correct progress bar', () => {
    const { container } = render(<SearchLimitIndicator remaining={2} total={5} />);
    
    // Progress should be 40% (2/5)
    const progressBar = container.querySelector('[style*="scaleX(0.4)"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should have correct color based on remaining searches', () => {
    const { rerender } = render(<SearchLimitIndicator remaining={1} total={1} />);
    
    // Should have success color when searches available
    expect(screen.getByText('1 búsqueda gratuita restante').parentElement)
      .toHaveClass('text-green-600');
    
    // Should have error color when no searches
    rerender(<SearchLimitIndicator remaining={0} total={1} />);
    expect(screen.getByText('Sin búsquedas restantes').parentElement)
      .toHaveClass('text-red-600');
  });
});