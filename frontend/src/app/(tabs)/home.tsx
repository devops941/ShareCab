import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, StatusBar, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const CITIES = ['Chennai', 'Madurai', 'Trichy', 'Coimbatore', 'Salem', 'Bangalore', 'Kochi'];

export default function HomeScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [userRole, setUserRole] = useState('driver');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const filteredFromCities = CITIES.filter(city => city.toLowerCase().includes(searchFrom.toLowerCase()));
  const filteredToCities = CITIES.filter(city => city.toLowerCase().includes(searchTo.toLowerCase()));

  const handleSearch = () => {
    const formattedDate = searchDate ? searchDate.toLocaleDateString() : '';
    router.push(`/search-results?from=${searchFrom}&to=${searchTo}&date=${encodeURIComponent(formattedDate)}`);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setSearchDate(selectedDate);
  };

  const fetchTrips = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role || 'driver');
      const userId = await AsyncStorage.getItem('userId');

      if (role && userId) {
        try {
          const profileRes = await apiClient.get(ENDPOINTS.PROFILE(role, userId));
          if (profileRes.status === 200 && profileRes.data) {
            setUserProfile(profileRes.data);
          }
        } catch (e) {
          console.log('Profile fetch error on home:', e);
        }
      }

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
        fetchTrips();
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

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inprogress': return '#FF9500'; // Orange
      case 'completed': return '#8E8E93'; // Gray
      case 'cancelled': return '#E53935'; // Red
      default: return '#0A8A4D'; // Green for upcoming
    }
  };

  const activeTrips = trips.filter((t: any) => t.status !== 'cancelled');
  const totalTrips = activeTrips.length;
  const seatsFilled = activeTrips.reduce((sum: number, t: any) => sum + (t.passengers?.length || 0), 0);
  const totalEarnings = trips.reduce((sum: number, t: any) => {
    // If the trip is cancelled, ticket revenue for that trip is 0 (refunded)
    if (t.status === 'cancelled') {
      return sum;
    }
    const tripRevenue = (t.amount || 0) * (t.passengers?.length || 0);
    const fees = t.cancellationFees || 0;
    return sum + tripRevenue + fees;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064332" />
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerLogo}>Share Cab</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            {userProfile?.profileImage ? (
              <Image
                source={{ uri: userProfile.profileImage }}
                style={styles.headerProfilePic}
              />
            ) : (
              <View style={[styles.headerProfilePic, { backgroundColor: '#0A8A4D', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {userRole === 'customer' ? (
          <View style={styles.customerContainer}>
            <Text style={styles.customerGreeting}>Hello, {userProfile?.name || 'Rider'}!{'\n'}Welcome!</Text>

            <View style={styles.searchCard}>
              <View style={styles.connectionLine} />

              {/* Pickup Location */}
              <View style={styles.searchRow}>
                <Ionicons name="location" size={24} color="#0A8A4D" style={styles.searchIcon} />
                <View style={styles.searchInputArea}>
                  <Text style={styles.searchLabel}>Pickup Location</Text>
                  <TextInput
                    style={styles.searchTextInput}
                    placeholder="e.g. Chennai"
                    value={searchFrom}
                    onChangeText={(t) => { setSearchFrom(t); setShowFromSuggestions(true); }}
                    onFocus={() => setShowFromSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                  />
                </View>
              </View>

              {showFromSuggestions && searchFrom.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {filteredFromCities.map(city => (
                    <TouchableOpacity key={city} style={styles.suggestionItem} onPress={() => { setSearchFrom(city); setShowFromSuggestions(false); }}>
                      <Text style={styles.suggestionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.searchDivider} />

              {/* Drop Location */}
              <View style={styles.searchRow}>
                <Ionicons name="location" size={24} color="#E53935" style={styles.searchIcon} />
                <View style={styles.searchInputArea}>
                  <Text style={styles.searchLabel}>Drop Location</Text>
                  <TextInput
                    style={styles.searchTextInput}
                    placeholder="e.g. Madurai"
                    value={searchTo}
                    onChangeText={(t) => { setSearchTo(t); setShowToSuggestions(true); }}
                    onFocus={() => setShowToSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                  />
                </View>
              </View>

              {showToSuggestions && searchTo.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {filteredToCities.map(city => (
                    <TouchableOpacity key={city} style={styles.suggestionItem} onPress={() => { setSearchTo(city); setShowToSuggestions(false); }}>
                      <Text style={styles.suggestionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.searchDivider} />

              {/* Date */}
              <TouchableOpacity style={styles.searchRow} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="location" size={24} color="#1E88E5" style={styles.searchIcon} />
                <View style={styles.searchInputArea}>
                  <Text style={styles.searchLabel}>Date</Text>
                  <Text style={styles.searchValue}>
                    {searchDate ? searchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Any Date'}
                  </Text>
                </View>
                {searchDate ? (
                  <TouchableOpacity onPress={() => setSearchDate(null)} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={24} color="#E53935" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="calendar-outline" size={24} color="#555" />
                )}
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={searchDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>

            <TouchableOpacity style={styles.searchCabsButton} onPress={handleSearch}>
              <Text style={styles.searchCabsButtonText}>Search Cabs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Driver Profile Stats Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                {userProfile?.profileImage ? (
                  <Image
                    source={{ uri: userProfile.profileImage }}
                    style={styles.profilePicLarge}
                  />
                ) : (
                  <View style={[styles.profilePicLarge, { backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={32} color="#0A8A4D" />
                  </View>
                )}
                <View>
                  <Text style={styles.greetingText}>Hello,</Text>
                  <Text style={styles.nameText}>{userProfile?.name || 'Host'} (Host)</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{totalTrips}</Text>
                  <Text style={styles.statLabel}>Trips</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{seatsFilled}</Text>
                  <Text style={styles.statLabel}>Seats Filled</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>₹ {totalEarnings.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Earnings</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-trip')}>
                <Text style={styles.addButtonText}>Add New Trip</Text>
              </TouchableOpacity>
            </View>

            {/* Trips List */}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={styles.tripsHeader}>
                <Text style={styles.tripsTitle}>My Trips</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/my-trips')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {trips.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No trips published yet.</Text>
              ) : (
                trips.slice(0, 3).map((trip: any, index: number) => (
                  <View key={trip._id || index} style={styles.tripCard}>
                    <TouchableOpacity
                      style={styles.tripCardTop}
                      onPress={() => {
                        if (trip.status !== 'cancelled') handleManageTrip(trip);
                      }}
                    >
                      {(trip.driverId?.carImage || userProfile?.carImage) ? (
                        <Image
                          source={{ uri: trip.driverId?.carImage || userProfile?.carImage }}
                          style={styles.driverPicSmall}
                        />
                      ) : (
                        <View style={[styles.driverPicSmall, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
                          <Ionicons name="car-sport" size={24} color="#999" />
                        </View>
                      )}
                      <View style={styles.tripDetails}>
                        <Text style={styles.tripRoute}>{trip.from} ➔ {trip.to}</Text>
                        <Text style={styles.tripDate}>{trip.date} | {trip.time}</Text>
                        {trip.status === 'cancelled' ? (
                          <Text style={{ color: '#E53935', fontWeight: 'bold', marginTop: 4, fontSize: 13 }}>
                            {userRole === 'driver' ? 'Trip Cancelled' : 'Trip Cancelled.'}
                          </Text>
                        ) : (
                          <Text style={styles.tripSeats}>{trip.seats} seats available</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.activeBadge, { backgroundColor: getStatusColor(trip.status || 'upcoming') }]}
                      onPress={() => {
                        const currentStatus = trip.status || 'upcoming';
                        if (currentStatus === 'upcoming') {
                          confirmUpdateStatus(trip._id, 'inprogress');
                        } else if (currentStatus === 'inprogress') {
                          confirmUpdateStatus(trip._id, 'completed');
                        }
                      }}
                      disabled={trip.status === 'completed' || trip.status === 'cancelled' || userRole !== 'driver'}
                      activeOpacity={userRole === 'driver' ? 0.7 : 1}
                    >
                      <Text style={styles.activeBadgeText}>
                        {trip.status === 'inprogress' ? 'In Progress' : (trip.status === 'cancelled' ? 'CANCELLED' : (trip.status || 'Upcoming').toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
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
    paddingHorizontal: 15,
    paddingTop: 40, // For notch
    paddingBottom: 20, // Extra bottom padding for the overlapping card
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 40,
  },
  profileCard: {


    padding: 20,
    marginTop: 0, // Overlaps the green header

    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 10,
    margin: 2,
    borderRadius: 10,

  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEEEEE',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  addButton: {
    backgroundColor: '#0A8A4D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    width: '80%',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',

  },
  viewAllText: {
    color: '#0A8A4D',
    fontWeight: '600',
    fontSize: 14,
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
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  tripSeats: {
    fontSize: 12,
    color: '#666',
  },
  activeBadge: {
    backgroundColor: '#0A8A4D',
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: -20,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // CUSTOMER STYLES
  customerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  customerGreeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    lineHeight: 34,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  connectionLine: {
    position: 'absolute',
    left: 31,
    top: 45,
    bottom: 45,
    width: 2,
    backgroundColor: '#EEEEEE',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 16,
    zIndex: 1,
    backgroundColor: '#FFFFFF', // To cover the connection line underneath
  },
  searchInputArea: {
    flex: 1,
  },
  searchLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  searchTextInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 0,
    margin: 0,
  },
  searchValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 8,
    zIndex: 10,
    position: 'relative', // iOS Fix
    elevation: 5,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  searchDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 40, // align with text
  },
  searchCabsButton: {
    backgroundColor: '#0A8A4D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  searchCabsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
