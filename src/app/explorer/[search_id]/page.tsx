import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ExplorerResults from './ExplorerResults'

interface PageProps {
  params: {
    search_id: string
  }
}

export default async function ExplorerSearchPage({ params }: PageProps) {
  const { search_id } = await params
  
  try {
    // Load search from database
    const searchHistory = await prisma.searchHistory.findUnique({
      where: { id: search_id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    if (!searchHistory) {
      notFound()
    }
    
    // Extract data from resultsJson
    const searchData = searchHistory.resultsJson as any
    const agencies = searchData?.agencies || []
    const coordinates = searchData?.coordinates
    
    return (
      <ExplorerResults
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