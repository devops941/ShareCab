import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { ride } = useLocalSearchParams();
  
  let rideData: any = {};
  try {
    if (ride) {
      rideData = JSON.parse(ride as string);
    }
  } catch (error) {
    console.error('Failed to parse ride data', error);
  }

  const from = rideData.from || 'Chennai';
  const to = rideData.to || 'Madurai';
  const price = rideData.totalPaid || (rideData.amount || 400);
  const date = rideData.date || '12 Oct 2026';
  const time = rideData.time || '08:00 AM';
  const seatsBooked = rideData.seatsBooked || 1;

  const DetailRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={20} color="#555" style={styles.detailIcon} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064332" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Confirmation</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          
          {/* Success Header */}
          <View style={styles.successSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Your Seat is Booked!</Text>
            <Text style={styles.successSubtitle}>Trip to {to}</Text>
          </View>

          <View style={styles.divider} />

          {/* Details List */}
          <View style={styles.detailsList}>
            <DetailRow icon="person-outline" label="Host" value={rideData.driverId?.name || "Verified Host"} />
            <View style={styles.rowDivider} />
            
            <DetailRow icon="car-outline" label="Vehicle" value={`${rideData.driverId?.carModel || 'Cab'} (${rideData.driverId?.vehicleNumber || 'Verified'})`} />
            <View style={styles.rowDivider} />
            
            <DetailRow icon="calendar-outline" label="Date" value={date} />
            <View style={styles.rowDivider} />
            
            <DetailRow icon="time-outline" label="Time" value={time} />
            <View style={styles.rowDivider} />
            
            <DetailRow icon="location-outline" label="Pickup" value={`${from} (Main)`} />
            <View style={styles.rowDivider} />
            
            <DetailRow icon="location" label="Drop" value={`${to} (Center)`} />
            <View style={styles.rowDivider} />
            
            <DetailRow icon="people-outline" label="Seats Booked" value={`${seatsBooked}`} />
            <View style={styles.rowDivider} />
            
            <View style={styles.detailRow}>
              <View style={styles.detailLeft}>
                <Ionicons name="cash-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Amount</Text>
              </View>
              <Text style={styles.amountValue}>₹ {price}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewBookingsBtn} onPress={() => router.push('/(tabs)/my-trips')}>
            <Text style={styles.viewBookingsBtnText}>View My Bookings</Text>
          </TouchableOpacity>
          
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  successSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF4B4B', // Match the red checkmark circle in the design
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  detailsList: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  amountValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '900',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  viewBookingsBtn: {
    backgroundColor: '#0A8A4D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  viewBookingsBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
