import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../config/api';

export default function RideDetailsScreen() {
  const router = useRouter();
  const { ride, isEditing } = useLocalSearchParams();
  
  let rideData: any = {};
  try {
    if (ride) {
      rideData = JSON.parse(ride as string);
    }
  } catch (error) {
    console.error('Failed to parse ride data', error);
  }

  // Fallback values if data is missing
  const from = rideData.from || 'Unknown';
  const to = rideData.to || 'Unknown';
  const price = rideData.amount || 0;
  const date = rideData.date || 'Unknown';
  const time = rideData.time || 'Unknown';
  const availableSeats = rideData.seats || 0;
  const totalSeats = availableSeats + (rideData.passengers?.length || 0) || 4; // Mock total seats if empty

  const [seatsToBook, setSeatsToBook] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialSeats, setInitialSeats] = useState(0);

  useEffect(() => {
    const initSeats = async () => {
      if (isEditing) {
        const customerId = await AsyncStorage.getItem('userId');
        if (customerId && rideData.passengers) {
          let count = 0;
          rideData.passengers.forEach((p: string) => {
            if (p === customerId) count++;
          });
          if (count > 0) {
            setSeatsToBook(count);
            setInitialSeats(count);
          }
        }
      }
    };
    initSeats();
  }, [isEditing]);

  const incrementSeats = () => {
    const maxSeats = isEditing ? availableSeats + initialSeats : availableSeats;
    if (seatsToBook < maxSeats) {
      setSeatsToBook(seatsToBook + 1);
    }
  };

  const decrementSeats = () => {
    if (seatsToBook > 1) {
      setSeatsToBook(seatsToBook - 1);
    }
  };

  const handleBookSeat = async () => {
    if (availableSeats < seatsToBook) {
      Alert.alert('Error', 'Not enough seats available.');
      return;
    }

    try {
      setLoading(true);
      const customerId = await AsyncStorage.getItem('userId');
      if (!customerId) {
        Alert.alert('Error', 'You must be logged in to book a seat.');
        setLoading(false);
        return;
      }

      const response = await apiClient.post(ENDPOINTS.BOOK_TRIP, {
        tripId: rideData._id,
        customerId,
        seatsToBook
      });

      if (response.status === 200) {
        // Pass data to confirmation screen
        const confirmationData = { ...rideData, seatsBooked: seatsToBook, totalPaid: price * seatsToBook };
        router.push({ pathname: '/booking-confirmation', params: { ride: JSON.stringify(confirmationData) } });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to book the trip.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBooking = async () => {
    try {
      setLoading(true);
      const customerId = await AsyncStorage.getItem('userId');
      const response = await apiClient.post(ENDPOINTS.UPDATE_BOOKING, {
        tripId: rideData._id,
        customerId,
        newSeats: seatsToBook
      });

      if (response.status === 200) {
        Alert.alert('Success', `Booking updated to ${seatsToBook} seats.`);
        router.back();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update booking.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const customerId = await AsyncStorage.getItem('userId');
              await apiClient.post(ENDPOINTS.CANCEL_BOOKING, { tripId: rideData._id, customerId });
              Alert.alert('Success', 'Booking cancelled successfully!');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to cancel booking.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064332" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          
          {/* Big Car Image */}
          {rideData.driverId?.carImage ? (
            <Image
              source={{ uri: rideData.driverId.carImage }}
              style={styles.carImageLarge}
            />
          ) : (
            <View style={[styles.carImageLarge, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' }]}>
              <Ionicons name="car-sport" size={48} color="#999" />
            </View>
          )}

          {/* Driver Info */}
          <View style={styles.driverRow}>
            <View style={styles.driverInfoLeft}>
              {rideData.driverId?.profileImage ? (
                <Image
                  source={{ uri: rideData.driverId.profileImage }}
                  style={styles.driverProfilePic}
                />
              ) : (
                <View style={[styles.driverProfilePic, { backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={24} color="#0A8A4D" />
                </View>
              )}
              <View>
                <Text style={styles.driverName}>{rideData.driverId?.name || 'Verified Driver'}</Text>
                {rideData.driverId?.carModel ? (
                  <Text style={{ fontSize: 12, color: '#666', marginTop: 1 }}>{rideData.driverId.carModel} • {rideData.driverId?.vehicleNumber || ''}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFA000" />
              <Text style={styles.ratingText}>4.8 <Text style={styles.reviewsText}>(32)</Text></Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Route Header */}
          <View style={styles.iconRow}>
            <Ionicons name="location" size={20} color="#1E88E5" style={styles.icon} />
            <Text style={styles.iconRowText}>{from} ➔ {to}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.iconRow}>
            <Ionicons name="time-outline" size={20} color="#333" style={styles.icon} />
            <Text style={styles.iconRowText}>{date} | {time}</Text>
          </View>

          <View style={styles.divider} />

          {/* Seats and Car Number */}
          <View style={styles.seatsCarRow}>
            <View style={styles.statsColumn}>
              <Ionicons name="people" size={24} color="#0A8A4D" style={styles.statsIcon} />
              <View>
                <Text style={styles.statsLabel}>Available Seats</Text>
                <Text style={styles.statsValue}>{availableSeats} / {totalSeats}</Text>
              </View>
            </View>
            
            <View style={styles.statsColumn}>
              <Ionicons name="car-outline" size={24} color="#555" style={styles.statsIcon} />
              <View>
                <Text style={styles.statsLabel}>Car Number</Text>
                <Text style={styles.statsValue}>TN 58 AB 1234</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Points Timeline */}
          <View style={styles.timelineContainer}>
            <View style={styles.connectionLine} />
            
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { borderColor: '#0A8A4D' }]} />
              <View>
                <Text style={styles.timelineLabel}>Pickup Point</Text>
                <Text style={styles.timelineValue}>{from} (Main City)</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { borderColor: '#E53935', marginTop: 24 }]} />
              <View style={{ marginTop: 24 }}>
                <Text style={styles.timelineLabel}>Drop Point</Text>
                <Text style={styles.timelineValue}>{to} (City Center)</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Seat Selection */}
        {(!isEditing || !rideData.status || rideData.status === 'upcoming') && (
          <View style={styles.seatSelectionContainer}>
            <Text style={styles.seatSelectionLabel}>Select Seats to Book:</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={decrementSeats}>
                <Ionicons name="remove" size={24} color={seatsToBook > 1 ? '#333' : '#CCC'} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{seatsToBook}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={incrementSeats}>
                <Ionicons name="add" size={24} color={seatsToBook < (isEditing ? availableSeats + initialSeats : availableSeats) ? '#333' : '#CCC'} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Booking Area */}
        <View style={styles.bottomArea}>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>₹ {price * seatsToBook}</Text>
            <Text style={styles.priceLabel}> for {seatsToBook} seat(s)</Text>
          </View>
          
          {isEditing ? (
            (!rideData.status || rideData.status === 'upcoming') ? (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.bookBtnFull, styles.halfBtn, loading && styles.bookBtnDisabled]} 
                  onPress={handleUpdateBooking}
                  disabled={loading}
                >
                  <Text style={styles.bookBtnFullText}>{loading ? 'Updating...' : 'Update'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.cancelBtn, styles.halfBtn, loading && styles.bookBtnDisabled]} 
                  onPress={handleCancelBooking}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#E53935', fontWeight: 'bold' }}>
                  Trip is {rideData.status}. Cannot modify booking.
                </Text>
              </View>
            )
          ) : (
            <TouchableOpacity 
              style={[styles.bookBtnFull, (loading || availableSeats === 0) && styles.bookBtnDisabled]} 
              onPress={handleBookSeat}
              disabled={loading || availableSeats === 0}
            >
              <Text style={styles.bookBtnFullText}>{loading ? 'Booking...' : (availableSeats === 0 ? 'Fully Booked' : 'Book Seat')}</Text>
            </TouchableOpacity>
          )}
        </View>

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
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  carImageLarge: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 16,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  reviewsText: {
    color: '#888',
    fontWeight: 'normal',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  iconRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seatsCarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statsIcon: {
    marginRight: 10,
  },
  statsLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 8,
  },
  connectionLine: {
    position: 'absolute',
    left: 14,
    top: 14,
    bottom: 14,
    width: 2,
    backgroundColor: '#EEEEEE',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 16,
    marginTop: 2,
    zIndex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#555',
  },
  seatSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  seatSelectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stepperBtn: {
    padding: 8,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
  },
  bottomArea: {
    paddingHorizontal: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
  },
  priceLabel: {
    fontSize: 16,
    color: '#888',
  },
  bookBtnFull: {
    backgroundColor: '#0A8A4D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookBtnDisabled: {
    backgroundColor: '#A5D6A7',
  },
  bookBtnFullText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfBtn: {
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
