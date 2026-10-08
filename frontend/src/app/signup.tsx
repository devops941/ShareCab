import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { apiClient, ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'driver' | 'customer'>('driver');
  
  // Shared state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Driver specific state
  const [carModel, setCarModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [license, setLicense] = useState('');
  const [insurance, setInsurance] = useState('');
  const [carImage, setCarImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCarImage(result.assets[0].uri);
    }
  };

  const handleSignup = async () => {
    try {
      const endpoint = activeTab === 'driver' ? ENDPOINTS.SIGNUP_DRIVER : ENDPOINTS.SIGNUP_CUSTOMER;
      const payload = activeTab === 'driver' 
        ? { name, email, phone, password, carModel, vehicleNumber, license, insurance, carImage }
        : { name, email, phone, password };

      const response = await apiClient.post(endpoint, payload);
      
      if (response.status === 201 || response.status === 200) {
        if (response.data?.user?.id) {
          await AsyncStorage.setItem('userId', response.data.user.id);
          await AsyncStorage.setItem('userRole', activeTab);
        }
        Alert.alert('Success', 'Account created successfully!');
        router.push('/(tabs)/home');
      } else {
        Alert.alert('Error', 'Something went wrong during signup.');
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Network error. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join ShareCab today!</Text>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'driver' && styles.activeTab]}
              onPress={() => setActiveTab('driver')}
            >
              <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>
                Host
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'customer' && styles.activeTab]}
              onPress={() => setActiveTab('customer')}
            >
              <Text style={[styles.tabText, activeTab === 'customer' && styles.activeTabText]}>
                Rider
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {activeTab === 'driver' && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                </View>

                  {/* Car Image Placeholder */}
                  <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImage}>
                    {carImage ? (
                      <Image source={{ uri: carImage }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={24} color="#0A8A4D" />
                        <Text style={styles.imageUploadText}>Upload Car Image</Text>
                      </>
                    )}
                  </TouchableOpacity>

                <View style={styles.inputContainer}>
                  <Ionicons name="car-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Car Model (e.g., Toyota Prius)"
                    value={carModel}
                    onChangeText={setCarModel}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="barcode-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Vehicle Number (e.g., AB 1234 CD)"
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Driving License Number"
                    value={license}
                    onChangeText={setLicense}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Insurance Number"
                    value={insurance}
                    onChangeText={setInsurance}
                  />
                </View>
              </>
            )}

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#0A8A4D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0A8A4D',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 60,
    marginBottom: 16,
    backgroundColor: '#F0F9F4',
  },
  imageUploadText: {
    color: '#0A8A4D',
    fontWeight: '600',
    marginLeft: 8,
  },
  signupButton: {
    backgroundColor: '#0A8A4D',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#0A8A4D',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
