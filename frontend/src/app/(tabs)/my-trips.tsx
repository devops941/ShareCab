import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function MyTripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('All');
  const [userRole, setUserRole] = useState('driver');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      if (role) setUserRole(role);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) setCurrentUserId(userId);

      let endpoint = ENDPOINTS.ALL_TRIPS;
      if (role === 'driver' && userId) {
        endpoint = ENDPOINTS.DRIVER_TRIPS(userId);
      } else if (role === 'customer' && userId) {
        endpoint = ENDPOINTS.CUSTOMER_TRIPS(userId);
      }

      const response = await apiClient.get(endpoint);
      if (response.status === 200) {
        setTrips(response.data);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const handleManageTrip = (trip: any) => {
    if (userRole === 'driver') {
      router.push({ pathname: '/add-trip', params: { trip: JSON.stringify(trip) } });
    } else {
      router.push({ pathname: '/ride-details', params: { ride: JSON.stringify(trip), isEditing: 'true' } });
    }
  };

  const handleUpdateStatus = async (tripId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(ENDPOINTS.UPDATE_TRIP_STATUS(tripId), { status: newStatus });
      if (response.status === 200) {
        fetchTrips(); // refresh the list
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update status.';
      Alert.alert('Error', errorMsg);
    }
  };

  const confirmUpdateStatus = (tripId: string, newStatus: string) => {
    const title = newStatus === 'inprogress' ? 'Start Ride' : 'Complete Ride';
    const message = newStatus === 'inprogress'
      ? 'Are you sure you want to start this ride now?'
      : 'Are you sure you want to mark this ride as completed?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => handleUpdateStatus(tripId, newStatus) }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inprogress': return '#FF9500'; // Orange
      case 'completed': return '#8E8E93'; // Gray
      case 'cancelled': return '#E53935'; // Red
      default: return '#0A8A4D'; // Green for upcoming
    }
  };

  const filteredTrips = trips.filter((trip: any) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return trip.status === 'upcoming' || !trip.status;
    if (filter === 'Completed') return trip.status === 'completed';
    if (filter === 'Cancelled') return trip.status === 'cancelled';
    return true;
  });

  const FILTERS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
        {userRole === 'driver' && (
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => router.push('/add-trip')}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredTrips.length === 0 ? (
          <Text style={styles.emptyText}>No trips found for this filter.</Text>
        ) : (
          filteredTrips.map((trip: any, index: number) => (
            <View key={trip._id || index}>
              {userRole === 'driver' ? (
                // --- DRIVER CARD STYLE ---
                <View style={styles.tripCard}>
                  <TouchableOpacity
                    style={styles.tripCardTop}
                    onPress={() => {
                      if (trip.status !== 'cancelled') handleManageTrip(trip);
                    }}
                  >
                    {trip.driverId?.carImage ? (
                      <Image
                        source={{ uri: trip.driverId.carImage }}
                        style={styles.vehiclePic}
                      />
                    ) : (
                      <View style={[styles.vehiclePic, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="car-sport" size={24} color="#999" />
                      </View>
                    )}
                    <View style={styles.tripDetails}>
                      <Text style={styles.tripRoute}>{trip.from} ➔ {trip.to}</Text>
                      {trip.driverId?.carModel ? (
                        <Text style={styles.carModelText}>🚗 {trip.driverId.carModel} {trip.driverId?.vehicleNumber ? `(${trip.driverId.vehicleNumber})` : ''}</Text>
                      ) : null}
                      <Text style={styles.tripDate}>{trip.date} | {trip.time}</Text>
                      {trip.status === 'cancelled' ? (
                        <Text style={{ color: '#E53935', fontWeight: 'bold', marginTop: 4, fontSize: 13 }}>
                          Trip Cancelled (₹0 Earned)
                        </Text>
                      ) : (
                        <Text style={styles.tripSeats}>{trip.seats} seats available</Text>
                      )}
                      <Text style={[styles.tripAmount, trip.status === 'cancelled' && { color: '#999', textDecorationLine: 'line-through' }]}>
                        ₹ {trip.amount}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.tripCardBottom}>
                    <TouchableOpacity
                      style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status || 'upcoming') }]}
                      onPress={() => {
                        const currentStatus = trip.status || 'upcoming';
                        if (currentStatus === 'upcoming') {
                          confirmUpdateStatus(trip._id, 'inprogress');
                        } else if (currentStatus === 'inprogress') {
                          confirmUpdateStatus(trip._id, 'completed');
                        }
                      }}
                      disabled={trip.status === 'completed' || trip.status === 'cancelled'}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.statusBadgeText}>
                        {trip.status === 'inprogress' ? 'In Progress' : (trip.status === 'cancelled' ? 'CANCELLED' : (trip.status || 'Upcoming').toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // --- CUSTOMER CARD STYLE (TICKET LIKE) ---
                (() => {
                  let seatsBooked = 0;
                  if (trip.passengers && currentUserId) {
                    trip.passengers.forEach((p: any) => {
                      const pId = (typeof p === 'object' && p !== null) ? (p._id || p.id) : p;
                      if (String(pId) === String(currentUserId)) {
                        seatsBooked++;
                      }
                    });
                  }
                  if (seatsBooked === 0) seatsBooked = 1; // Fallback
                  
                  const totalFare = seatsBooked * trip.amount;

                  return (
                    <View style={styles.customerTripCard}>
                      <TouchableOpacity
                        onPress={() => {
                          if (trip.status !== 'cancelled') handleManageTrip(trip);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.customerCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {trip.driverId?.profileImage ? (
                              <Image source={{ uri: trip.driverId.profileImage }} style={styles.customerDriverAvatar} />
                            ) : (
                              <View style={[styles.customerDriverAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' }]}>
                                <Ionicons name="person" size={20} color="#94A3B8" />
                              </View>
                            )}
                            <View style={{ marginLeft: 12 }}>
                              <Text style={styles.customerDriverName}>{trip.driverId?.name || 'Your Driver'}</Text>
                              <Text style={styles.customerRating}>★ 4.8</Text>
                            </View>
                          </View>
                          <View style={[styles.customerStatusPill, { backgroundColor: getStatusColor(trip.status || 'upcoming') + '20' }]}>
                            <Text style={[styles.customerStatusText, { color: getStatusColor(trip.status || 'upcoming') }]}>
                              {(trip.status || 'upcoming').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.customerRouteSection}>
                          <View style={styles.customerRouteLine} />
                          <View style={styles.customerRoutePoint}>
                            <View style={[styles.customerRouteDot, { borderColor: '#10B981' }]} />
                            <Text style={styles.customerRouteText}>{trip.from}</Text>
                          </View>
                          <View style={[styles.customerRoutePoint, { marginTop: 16 }]}>
                            <View style={[styles.customerRouteDot, { borderColor: '#EF4444' }]} />
                            <Text style={styles.customerRouteText}>{trip.to}</Text>
                          </View>
                        </View>

                        <View style={styles.customerTicketDivider}>
                          <View style={styles.customerTicketNotchLeft} />
                          <View style={styles.customerTicketDashedLine} />
                          <View style={styles.customerTicketNotchRight} />
                        </View>

                        <View style={styles.customerCardFooter}>
                          <View>
                            <Text style={styles.customerFooterLabel}>Date & Time</Text>
                            <Text style={styles.customerFooterValue}>{trip.date} • {trip.time}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.customerFooterLabel}>
                              {seatsBooked > 1 ? `${seatsBooked} Tickets` : '1 Ticket'}
                            </Text>
                            <Text style={styles.customerFareValue}>₹{totalFare}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })()
              )}
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
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerAddBtn: {
    backgroundColor: '#0A8A4D',
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',

  },
  filterTabActive: {
    backgroundColor: '#0A8A4D',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tripCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehiclePic: {
    width: 60,
    height: 50,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#F0F0F0',
  },
  driverPicSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
  },
  tripDetails: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  carModelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A8A4D',
    marginBottom: 2,
  },
  tripDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  tripSeats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  tripAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A8A4D',
    marginTop: 4,
  },
  tripCardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerTripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  customerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  customerDriverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customerDriverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  customerRating: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
  customerStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customerStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  customerRouteSection: {
    padding: 16,
    position: 'relative',
  },
  customerRouteLine: {
    position: 'absolute',
    left: 21,
    top: 26,
    bottom: 26,
    width: 2,
    backgroundColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  customerRoutePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerRouteDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    zIndex: 2,
  },
  customerRouteText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  customerTicketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  customerTicketNotchLeft: {
    width: 10,
    height: 20,
    backgroundColor: '#F5F7F9',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 0,
  },
  customerTicketNotchRight: {
    width: 10,
    height: 20,
    backgroundColor: '#F5F7F9',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    borderRightWidth: 0,
  },
  customerTicketDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  customerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  customerFooterLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  customerFooterValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  customerFareValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
});
