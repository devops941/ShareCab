import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { apiClient, ENDPOINTS } from '../../config/api';

// Types
interface Trip {
  _id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seats: number;
  amount: number;
  status: string;
  createdAt: string;
  passengers: any[];
}

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // State for tabs
  const [timeTab, setTimeTab] = useState<'Day' | 'Week' | 'Month'>('Day');
  
  // Date selection
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Generate last 7 days for the date selector
  const dates = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  // Generate last 6 weeks for the week selector
  const weeks = useMemo(() => {
    const arr = [];
    const currentWeekStart = new Date(today);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1); 
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0,0,0,0);

    for (let i = -5; i <= 0; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + (i * 7));
      arr.push(d);
    }
    return arr;
  }, []);

  // Generate last 6 months for the month selector
  const months = useMemo(() => {
    const arr = [];
    for (let i = -5; i <= 0; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      arr.push(d);
    }
    return arr;
  }, []);

  const fetchTrips = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        const res = await apiClient.get(ENDPOINTS.DRIVER_TRIPS(id));
        if (res.status === 200) {
          setTrips(res.data);
        }
      }
    } catch (e) {
      console.error('Error fetching trips:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };
  
  const demoFilteredTrips = trips.filter(trip => {
    if (trip.status !== 'completed') return false;

    // Use updatedAt so the earnings show on the day the trip was actually completed
    const tripDate = new Date(trip.updatedAt || trip.createdAt);

    if (timeTab === 'Day') {
      if (
        tripDate.getDate() !== selectedDate.getDate() ||
        tripDate.getMonth() !== selectedDate.getMonth() ||
        tripDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }
    } else if (timeTab === 'Month') {
      if (
        tripDate.getMonth() !== selectedDate.getMonth() ||
        tripDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }
    } else if (timeTab === 'Week') {
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      if (tripDate < startOfWeek || tripDate >= endOfWeek) {
        return false;
      }
    }

    return true;
  });

  const completedOrdersCount = demoFilteredTrips.length;
  // Earnings is seats booked * amount for completed trips
  const earningsAmount = demoFilteredTrips.reduce((acc, trip) => {
    const revenue = trip.passengers.length * trip.amount;
    return trip.status === 'completed' ? acc + revenue : acc - revenue; // basic demo logic
  }, 0);

  const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
  const getDateNum = (date: Date) => date.getDate();

  const isSameDate = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ padding: 4 }}>
           <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Orders</Text>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="headset-outline" size={16} color="#333" />
          <Text style={styles.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>

      {/* Top Time Tabs */}
      <View style={styles.timeTabsContainer}>
        {['Day', 'Week', 'Month'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.timeTab, timeTab === tab && styles.timeTabActive]}
            onPress={() => setTimeTab(tab as any)}
          >
            <Text style={[styles.timeTabText, timeTab === tab && styles.timeTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Selector */}
      {timeTab === 'Day' && (
        <View style={styles.dateSelectorWrapper}>
          <TouchableOpacity style={styles.dateNavBtn}>
            <Ionicons name="arrow-back" size={18} color="#154B33" />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelector}>
            {dates.map((d, i) => {
              const active = isSameDate(d, selectedDate);
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.dateItem, active && styles.dateItemActive]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dateItemDay, active && styles.dateItemTextActive]}>{getDayName(d)}</Text>
                  <Text style={[styles.dateItemNum, active && styles.dateItemTextActive]}>{getDateNum(d)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.dateNavBtn}>
            <Ionicons name="arrow-forward" size={18} color="#154B33" />
          </TouchableOpacity>
        </View>
      )}

      {timeTab === 'Week' && (
        <View style={styles.dateSelectorWrapper}>
          <TouchableOpacity style={styles.dateNavBtn}>
            <Ionicons name="arrow-back" size={18} color="#154B33" />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelector}>
            {weeks.map((d, i) => {
              const isSameWeek = selectedDate >= d && selectedDate < new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
              const weekEnd = new Date(d);
              weekEnd.setDate(d.getDate() + 6);
              
              const weekLabel = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleString('default', { month: 'short' })}`;

              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.dateItem, isSameWeek && styles.dateItemActive, { paddingHorizontal: 12 }]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dateItemDay, isSameWeek && styles.dateItemTextActive]}>Week</Text>
                  <Text style={[styles.dateItemNum, isSameWeek && styles.dateItemTextActive, { fontSize: 13 }]}>{weekLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.dateNavBtn}>
            <Ionicons name="arrow-forward" size={18} color="#154B33" />
          </TouchableOpacity>
        </View>
      )}

      {timeTab === 'Month' && (
        <View style={styles.dateSelectorWrapper}>
          <TouchableOpacity style={styles.dateNavBtn}>
            <Ionicons name="arrow-back" size={18} color="#154B33" />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateSelector}>
            {months.map((d, i) => {
              const active = selectedDate.getMonth() === d.getMonth() && selectedDate.getFullYear() === d.getFullYear();
              const monthName = d.toLocaleString('default', { month: 'short' });
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.dateItem, active && styles.dateItemActive, { paddingHorizontal: 20 }]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.dateItemDay, active && styles.dateItemTextActive]}>{d.getFullYear()}</Text>
                  <Text style={[styles.dateItemNum, active && styles.dateItemTextActive]}>{monthName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.dateNavBtn}>
            <Ionicons name="arrow-forward" size={18} color="#154B33" />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A8A4D" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A8A4D']} />}
        >
          {/* Main Stat Card */}
          <View style={styles.statCard}>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{completedOrdersCount}</Text>
              <Text style={styles.statLabel}>Completed Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: '#0A8A4D' }]}>₹{earningsAmount}</Text>
              <Text style={styles.statLabel}>Order Earnings</Text>
            </View>
          </View>

          {/* Order History */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Order History</Text>

            <Text style={styles.historyDateLabel}>
              {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>

            {demoFilteredTrips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders found.</Text>
              </View>
            ) : (
              demoFilteredTrips.map(trip => {
                const ticketsSold = trip.passengers?.length || 0;
                const tripTotal = ticketsSold * trip.amount;

                return (
                  <View key={trip._id} style={styles.tripCard}>
                    <View style={styles.tripHeaderRow}>
                      <Text style={styles.tripType}>
                        Auto • <Ionicons name="time-outline" size={12} /> {trip.time || '10:39 pm'}
                        {ticketsSold > 0 ? ` • ${ticketsSold} Ticket${ticketsSold > 1 ? 's' : ''}` : ''}
                      </Text>
                      <View style={styles.tripAmountRow}>
                        <Text style={[styles.tripAmount, trip.status === 'cancelled' && { color: '#D32F2F' }]}>
                          ₹{tripTotal}
                        </Text>
                      <Ionicons 
                        name={trip.status === 'completed' ? "checkmark-circle" : "close-circle"} 
                        size={14} 
                        color={trip.status === 'completed' ? "#0A8A4D" : "#D32F2F"} 
                        style={{ marginLeft: 4 }}
                      />
                    </View>
                  </View>

                  <View style={styles.locationContainer}>
                    <View style={styles.locationRow}>
                      <View style={[styles.dot, { backgroundColor: '#0A8A4D' }]} />
                      <Text style={styles.locationText} numberOfLines={1}>{trip.from}</Text>
                    </View>
                    <View style={styles.locationLine} />
                    <View style={styles.locationRow}>
                      <View style={[styles.dot, { backgroundColor: '#D32F2F' }]} />
                      <Text style={styles.locationText} numberOfLines={1}>{trip.to}</Text>
                    </View>
                  </View>
                </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', flex: 1, marginLeft: 12 },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  helpBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  timeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  timeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeTabActive: {
    backgroundColor: '#FDE047', // Yellow from design
  },
  timeTabText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 14,
  },
  timeTabTextActive: {
    color: '#334155',
  },
  dateSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  dateNavBtn: {
    padding: 12,
  },
  dateSelector: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  dateItemActive: {
    backgroundColor: '#1E3A2B', // Dark green from the design
  },
  dateItemDay: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '500',
  },
  dateItemNum: {
    fontSize: 18,
    color: '#475569',
    fontWeight: 'bold',
  },
  dateItemTextActive: {
    color: '#FFFFFF',
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  historySection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
  },
  historyDateLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripType: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  tripAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10B981',
  },
  locationContainer: {
    paddingLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  locationLine: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 2,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
});
