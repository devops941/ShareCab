import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient, ENDPOINTS } from '../config/api';

export default function SearchResultsScreen() {
  const router = useRouter();
  const { from, to, date } = useLocalSearchParams();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, [from, to, date]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(ENDPOINTS.ALL_TRIPS);
      if (response.status === 200) {
        const allTrips = response.data;
        const searchFrom = (from as string)?.toLowerCase() || '';
        const searchTo = (to as string)?.toLowerCase() || '';
        const searchDateStr = (date as string) || '';

        const filtered = allTrips.filter((trip: any) => {
          const tripFrom = (trip.from || '').toLowerCase();
          const tripTo = (trip.to || '').toLowerCase();
          
          // Match locations
          const matchFrom = tripFrom.includes(searchFrom);
          const matchTo = tripTo.includes(searchTo);

          // Match date
          const matchDate = searchDateStr ? trip.date === searchDateStr : true;

          // Only upcoming
          const isUpcoming = !trip.status || trip.status === 'upcoming';

          return matchFrom && matchTo && matchDate && isUpcoming;
        });

        setRides(filtered);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064332" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Rides</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={styles.emptyText}>Searching for cabs...</Text>
        ) : rides.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming rides found for this route.</Text>
        ) : (
          rides.map((ride: any, index: number) => (
            <View key={ride._id || index} style={styles.rideCard}>
              <View style={styles.rideCardTop}>
                {/* Image & Plate */}
                <View style={styles.carSection}>
                  {ride.driverId?.carImage ? (
                    <Image
                      source={{ uri: ride.driverId.carImage }}
                      style={styles.carImage}
                    />
                  ) : (
                    <View style={[styles.carImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
                      <Ionicons name="car-sport" size={24} color="#999" />
                    </View>
                  )}
                  <Text style={styles.numberPlate}>{ride.driverId?.vehicleNumber || 'TN 01 AB 1234'}</Text>
                </View>

                {/* Details */}
                <View style={styles.detailsSection}>
                  <View style={styles.driverRow}>
                    <View>
                      <Text style={styles.driverName}>{ride.driverId?.name || 'Verified Driver'}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#FFA000" />
                        <Text style={styles.ratingText}>4.8 <Text style={styles.reviewsText}>(23)</Text></Text>
                      </View>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>₹ {ride.amount}</Text>
                      <Text style={styles.perSeatText}>per seat</Text>
                    </View>
                  </View>

                  <Text style={styles.routeText}>{ride.from} ➔ {ride.to}</Text>
                  <Text style={styles.dateTimeText}>{ride.date} | {ride.time}</Text>
                  
                  <Text style={styles.seatsAvailableText}>
                    {ride.seats} {ride.seats === 1 ? 'Seat' : 'Seats'} Available
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => router.push({ pathname: '/ride-details', params: { ride: JSON.stringify(ride) } })}
              >
                <Text style={styles.bookButtonText}>Book Seat</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  header: {
    backgroundColor: '#064332',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  rideCardTop: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  carSection: {
    alignItems: 'center',
    marginRight: 16,
    width: 90,
  },
  carImage: {
    width: 90,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
  },
  numberPlate: {
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
  },
  detailsSection: {
    flex: 1,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    color: '#888',
    fontWeight: 'normal',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  perSeatText: {
    fontSize: 10,
    color: '#888',
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  seatsAvailableText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A8A4D',
  },
  bookButton: {
    backgroundColor: '#00A859',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
