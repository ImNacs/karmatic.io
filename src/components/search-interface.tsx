"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { FiSearch } from "react-icons/fi"
import { motion } from "motion/react"
import type { SearchData } from "@/types/agency"
import { LocationAutocomplete } from "@/components/location-autocomplete"
import type { PlacePrediction } from "@/lib/google-places"

const searchSchema = z.object({
  location: z.string().min(1, "La ubicación es requerida"),
  query: z.string().optional(),
})

type SearchFormData = z.infer<typeof searchSchema>

interface SearchInterfaceProps {
  onSearch: (data: SearchData) => void
  isLoading?: boolean
}

export function SearchInterface({ onSearch, isLoading = false }: SearchInterfaceProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null)
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{ lat: number; lng: number } | null>(null)

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      location: "",
      query: "",
    },
  })

  const handleSubmit = (data: SearchFormData) => {
    onSearch({
      ...data,
      placeId: selectedPlace?.place_id,
      placeDetails: selectedPlace ? {
        description: selectedPlace.description,
        mainText: selectedPlace.structured_formatting.main_text,
        secondaryText: selectedPlace.structured_formatting.secondary_text,
      } : undefined,
      // Include coordinates if using current location
      coordinates: currentLocationCoords || undefined,
    })
  }

  const handlePlaceSelect = (place: PlacePrediction) => {
    setSelectedPlace(place)
    // Reset current location coords when selecting a place
    setCurrentLocationCoords(null)
  }

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    setCurrentLocationCoords(coords)
    // Reset selected place when using current location
    setSelectedPlace(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto p-4"
    >
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Encuentra las mejores agencias automotrices
          </CardTitle>
          <CardDescription>
            Explora, analiza y selecciona las agencias más confiables cerca de ti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      ¿Dónde quieres buscar?
                    </FormLabel>
                    <FormControl>
                      <LocationAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        onPlaceSelect={handlePlaceSelect}
                        onLocationSelect={handleLocationSelect}
                        placeholder="Ingresa tu ubicación"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      ¿Qué auto estás buscando? (opcional)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="KIA Forte 2018, Autos de 250 mil pesos"
                          className="pl-10 h-12 text-base"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Buscando agencias...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FiSearch className="h-4 w-4" />
                    <span>Buscar agencias</span>
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}