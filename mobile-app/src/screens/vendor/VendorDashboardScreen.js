import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import SecureTokenManager from '../../services/secureStorage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VendorDashboardScreen({ navigation }) {
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const vendorData = await SecureTokenManager.getItem('vendor');
      const loginTime = await SecureTokenManager.getItem('vendorLoginTime');

      if (!vendorData || !loginTime) {
        navigation.replace('VendorLogin');
        return;
      }

      const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
      if (hoursSinceLogin > 24) {
        await SecureTokenManager.deleteItem('vendor');
        await SecureTokenManager.deleteItem('vendorLoginTime');
        navigation.replace('VendorLogin');
        return;
      }

      const parsedVendor = JSON.parse(vendorData);
      setVendor(parsedVendor);
      fetchDashboardData(parsedVendor.id);
    } catch (error) {
      console.error('Auth check error:', error);
      navigation.replace('VendorLogin');
    }
  };

  const fetchDashboardData = async (vendorId) => {
    try {
      // Fetch products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .eq('is_active', true);

      // Fetch profile view stats
      const { data: viewStats } = await supabase.rpc('get_vendor_profile_stats', {
        vendor_uuid: vendorId,
      });

      // Fetch subscription info
      const { data: subscription } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1)
        .single();

      let daysRemaining = null;
      if (subscription && subscription.end_date) {
        const endDate = new Date(subscription.end_date);
        const today = new Date();
        daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      setStats({
        total_products: totalProducts || 0,
        active_products: activeProducts || 0,
        total_views: viewStats?.total_views || 0,
        today_views: viewStats?.today_views || 0,
        subscription_end_date: subscription?.end_date || null,
        days_remaining: daysRemaining,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (vendor) {
      fetchDashboardData(vendor.id);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EAB308" />
        <Text style={styles.loadingText}>جاري تحميل لوحة التحكم...</Text>
      </View>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المنتجات',
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} نشط`,
      icon: 'package-variant',
      color: '#3B82F6',
      screen: 'Products',
    },
    {
      title: 'زيارات الملف الشخصي',
      value: stats?.total_views || 0,
      subtitle: `${stats?.today_views || 0} اليوم`,
      icon: 'eye',
      color: '#8B5CF6',
      screen: 'Analytics',
    },
    {
      title: 'أيام الاشتراك المتبقية',
      value: stats?.days_remaining || 0,
      subtitle: stats?.subscription_end_date
        ? new Date(stats.subscription_end_date).toLocaleDateString('ar-MR')
        : 'لا يوجد اشتراك',
      icon: 'calendar',
      color:
        stats && stats.days_remaining && stats.days_remaining < 7
          ? '#EF4444'
          : '#10B981',
      screen: 'Subscription',
    },
  ];

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
      {/* Welcome Section */}
      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeTitle}>مرحباً بك!</Text>
          <Text style={styles.welcomeSubtitle}>
            {vendor?.business_name || 'متجرك'}
          </Text>
        </View>
        <Icon name="trending-up" size={50} color="#EAB308" style={{ opacity: 0.5 }} />
      </View>

      {/* Subscription Warning */}
      {stats &&
        stats.days_remaining !== null &&
        stats.days_remaining < 7 &&
        stats.days_remaining > 0 && (
          <View style={styles.warningCard}>
            <Icon name="alert-circle" size={24} color="#F59E0B" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>اشتراكك قرب على الانتهاء!</Text>
              <Text style={styles.warningText}>
                لديك {stats.days_remaining} يوم متبقي. تواصل مع الإدارة للتجديد.
              </Text>
            </View>
          </View>
        )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            onPress={() => navigation.navigate(card.screen)}
          >
            <View style={[styles.statIcon, { backgroundColor: card.color }]}>
              <Icon name={card.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.statTitle}>{card.title}</Text>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statSubtitle}>{card.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Products', { screen: 'AddProduct' })}
        >
          <Icon name="plus-circle" size={24} color="#10B981" />
          <Text style={styles.actionButtonText}>إضافة منتج جديد</Text>
          <Icon name="chevron-left" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Icon name="chart-line" size={24} color="#8B5CF6" />
          <Text style={styles.actionButtonText}>عرض الإحصائيات</Text>
          <Icon name="chevron-left" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
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
  welcomeCard: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningContent: {
    flex: 1,
    marginRight: 12,
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
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 12,
  },
});
