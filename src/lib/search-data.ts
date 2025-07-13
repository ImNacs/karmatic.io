import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get search data from conversation
 */
export async function getSearchData(conversationId: string) {
  try {
    // Get conversation messages
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId
    })
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return null
    }
    
    // Get the first message (search) 
    const firstMessage = data[0]
    const searchMetadata = firstMessage.metadata?.search || {}
    
    // Get conversation details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()
    
    // Get user details if available
    let user = null
    if (conversation?.user_id) {
      const { data: userData } = await supabase
        .from('User')
        .select('id, firstName, lastName')
        .eq('id', conversation.user_id)
        .single()
      user = userData
    }
    
    // Ensure we include the full metadata with lat/lng
    const resultsJson = {
      ...firstMessage.metadata,
      // Ensure results are included if they exist
      results: firstMessage.metadata?.results || {},
      // Ensure coordinates are accessible at the top level
      coordinates: {
        lat: firstMessage.metadata?.lat || firstMessage.metadata?.results?.coordinates?.lat || null,
        lng: firstMessage.metadata?.lng || firstMessage.metadata?.results?.coordinates?.lng || null
      }
    }
    
    return {
      id: conversationId,
      location: searchMetadata.location || '',
      query: searchMetadata.query || null,
      userId: conversation?.user_id || null,
      user: user,
      resultsJson: resultsJson,
      createdAt: conversation?.created_at || new Date()
    }
    
  } catch (error) {
    console.error('Error getting search data:', error)
    return null
  }
}