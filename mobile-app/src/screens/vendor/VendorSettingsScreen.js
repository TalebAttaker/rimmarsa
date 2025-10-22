import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SecureTokenManager from '../../services/secureStorage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VendorSettingsScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => {
          try {
            await SecureTokenManager.deleteItem('vendor');
            await SecureTokenManager.deleteItem('vendorLoginTime');
            navigation.replace('VendorLogin');
          } catch (error) {
            console.error('Error logging out:', error);
          }
        },
      },
    ]);
  };

  const settingsOptions = [
    {
      title: 'حسابي',
      icon: 'account',
      color: '#3B82F6',
      onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير'),
    },
    {
      title: 'الإشعارات',
      icon: 'bell',
      color: '#EAB308',
      onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير'),
    },
    {
      title: 'اللغة',
      icon: 'translate',
      color: '#8B5CF6',
      onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير'),
    },
    {
      title: 'المساعدة والدعم',
      icon: 'help-circle',
      color: '#10B981',
      onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير'),
    },
    {
      title: 'الشروط والأحكام',
      icon: 'file-document',
      color: '#6B7280',
      onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* App Info */}
      <View style={styles.appInfo}>
        <View style={styles.logo}>
          <Icon name="store" size={40} color="#000" />
        </View>
        <Text style={styles.appName}>ريمارسا</Text>
        <Text style={styles.appVersion}>النسخة 1.0.0</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإعدادات</Text>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionCard}
            onPress={option.onPress}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
              <Icon name={option.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Icon name="chevron-left" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 ريمارسا. جميع الحقوق محفوظة.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
