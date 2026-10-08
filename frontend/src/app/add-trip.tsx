import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient, ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CITIES = ['Chennai', 'Madurai', 'Trichy', 'Coimbatore', 'Salem', 'Bangalore', 'Kochi'];

export default function AddTripScreen() {
  const router = useRouter();
  const { trip } = useLocalSearchParams();

  let existingTrip: any = null;
  if (trip) {
    try {
      existingTrip = JSON.parse(trip as string);
    } catch (e) {}
  }
  
  const [from, setFrom] = useState(existingTrip?.from || '');
  const [to, setTo] = useState(existingTrip?.to || '');
  
  const [date, setDate] = useState(() => {
    if (existingTrip && existingTrip.date) {
      // Very basic parse, assume date is valid or just default to now
      return new Date(); // Hard to reverse format properly depending on locale, so default to now
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [seats, setSeats] = useState(existingTrip?.seats?.toString() || '');
  const [amount, setAmount] = useState(existingTrip?.amount?.toString() || '');

  // Group passengers by ID to show how many seats each booked
  const passengersGroup = React.useMemo(() => {
    if (!existingTrip?.passengers) return [];
    const counts: Record<string, { count: number, name: string, phone: string }> = {};
    existingTrip.passengers.forEach((p: any) => {
      const id = typeof p === 'object' ? p._id : p;
      const name = typeof p === 'object' ? p.name : 'Unknown';
      const phone = typeof p === 'object' ? p.phone : 'Unknown';
      if (!counts[id]) {
        counts[id] = { count: 0, name, phone };
      }
      counts[id].count++;
    });
    return Object.values(counts);
  }, [existingTrip]);

  // Autocomplete UI state
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Filter cities for autocomplete
  const filteredFromCities = CITIES.filter(city => city.toLowerCase().includes(from.toLowerCase()));
  const filteredToCities = CITIES.filter(city => city.toLowerCase().includes(to.toLowerCase()));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Create a new date object keeping the original date but setting the new time
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handlePublish = async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) {
        Alert.alert('Error', 'You must be logged in as a host to publish a trip.');
        return;
      }

      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const payload = {
        from,
        to,
        date: formattedDate,
        time: formattedTime,
        seats: parseInt(seats, 10),
        amount: parseInt(amount, 10),
        driverId
      };

      let response;
      if (existingTrip?._id) {
        response = await apiClient.put(`/api/trip/${existingTrip._id}`, payload);
      } else {
        response = await apiClient.post(ENDPOINTS.PUBLISH_TRIP, payload);
      }
      
      if (response.status === 201 || response.status === 200) {
        Alert.alert('Success', `Trip ${existingTrip?._id ? 'updated' : 'published'} successfully!`);
        router.back();
      } else {
        Alert.alert('Error', `Failed to ${existingTrip?._id ? 'update' : 'publish'} trip.`);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Network error. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleDelete = () => {
    const hasBookings = existingTrip?.passengers && existingTrip.passengers.length > 0;
    const warningMessage = hasBookings 
      ? 'This trip has booked passengers! Deleting it will cancel all their bookings and remove their amount from your earnings. Are you sure you want to continue?' 
      : 'Are you sure you want to delete this trip?';

    Alert.alert(
      'Confirm Delete',
      warningMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (existingTrip?._id) {
                await apiClient.delete(`/api/trip/${existingTrip._id}`);
                Alert.alert('Success', 'Trip deleted successfully!');
                router.back();
              }
            } catch (error) {
              console.error('Failed to delete trip:', error);
              Alert.alert('Error', 'Failed to delete trip.');
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
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Trip</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Form Card */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            
            {/* From Field */}
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={24} color="#333" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>From</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chennai"
                  value={from}
                  onChangeText={(text) => { setFrom(text); setShowFromSuggestions(true); }}
                  onFocus={() => setShowFromSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                />
              </View>
            </View>
            {showFromSuggestions && from.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredFromCities.map(city => (
                  <TouchableOpacity key={city} style={styles.suggestionItem} onPress={() => { setFrom(city); setShowFromSuggestions(false); }}>
                    <Text style={styles.suggestionText}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* To Field */}
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={24} color="#333" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>To</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Madurai"
                  value={to}
                  onChangeText={(text) => { setTo(text); setShowToSuggestions(true); }}
                  onFocus={() => setShowToSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                />
              </View>
            </View>
            {showToSuggestions && to.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredToCities.map(city => (
                  <TouchableOpacity key={city} style={styles.suggestionItem} onPress={() => { setTo(city); setShowToSuggestions(false); }}>
                    <Text style={styles.suggestionText}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date Field (Picker) */}
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={24} color="#333" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Date</Text>
                <Text style={styles.inputTextValue}>{date.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>

            {/* Time Field (Picker) */}
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={24} color="#333" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Departure Time</Text>
                <Text style={styles.inputTextValue}>
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Available Seats Field */}
            <View style={styles.inputContainer}>
              <Ionicons name="people-outline" size={24} color="#333" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Available Seats</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 4"
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />
              </View>
            </View>

            {/* Amount Field */}
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={24} color="#333" style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Amount per Seat (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* Passengers List */}
            {existingTrip && passengersGroup.length > 0 && (
              <View style={styles.passengersContainer}>
                <Text style={styles.passengersTitle}>Booked Passengers</Text>
                {passengersGroup.map((p, idx) => (
                  <View key={idx} style={styles.passengerItem}>
                    <Ionicons name="person-circle-outline" size={32} color="#0A8A4D" />
                    <View style={styles.passengerInfo}>
                      <Text style={styles.passengerName}>{p.name} ({p.count} seat{p.count > 1 ? 's' : ''})</Text>
                      <Text style={styles.passengerPhone}>{p.phone}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            {existingTrip ? (
              (!existingTrip.status || existingTrip.status === 'upcoming') ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.publishButton, styles.halfBtn]} onPress={handlePublish}>
                    <Text style={styles.publishButtonText}>Update</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.deleteBtn, styles.halfBtn]} onPress={handleDelete}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            ) : (
              <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
                <Text style={styles.publishButtonText}>Publish Trip</Text>
              </TouchableOpacity>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: 40,
    paddingBottom: 20, 
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 16,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    padding: 0,
  },
  inputTextValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: -12,
    marginBottom: 16,
    zIndex: 10,
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
  publishButton: {
    backgroundColor: '#0A8A4D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12, // For newer React Native versions, otherwise margin is used inside halfBtn
  },
  halfBtn: {
    flex: 1,
    marginTop: 0,
  },
  deleteBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passengersContainer: {
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  passengersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerInfo: {
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  passengerPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  }
});
