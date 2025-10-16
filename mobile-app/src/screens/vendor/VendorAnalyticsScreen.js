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

export default function VendorAnalyticsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const loadAnalytics = async () => {
    try {
      const vendorData = await AsyncStorage.getItem('vendor');
      if (!vendorData) {
        navigation.replace('VendorLogin');
        return;
      }

      const vendor = JSON.parse(vendorData);
      await fetchAnalytics(vendor.id);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const fetchAnalytics = async (vendorId) => {
    try {
      const { data, error } = await supabase.rpc('get_vendor_profile_stats', {
        vendor_uuid: vendorId,
      });

      if (error) throw error;

      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      Alert.alert('خطأ', 'فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EAB308" />
        <Text style={styles.loadingText}>جاري تحميل الإحصائيات...</Text>
      </View>
    );
  }

  const statCards = [
    {
      title: 'إجمالي الزيارات',
      value: stats?.total_views || 0,
      description: 'منذ البداية',
      icon: 'eye',
      color: '#3B82F6',
    },
    {
      title: 'زيارات اليوم',
      value: stats?.today_views || 0,
      description: 'خلال آخر 24 ساعة',
      icon: 'trending-up',
      color: '#10B981',
    },
    {
      title: 'زيارات الأسبوع',
      value: stats?.week_views || 0,
      description: 'خلال آخر 7 أيام',
      icon: 'calendar-week',
      color: '#8B5CF6',
    },
    {
      title: 'زيارات الشهر',
      value: stats?.month_views || 0,
      description: 'خلال آخر 30 يوم',
      icon: 'account-group',
      color: '#EAB308',
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإحصائيات والتحليلات</Text>
        <Text style={styles.headerSubtitle}>
          تابع أداء متجرك وزيارات ملفك الشخصي
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statCards.map((card, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: card.color }]}>
              <Icon name={card.icon} size={32} color="#fff" />
            </View>
            <Text style={styles.statTitle}>{card.title}</Text>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statDescription}>{card.description}</Text>
          </View>
        ))}
      </View>

      {/* Info Box */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>حول الإحصائيات</Text>
        <View style={styles.infoItem}>
          <Icon name="checkbox-marked-circle" size={20} color="#EAB308" />
          <Text style={styles.infoText}>
            يتم احتساب الزيارات عندما يقوم شخص ما بعرض ملفك الشخصي أو منتجاتك
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="checkbox-marked-circle" size={20} color="#EAB308" />
          <Text style={styles.infoText}>الإحصائيات يتم تحديثها في الوقت الفعلي</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="checkbox-marked-circle" size={20} color="#EAB308" />
          <Text style={styles.infoText}>
            استخدم هذه البيانات لفهم مدى تفاعل العملاء مع منتجاتك
          </Text>
        </View>
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
  header: {
    padding: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
});
