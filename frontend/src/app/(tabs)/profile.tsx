import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { apiClient, ENDPOINTS } from '../../config/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'driver' | 'customer'>('customer');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');

  // Driver Specific Fields
  const [carModel, setCarModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [license, setLicense] = useState('');
  const [insurance, setInsurance] = useState('');
  const [carImage, setCarImage] = useState<string>('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const role = await AsyncStorage.getItem('userRole');
      const id = await AsyncStorage.getItem('userId');

      if (role) setUserRole(role as 'driver' | 'customer');
      if (id) setUserId(id);

      if (!id || !role) {
        setLoading(false);
        return;
      }

      const response = await apiClient.get(ENDPOINTS.PROFILE(role, id));
      if (response.status === 200 && response.data) {
        const user = response.data;
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setProfileImage(user.profileImage || '');

        if (role === 'driver') {
          setCarModel(user.carModel || '');
          setVehicleNumber(user.vehicleNumber || '');
          setLicense(user.license || '');
          setInsurance(user.insurance || '');
          setCarImage(user.carImage || '');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handlePickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking profile image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handlePickCarImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setCarImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking car image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Validation Error', 'Name, email, and phone cannot be empty.');
      return;
    }

    if (userRole === 'driver') {
      if (!carModel.trim() || !vehicleNumber.trim() || !license.trim() || !insurance.trim()) {
        Alert.alert('Validation Error', 'All vehicle information fields are required.');
        return;
      }
    }

    try {
      setSaving(true);
      if (!userId) return;

      const payload: any = {
        name,
        email,
        phone,
        profileImage,
      };

      if (userRole === 'driver') {
        payload.carModel = carModel;
        payload.vehicleNumber = vehicleNumber;
        payload.license = license;
        payload.insurance = insurance;
        payload.carImage = carImage;
      }

      const res = await apiClient.put(ENDPOINTS.PROFILE(userRole, userId), payload);
      if (res.status === 200) {
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      const msg = error.response?.data?.error || 'Failed to update profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout from ShareCab?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('userId');
            router.replace('/login');
          } catch (e) {
            console.error('Failed to logout:', e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064332" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Banner & Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Account Profile</Text>
            <View style={styles.roleBadge}>
              <Ionicons
                name={userRole === 'driver' ? 'car-sport' : 'person'}
                size={14}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.roleBadgeText}>
                {userRole === 'driver' ? 'Host / Driver' : 'Rider / Customer'}
              </Text>
            </View>
          </View>

          {/* Profile Avatar Card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={54} color="#0A8A4D" />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.8}
                onPress={handlePickProfileImage}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{name || 'Your Name'}</Text>
            <Text style={styles.profileEmail}>{email || 'your.email@example.com'}</Text>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0A8A4D" />
              <Text style={styles.loaderText}>Loading profile details...</Text>
            </View>
          ) : (
            <>
              {/* Personal Information Section */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="person-circle-outline" size={22} color="#0A8A4D" />
                  <Text style={styles.cardTitle}>Personal Information</Text>
                </View>

                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              {/* Host / Vehicle Details Section (Driver Only) */}
              {userRole === 'driver' && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="car-outline" size={22} color="#0A8A4D" />
                    <Text style={styles.cardTitle}>Vehicle & Host Information</Text>
                  </View>

                  {/* Vehicle Photo Upload */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Vehicle Photo</Text>
                    <TouchableOpacity
                      style={styles.carImageUpload}
                      activeOpacity={0.8}
                      onPress={handlePickCarImage}
                    >
                      {carImage ? (
                        <Image source={{ uri: carImage }} style={styles.carImagePreview} />
                      ) : (
                        <View style={styles.carImagePlaceholder}>
                          <Ionicons name="camera-outline" size={28} color="#0A8A4D" />
                          <Text style={styles.carImageUploadText}>Upload Vehicle Photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Car Model */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Car Model</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="car-sport-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={carModel}
                        onChangeText={setCarModel}
                        placeholder="e.g. Toyota Innova"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  {/* Vehicle Number */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Vehicle Number</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="barcode-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        placeholder="e.g. TN 01 AB 1234"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  {/* License */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Driving License Number</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={license}
                        onChangeText={setLicense}
                        placeholder="DL Number"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  {/* Insurance */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Insurance Policy Number</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="shield-checkmark-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={insurance}
                        onChangeText={setInsurance}
                        placeholder="Insurance Policy No"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.8 }]}
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#E53935" style={{ marginRight: 8 }} />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#064332',
    paddingTop: 45,
    paddingBottom: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A8A4D',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#0A8A4D',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A8A4D',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0A8A4D',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#777',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  carImageUpload: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0A8A4D',
    borderStyle: 'dashed',
    backgroundColor: '#F7FCF9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  carImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  carImagePlaceholder: {
    alignItems: 'center',
  },
  carImageUploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0A8A4D',
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#0A8A4D',
    marginHorizontal: 20,
    marginTop: 8,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A8A4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutBtnText: {
    color: '#E53935',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
