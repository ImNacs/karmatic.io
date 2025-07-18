import * as z from "zod"

/**
 * Search form validation schema
 * 
 * @description
 * Defines validation rules for the search form:
 * - Location is required with minimum 1 character
 * - Query is optional for flexible search
 */
export const searchSchema = z.object({
  location: z.string().min(1, "La ubicación es requerida"),
  query: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === '') return true; // Vacío es válido
      
      // Lista de términos NO automotrices comunes
      const nonAutoTerms = [
        'pizza', 'comida', 'restaurante', 'doctor', 'médico', 'hospital',
        'gimnasio', 'gym', 'hotel', 'farmacia', 'banco', 'atm', 'cajero',
        'escuela', 'universidad', 'super', 'mercado', 'tienda', 'ropa'
      ];
      
      const queryLower = val.toLowerCase();
      return !nonAutoTerms.some(term => queryLower.includes(term));
    },
    {
      message: "Parece que buscas algo no relacionado con agencias automotrices. Intenta con marcas o modelos de autos."
    }
  ),
})

/**
 * Type inference from search schema
 */
export type SearchFormData = z.infer<typeof searchSchema>

/**
 * Validation messages for different scenarios
 */
export const VALIDATION_MESSAGES = {
  locationRequired: "La ubicación es requerida",
  locationTooShort: "Ingresa al menos 3 caracteres",
  queryTooLong: "La búsqueda es muy larga (máximo 100 caracteres)",
  invalidLocation: "Ubicación no válida",
} as const