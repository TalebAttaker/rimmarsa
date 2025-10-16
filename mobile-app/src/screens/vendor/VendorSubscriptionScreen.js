import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VendorSubscriptionScreen({ navigation }) {
  const [subscription, setSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [])
  );

  const loadSubscription = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('vendor');
      if (!vendorData) {
        navigation.replace('VendorLogin');
        return;
      }

      const vendor = JSON.parse(vendorData);
      await fetchSubscription(vendor.id);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const fetchSubscription = async (vendorId) => {
    try {
      // Get active subscription
      const { data: activeSub } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .single();

      if (activeSub) {
        setSubscription(activeSub);

        // Calculate days remaining
        const endDate = new Date(activeSub.end_date);
        const today = new Date();
        const days = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysRemaining(days);
      }

      // Get subscription history
      const { data: history } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (history) setSubscriptionHistory(history);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الاشتراك');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscription();
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#10B981', icon: 'check-circle' },
      expired: { bg: '#EF4444', icon: 'alert-circle' },
      cancelled: { bg: '#6B7280', icon: 'close-circle' },
    };

    const labels = {
      active: 'نشط',
      expired: 'منتهي',
      cancelled: 'ملغي',
    };

    const style = styles[status] || styles.expired;

    return {
      backgroundColor: style.bg,
      icon: style.icon,
      label: labels[status] || status,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EAB308" />
        <Text style={styles.loadingText}>جاري تحميل الاشتراك...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#EAB308"
          colors={['#EAB308']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>اشتراكي</Text>
        <Text style={styles.headerSubtitle}>تفاصيل اشتراكك وتاريخ الدفعات</Text>
      </View>

      {/* Warning if expiring soon */}
      {subscription &&
        daysRemaining !== null &&
        daysRemaining < 7 &&
        daysRemaining > 0 && (
          <View style={styles.warningCard}>
            <Icon name="clock-alert" size={28} color="#F59E0B" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>اشتراكك قرب على الانتهاء!</Text>
              <Text style={styles.warningText}>
                لديك {daysRemaining} يوم متبقي. تواصل مع الإدارة لتجديد اشتراكك.
              </Text>
            </View>
          </View>
        )}

      {/* Current Subscription */}
      {subscription ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الاشتراك الحالي</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusBadge(subscription.status).backgroundColor },
              ]}
            >
              <Icon
                name={getStatusBadge(subscription.status).icon}
                size={16}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {getStatusBadge(subscription.status).label}
              </Text>
            </View>
          </View>

          <View style={styles.subscriptionGrid}>
            <View style={styles.subscriptionCard}>
              <Icon name="credit-card" size={24} color="#3B82F6" />
              <Text style={styles.subscriptionCardLabel}>الخطة</Text>
              <Text style={styles.subscriptionCardValue}>
                {subscription.plan_type}
              </Text>
              <Text style={styles.subscriptionCardPrice}>
                {subscription.amount} أوقية
              </Text>
            </View>

            <View style={styles.subscriptionCard}>
              <Icon name="calendar" size={24} color="#10B981" />
              <Text style={styles.subscriptionCardLabel}>تاريخ البداية</Text>
              <Text style={styles.subscriptionCardValue}>
                {new Date(subscription.start_date).toLocaleDateString('ar-MR')}
              </Text>
            </View>

            <View style={styles.subscriptionCard}>
              <Icon name="calendar-check" size={24} color="#EF4444" />
              <Text style={styles.subscriptionCardLabel}>تاريخ الانتهاء</Text>
              <Text style={styles.subscriptionCardValue}>
                {new Date(subscription.end_date).toLocaleDateString('ar-MR')}
              </Text>
              {daysRemaining !== null && (
                <Text
                  style={[
                    styles.subscriptionCardDays,
                    { color: daysRemaining < 7 ? '#EF4444' : '#10B981' },
                  ]}
                >
                  {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'منتهي'}
                </Text>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noSubscription}>
          <Icon name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.noSubscriptionTitle}>لا يوجد اشتراك نشط</Text>
          <Text style={styles.noSubscriptionText}>
            تواصل مع الإدارة لتفعيل اشتراكك
          </Text>
        </View>
      )}

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تاريخ الاشتراكات</Text>
          {subscriptionHistory.map((sub) => {
            const badge = getStatusBadge(sub.status);
            return (
              <View key={sub.id} style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyPlan}>{sub.plan_type}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(sub.start_date).toLocaleDateString('ar-MR')} -{' '}
                    {new Date(sub.end_date).toLocaleDateString('ar-MR')}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <View
                    style={[
                      styles.historyBadge,
                      { backgroundColor: badge.backgroundColor },
                    ]}
                  >
                    <Icon name={badge.icon} size={14} color="#fff" />
                    <Text style={styles.historyBadgeText}>{badge.label}</Text>
                  </View>
                  <Text style={styles.historyPrice}>{sub.amount} أوقية</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#EAB308',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subscriptionGrid: {
    gap: 12,
  },
  subscriptionCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  subscriptionCardLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 4,
  },
  subscriptionCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subscriptionCardPrice: {
    fontSize: 14,
    color: '#EAB308',
    marginTop: 4,
  },
  subscriptionCardDays: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  noSubscription: {
    alignItems: 'center',
    padding: 48,
  },
  noSubscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyPlan: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 8,
  },
  historyBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EAB308',
  },
});
