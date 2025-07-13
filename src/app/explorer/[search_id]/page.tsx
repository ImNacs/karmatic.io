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
    const agencies = searchData?.agencies || searchData?.results?.agencies || []
    const coordinates = searchData?.coordinates || searchData?.results?.coordinates
    
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