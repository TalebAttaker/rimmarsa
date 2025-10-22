import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../../services/supabase';
import SecureTokenManager from '../../services/secureStorage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function VendorLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('vendor_login', {
        phone_number: phone,
        login_password: password,
      });

      if (error) throw error;

      if (data && data.success) {
        // Store vendor data securely
        await SecureTokenManager.saveSession(data.vendor);
        await SecureTokenManager.saveVendorId(data.vendor.id);

        // Store login timestamp securely
        await SecureTokenManager.saveItem('vendorLoginTime', Date.now().toString());

        // Navigate to dashboard
        navigation.replace('VendorDashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('خطأ', error.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Icon name="store" size={50} color="#000" />
          </View>
          <Text style={styles.title}>ريمارسا</Text>
          <Text style={styles.subtitle}>لوحة تحكم البائع</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>تسجيل الدخول</Text>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="رقم الهاتف"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                <Icon name="arrow-left" size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            ليس لديك حساب؟{' '}
            <Text style={styles.linkText} onPress={() => navigation.navigate('Home')}>
              سجل كبائع
            </Text>
          </Text>
        </View>

        {/* Back to Home */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← العودة إلى الصفحة الرئيسية</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  formContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#EAB308',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  helpText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  linkText: {
    color: '#EAB308',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
