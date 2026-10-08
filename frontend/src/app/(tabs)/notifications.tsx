import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../../config/api';

interface NotificationItem {
  _id: string;
  userId: string;
  userModel: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [userRole, setUserRole] = useState<'driver' | 'customer'>('driver');
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const role = await AsyncStorage.getItem('userRole');
      const id = await AsyncStorage.getItem('userId');

      if (role) setUserRole(role as 'driver' | 'customer');
      if (id) setUserId(id);

      if (id && role) {
        const modelParam = role === 'driver' ? 'Driver' : 'Customer';
        const res = await apiClient.get(`/api/notifications/${modelParam}/${id}`);
        if (res.status === 200) {
          setNotifications(res.data);
        }
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      await apiClient.put(`/api/notifications/${notificationId}/read`);
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      const modelParam = userRole === 'driver' ? 'Driver' : 'Customer';
      await apiClient.put(`/api/notifications/read-all/${modelParam}/${userId}`);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      await apiClient.delete(`/api/notifications/${notificationId}`);
    } catch (e) {
      console.error('Failed to delete notification:', e);
      fetchNotifications();
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            try {
              setNotifications([]);
              const modelParam = userRole === 'driver' ? 'Driver' : 'Customer';
              await apiClient.delete(`/api/notifications/clear-all/${modelParam}/${userId}`);
            } catch (e) {
              console.error('Failed to clear notifications:', e);
              fetchNotifications();
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('booking') || lower.includes('booked') || lower.includes('ticket')) {
      return { name: 'ticket-outline', color: '#0A8A4D', bg: '#E8F5E9' };
    }
    if (lower.includes('start') || lower.includes('progress')) {
      return { name: 'car-sport-outline', color: '#0288D1', bg: '#E1F5FE' };
    }
    if (lower.includes('complete') || lower.includes('confirmed')) {
      return { name: 'checkmark-circle-outline', color: '#2E7D32', bg: '#E8F5E9' };
    }
    if (lower.includes('cancel')) {
      return { name: 'close-circle-outline', color: '#D32F2F', bg: '#FFEBEE' };
    }
    if (lower.includes('update') || lower.includes('modified') || lower.includes('schedule')) {
      return { name: 'refresh-outline', color: '#F57C00', bg: '#FFF3E0' };
    }
    return { name: 'notifications-outline', color: '#0A8A4D', bg: '#E8F5E9' };
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {userRole === 'driver' ? 'Host Updates & Activity' : 'Rider Updates & Activity'}
            </Text>
          </View>
          {notifications.length > 0 && (
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.actionBtn} onPress={handleMarkAllAsRead}>
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Read All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={handleClearAll}>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'unread' && styles.filterPillActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0A8A4D" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A8A4D']} />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={48} color="#0A8A4D" />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {userRole === 'driver'
                  ? 'You will be notified when riders book, modify, or cancel trips.'
                  : 'You will receive trip confirmations, updates, and driver alerts here.'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map(notif => {
              const iconInfo = getNotificationIcon(notif.title);
              return (
                <TouchableOpacity
                  key={notif._id}
                  style={[
                    styles.notificationCard,
                    !notif.read && styles.unreadCard,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleMarkAsRead(notif._id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                    <Ionicons name={iconInfo.name as any} size={22} color={iconInfo.color} />
                  </View>

                  <View style={styles.textContainer}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardTitle, !notif.read && styles.unreadTitle]}>
                        {notif.title}
                      </Text>
                      <Text style={styles.timeText}>{formatTime(notif.createdAt)}</Text>
                    </View>
                    <Text style={styles.cardBody}>{notif.body}</Text>
                  </View>

                  <View style={styles.cardRightAction}>
                    {!notif.read && <View style={styles.unreadDot} />}
                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => handleDeleteNotification(notif._id)}
                    >
                      <Ionicons name="close" size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#A3D9C9',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  clearBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.25)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#064332',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  unreadCard: {
    backgroundColor: '#F7FCF9',
    borderColor: '#B8E2CE',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 6,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#0A8A4D',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  cardBody: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  cardRightAction: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 6,
    height: 38,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A8A4D',
    marginBottom: 6,
  },
  deleteIconBtn: {
    padding: 2,
  },
});
