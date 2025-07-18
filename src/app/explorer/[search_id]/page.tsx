import { notFound } from 'next/navigation'
import { getSearchData } from '@/lib/search-data'
import ExplorerResultsMobile from './ExplorerResultsMobile'

interface PageProps {
  params: {
    search_id: string
  }
}

export default async function ExplorerSearchPage({ params }: PageProps) {
  const { search_id } = await params
  
  try {
    // Load search from database using new model
    const searchHistory = await getSearchData(search_id)
    
    if (!searchHistory) {
      notFound()
    }
    
    // Extract data from resultsJson
    const searchData = searchHistory.resultsJson as any
    
    // Debug: Log search data structure
    console.log('🔍 page.tsx - searchHistory.resultsJson:', searchHistory.resultsJson)
    console.log('🔍 page.tsx - searchData:', searchData)
    
    // La estructura real es metadata.results.agencies
    // porque en search-tracking.ts se guarda como metadata.results = results
    // y en page.tsx se envía como results: { agencies: [...] }
    const agencies = searchData?.results?.agencies || searchData?.agencies || []
    const coordinates = searchData?.coordinates || searchData?.results?.coordinates
    
    console.log('🔍 page.tsx - agencies extracted:', agencies)
    console.log('🔍 page.tsx - coordinates:', coordinates)
    
    return (
      <ExplorerResultsMobile
        searchId={search_id}
        location={searchHistory.location}
        query={searchHistory.query}
        agencies={agencies}
        searchCoordinates={coordinates}
        isAuthenticated={!!searchHistory.userId}
      />
    )
  } catch (error) {
    console.error('Error loading search:', error)
    notFound()
  }
}