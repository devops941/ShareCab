import axios from 'axios';

// Get the API URL from environment variables, fallback to local IP
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.2:3000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ENDPOINTS = {
  // Auth
  LOGIN_CUSTOMER: '/api/customer/login',
  LOGIN_DRIVER: '/api/driver/login',
  SIGNUP_CUSTOMER: '/api/customer/signup',
  SIGNUP_DRIVER: '/api/driver/signup',
  
  // Trips
  PUBLISH_TRIP: '/api/trip/publish',
  ALL_TRIPS: '/api/trip/all',
  BOOK_TRIP: '/api/trip/book',
  CANCEL_BOOKING: '/api/trip/cancel-booking',
  UPDATE_BOOKING: '/api/trip/update-booking',
  DRIVER_TRIPS: (driverId: string) => `/api/trip/driver/${driverId}`,
  CUSTOMER_TRIPS: (customerId: string) => `/api/trip/customer/${customerId}`,
  UPDATE_TRIP_STATUS: (tripId: string) => `/api/trip/status/${tripId}`,
  PROFILE: (role: string, userId: string) => `/api/profile/${role}/${userId}`,
};
