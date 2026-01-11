import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import ProviderTripDetail from '../../screens/provider-v2/ProviderTripDetail'

const TripDetailRoute: React.FC = () => {
  const { tripId } = useLocalSearchParams() as { tripId?: string }
  return <ProviderTripDetail tripId={tripId} showHeader />
}

export default TripDetailRoute
