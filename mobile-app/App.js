import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Modal
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';

const CURRENT_VERSION = '1.5.0';
const VERSION_CHECK_URL = 'https://www.rimmarsa.com/api/app-version';

const supabase = createClient(
  'https://rfyqzuuuumgdoomyhqcu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXF6dXV1dW1nZG9vbXlocWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg5OTY0MTgsImV4cCI6MjA0NDU3MjQxOH0.S8x2vcvA5YhCa6LAqSNh1lOoJSGpSUyZjSrX5JTjQRY'
);

const PRICING_PLANS = [
  {
    id: '1_month',
    name: 'خطة شهر واحد',
    price: 1250,
    duration: '30 يوم',
  },
  {
    id: '2_months',
    name: 'خطة شهرين',
    price: 1600,
    duration: '60 يوم',
    savings: 'وفر 350 أوقية',
  }
];

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login', 'dashboard', 'register', 'pending', 'success'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [pendingRequest, setPendingRequest] = useState(null);

  // Version checking state
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phoneDigits: '',
    password: '',
    whatsappDigits: '',
    region_id: '',
    city_id: '',
    address: '',
    package_plan: '2_months',
    referral_code: '',
    nni_image_url: '',
    personal_image_url: '',
    store_image_url: '',
    payment_screenshot_url: ''
  });

  const [uploading, setUploading] = useState({
    nni: false,
    personal: false,
    store: false,
    payment: false
  });

  // Check for app updates on mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (screen === 'register') {
      fetchLocationData();
    }
  }, [screen]);

  useEffect(() => {
    if (formData.region_id) {
      const citiesInRegion = cities.filter(city => city.region_id === formData.region_id);
      setFilteredCities(citiesInRegion);
      if (!citiesInRegion.find(c => c.id === formData.city_id)) {
        setFormData(prev => ({ ...prev, city_id: '' }));
      }
    } else {
      setFilteredCities([]);
    }
  }, [formData.region_id, cities]);

  const fetchLocationData = async () => {
    try {
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      const { data: citiesData } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setRegions(regionsData || []);
      setCities(citiesData || []);
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  };

  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  };

  const checkForUpdates = async () => {
    try {
      const response = await fetch(VERSION_CHECK_URL);
      const data = await response.json();

      const needsUpdate = compareVersions(data.version, CURRENT_VERSION) > 0;
      const forceUpdate = data.forceUpdate && compareVersions(CURRENT_VERSION, data.minimumVersion) < 0;

      if (needsUpdate || forceUpdate) {
        setUpdateInfo(data);
        setShowUpdateModal(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // Silently fail - don't block the app
    }
  };

  const handleDownloadUpdate = () => {
    if (updateInfo && updateInfo.downloadUrl) {
      Linking.openURL(updateInfo.downloadUrl);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[\s+\-()]/g, '');
      const email = `${cleanPhone}@rimmarsa.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('owner_phone', phone)
        .single();

      setVendorData(vendor);
      setIsLoggedIn(true);
      setScreen('dashboard');
    } catch (error) {
      Alert.alert('خطأ', 'خطأ في تسجيل الدخول: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setVendorData(null);
    setPhone('');
    setPassword('');
    setScreen('login');
  };

  const checkExistingRequest = async () => {
    if (formData.phoneDigits.length === 8) {
      const fullPhone = `+222${formData.phoneDigits}`;

      try {
        const { data } = await supabase
          .from('vendor_requests')
          .select('*')
          .eq('phone', fullPhone)
          .eq('status', 'pending')
          .maybeSingle();

        if (data) {
          setPendingRequest(data);
          setScreen('pending');
          return true;
        }
      } catch (error) {
        console.error('Error checking request:', error);
      }
    }
    return false;
  };

  const validatePassword = (password) => {
    const hasNumbers = /\d/.test(password);
    const hasLetters = /[a-zA-Z]/.test(password);
    const minLength = password.length >= 8;

    if (!minLength) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (!hasNumbers) return 'كلمة المرور يجب أن تحتوي على أرقام';
    if (!hasLetters) return 'كلمة المرور يجب أن تحتوي على حروف';

    return null;
  };

  const pickImage = async (type) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('خطأ', 'يرجى السماح بالوصول إلى الصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'payment' || type === 'store' ? [4, 3] : [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0], type);
    }
  };

  const uploadImage = async (asset, type) => {
    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const fileExt = asset.uri.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vendor-requests/${type}/${fileName}`;

      // Convert base64 to blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const fieldMap = {
        nni: 'nni_image_url',
        personal: 'personal_image_url',
        store: 'store_image_url',
        payment: 'payment_screenshot_url'
      };

      setFormData(prev => ({ ...prev, [fieldMap[type]]: publicUrl }));
      Alert.alert('نجح', 'تم تحميل الصورة بنجاح!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('خطأ', 'فشل تحميل الصورة: ' + error.message);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmitRegistration = async () => {
    // Validation
    if (!formData.phoneDigits || formData.phoneDigits.length !== 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح (8 أرقام)');
      return;
    }

    if (!formData.whatsappDigits || formData.whatsappDigits.length !== 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم واتساب صحيح (8 أرقام)');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      Alert.alert('خطأ', passwordError);
      return;
    }

    if (!formData.nni_image_url || !formData.personal_image_url ||
        !formData.store_image_url || !formData.payment_screenshot_url) {
      Alert.alert('خطأ', 'يرجى تحميل جميع الصور المطلوبة');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `+222${formData.phoneDigits}`;
      const fullWhatsapp = `+222${formData.whatsappDigits}`;

      // Check for duplicate
      const { data: existingData } = await supabase
        .from('vendor_requests')
        .select('id')
        .eq('phone', fullPhone)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingData) {
        Alert.alert('خطأ', 'لديك بالفعل طلب تسجيل قيد الانتظار!');
        setLoading(false);
        return;
      }

      const selectedPlan = PRICING_PLANS.find(p => p.id === formData.package_plan);
      const cleanPhone = fullPhone.replace(/[\s+\-()]/g, '');
      const generatedEmail = `${cleanPhone}@rimmarsa.com`;

      const { error } = await supabase
        .from('vendor_requests')
        .insert([{
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          email: generatedEmail,
          phone: fullPhone,
          password: formData.password,
          whatsapp_number: fullWhatsapp,
          region_id: formData.region_id || null,
          city_id: formData.city_id || null,
          address: formData.address || null,
          package_plan: formData.package_plan,
          package_price: selectedPlan?.price || 0,
          referred_by_code: formData.referral_code || null,
          nni_image_url: formData.nni_image_url,
          personal_image_url: formData.personal_image_url,
          store_image_url: formData.store_image_url,
          payment_screenshot_url: formData.payment_screenshot_url,
          status: 'pending'
        }]);

      if (error) throw error;

      setScreen('success');
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('خطأ', 'فشل في إرسال الطلب: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render function for current screen
  const renderCurrentScreen = () => {
    // Login Screen
    if (screen === 'login') {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <ScrollView contentContainerStyle={styles.loginContainer}>
            <Text style={styles.logo}>ريمارسا</Text>
            <Text style={styles.subtitle}>تطبيق البائع</Text>

            <TextInput
              style={styles.input}
              placeholder="رقم الهاتف"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => setScreen('register')}
            >
              <Text style={styles.registerLinkText}>
                ليس لديك حساب؟ <Text style={styles.registerLinkBold}>سجل الآن</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.version}>الإصدار 1.5.0</Text>
          </ScrollView>
        </View>
      );
    }

    // Pending Request Screen
    if (screen === 'pending' && pendingRequest) {
      const selectedPlan = PRICING_PLANS.find(p => p.id === pendingRequest.package_plan);
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <ScrollView contentContainerStyle={styles.centerContainer}>
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>⏳</Text>
              <Text style={styles.successTitle}>الطلب قيد الانتظار</Text>

              <View style={styles.detailsCard}>
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>العمل: </Text>
                  {pendingRequest.business_name}
                </Text>
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>الهاتف: </Text>
                  {pendingRequest.phone}
                </Text>
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>الخطة: </Text>
                  {selectedPlan?.name} - {pendingRequest.package_price} أوقية
                </Text>
              </View>

              <Text style={styles.successMessage}>
                فريق الإدارة لدينا يراجع طلبك. ستتلقى إشعاراً بمجرد الموافقة على طلبك.
              </Text>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setPendingRequest(null);
                  setScreen('login');
                }}
              >
                <Text style={styles.backButtonText}>العودة لتسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Success Screen
    if (screen === 'success') {
      const selectedPlan = PRICING_PLANS.find(p => p.id === formData.package_plan);
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <ScrollView contentContainerStyle={styles.centerContainer}>
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>تم إرسال الطلب!</Text>
              <Text style={styles.successMessage}>
                شكراً لتقديم طلبك للانضمام إلى ريمارسا! لقد استلمنا طلبك وسنقوم بمراجعته قريباً.
              </Text>

              <View style={styles.detailsCard}>
                <Text style={styles.detailRow}>{formData.business_name}</Text>
                <Text style={styles.detailRow}>+222{formData.phoneDigits}</Text>
                <Text style={[styles.detailRow, { color: '#EAB308' }]}>
                  {selectedPlan?.name} - {selectedPlan?.price} أوقية
                </Text>
              </View>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setFormData({
                    business_name: '',
                    owner_name: '',
                    phoneDigits: '',
                    password: '',
                    whatsappDigits: '',
                    region_id: '',
                    city_id: '',
                    address: '',
                    package_plan: '2_months',
                    referral_code: '',
                    nni_image_url: '',
                    personal_image_url: '',
                    store_image_url: '',
                    payment_screenshot_url: ''
                  });
                  setStep(1);
                  setScreen('login');
                }}
              >
                <Text style={styles.backButtonText}>العودة لتسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Dashboard Screen
    if (screen === 'dashboard' && isLoggedIn && vendorData) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>لوحة تحكم البائع</Text>
            <Text style={styles.headerSubtitle}>ريمارسا</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>معلومات المتجر</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>اسم المتجر:</Text>
                <Text style={styles.value}>{vendorData.business_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>اسم المالك:</Text>
                <Text style={styles.value}>{vendorData.owner_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>رقم الهاتف:</Text>
                <Text style={styles.value}>{vendorData.owner_phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>الحالة:</Text>
                <Text style={[styles.value, styles.activeStatus]}>
                  {vendorData.is_active ? 'نشط' : 'غير نشط'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // Registration Screen
    if (screen === 'register') {
      const selectedPlan = PRICING_PLANS.find(p => p.id === formData.package_plan);

      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>التسجيل كبائع</Text>
            <Text style={styles.headerSubtitle}>الخطوة {step} من 4</Text>
          </View>

          <ScrollView style={styles.content}>
            {/* Step 1: Business Information */}
            {step === 1 && (
              <View>
                <Text style={styles.sectionTitle}>معلومات العمل</Text>

                <TextInput
                  style={styles.input}
                  placeholder="اسم العمل *"
                  placeholderTextColor="#9CA3AF"
                  value={formData.business_name}
                  onChangeText={(text) => setFormData({...formData, business_name: text})}
                />

                <TextInput
                  style={styles.input}
                  placeholder="اسم المالك *"
                  placeholderTextColor="#9CA3AF"
                  value={formData.owner_name}
                  onChangeText={(text) => setFormData({...formData, owner_name: text})}
                />

                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+222</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="رقم الهاتف (8 أرقام) *"
                    placeholderTextColor="#9CA3AF"
                    value={formData.phoneDigits}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, '').slice(0, 8);
                      setFormData({...formData, phoneDigits: digits});
                    }}
                    onBlur={checkExistingRequest}
                    keyboardType="phone-pad"
                    maxLength={8}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور (8 أحرف، أرقام وحروف) *"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  secureTextEntry
                />

                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+222</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="رقم الواتساب (8 أرقام) *"
                    placeholderTextColor="#9CA3AF"
                    value={formData.whatsappDigits}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, '').slice(0, 8);
                      setFormData({...formData, whatsappDigits: digits});
                    }}
                    keyboardType="phone-pad"
                    maxLength={8}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="رمز الإحالة (اختياري)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.referral_code}
                  onChangeText={(text) => setFormData({...formData, referral_code: text.toUpperCase()})}
                  maxLength={20}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setScreen('login')}
                  >
                    <Text style={styles.secondaryButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.primaryButtonText}>التالي</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <View>
                <Text style={styles.sectionTitle}>الموقع</Text>

                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>المنطقة:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPicker}>
                    {regions.map(region => (
                      <TouchableOpacity
                        key={region.id}
                        style={[
                          styles.pickerOption,
                          formData.region_id === region.id && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({...formData, region_id: region.id})}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          formData.region_id === region.id && styles.pickerOptionTextSelected
                        ]}>
                          {region.name_ar || region.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {formData.region_id && (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>المدينة:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalPicker}>
                      {filteredCities.map(city => (
                        <TouchableOpacity
                          key={city.id}
                          style={[
                            styles.pickerOption,
                            formData.city_id === city.id && styles.pickerOptionSelected
                          ]}
                          onPress={() => setFormData({...formData, city_id: city.id})}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            formData.city_id === city.id && styles.pickerOptionTextSelected
                          ]}>
                            {city.name_ar || city.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="العنوان"
                  placeholderTextColor="#9CA3AF"
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(1)}
                  >
                    <Text style={styles.secondaryButtonText}>السابق</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setStep(3)}
                  >
                    <Text style={styles.primaryButtonText}>التالي</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <View>
                <Text style={styles.sectionTitle}>تحميل المستندات</Text>

                {/* NNI Image */}
                <View style={styles.imageUploadCard}>
                  <Text style={styles.imageLabel}>البطاقة الوطنية (NNI) *</Text>
                  {formData.nni_image_url ? (
                    <View>
                      <Image source={{ uri: formData.nni_image_url }} style={styles.uploadedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setFormData({...formData, nni_image_url: ''})}
                      >
                        <Text style={styles.removeImageText}>إزالة</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => pickImage('nni')}
                      disabled={uploading.nni}
                    >
                      {uploading.nni ? (
                        <ActivityIndicator color="#EAB308" />
                      ) : (
                        <Text style={styles.uploadButtonText}>📷 اختر صورة</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Personal Image */}
                <View style={styles.imageUploadCard}>
                  <Text style={styles.imageLabel}>الصورة الشخصية *</Text>
                  {formData.personal_image_url ? (
                    <View>
                      <Image source={{ uri: formData.personal_image_url }} style={styles.uploadedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setFormData({...formData, personal_image_url: ''})}
                      >
                        <Text style={styles.removeImageText}>إزالة</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => pickImage('personal')}
                      disabled={uploading.personal}
                    >
                      {uploading.personal ? (
                        <ActivityIndicator color="#EAB308" />
                      ) : (
                        <Text style={styles.uploadButtonText}>📷 اختر صورة</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Store Image */}
                <View style={styles.imageUploadCard}>
                  <Text style={styles.imageLabel}>صورة المتجر *</Text>
                  {formData.store_image_url ? (
                    <View>
                      <Image source={{ uri: formData.store_image_url }} style={styles.uploadedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setFormData({...formData, store_image_url: ''})}
                      >
                        <Text style={styles.removeImageText}>إزالة</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => pickImage('store')}
                      disabled={uploading.store}
                    >
                      {uploading.store ? (
                        <ActivityIndicator color="#EAB308" />
                      ) : (
                        <Text style={styles.uploadButtonText}>📷 اختر صورة</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(2)}
                  >
                    <Text style={styles.secondaryButtonText}>السابق</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url) && styles.buttonDisabled
                    ]}
                    onPress={() => setStep(4)}
                    disabled={!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url}
                  >
                    <Text style={styles.primaryButtonText}>التالي</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 4: Pricing & Payment */}
            {step === 4 && (
              <View>
                <Text style={styles.sectionTitle}>اختيار الخطة والدفع</Text>

                {/* Pricing Plans */}
                {PRICING_PLANS.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      formData.package_plan === plan.id && styles.planCardSelected
                    ]}
                    onPress={() => setFormData({...formData, package_plan: plan.id})}
                  >
                    {plan.savings && (
                      <Text style={styles.planSavings}>{plan.savings}</Text>
                    )}
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>{plan.price} أوقية</Text>
                    <Text style={styles.planDuration}>{plan.duration}</Text>
                  </TouchableOpacity>
                ))}

                {/* Payment Screenshot */}
                <View style={styles.imageUploadCard}>
                  <Text style={styles.imageLabel}>لقطة شاشة الدفع *</Text>
                  <Text style={styles.helperText}>
                    يرجى إجراء الدفع وتحميل لقطة الشاشة هنا
                  </Text>
                  {formData.payment_screenshot_url ? (
                    <View>
                      <Image source={{ uri: formData.payment_screenshot_url }} style={styles.uploadedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setFormData({...formData, payment_screenshot_url: ''})}
                      >
                        <Text style={styles.removeImageText}>إزالة</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => pickImage('payment')}
                      disabled={uploading.payment}
                    >
                      {uploading.payment ? (
                        <ActivityIndicator color="#EAB308" />
                      ) : (
                        <Text style={styles.uploadButtonText}>📷 اختر صورة</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(3)}
                  >
                    <Text style={styles.secondaryButtonText}>السابق</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!formData.payment_screenshot_url || loading) && styles.buttonDisabled
                    ]}
                    onPress={handleSubmitRegistration}
                    disabled={!formData.payment_screenshot_url || loading}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    // Default fallback (shouldn't happen)
    return null;
  };

  // Update Modal - Renders on top of all screens
  const renderUpdateModal = () => (
    <Modal
      visible={showUpdateModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (updateInfo && !updateInfo.forceUpdate) {
          setShowUpdateModal(false);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalIcon}>🚀</Text>
          <Text style={styles.modalTitle}>إصدار جديد متاح!</Text>

          {updateInfo && updateInfo.updateMessage && (
            <Text style={styles.modalMessage}>
              {updateInfo.updateMessage.ar}
            </Text>
          )}

          {updateInfo && updateInfo.releaseNotes && updateInfo.releaseNotes.ar && (
            <View style={styles.releaseNotesContainer}>
              <Text style={styles.releaseNotesTitle}>ما الجديد:</Text>
              {updateInfo.releaseNotes.ar.map((note, index) => (
                <Text key={index} style={styles.releaseNoteItem}>
                  • {note}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalUpdateButton}
              onPress={handleDownloadUpdate}
            >
              <Text style={styles.modalUpdateButtonText}>تحديث الآن</Text>
            </TouchableOpacity>

            {updateInfo && !updateInfo.forceUpdate && (
              <TouchableOpacity
                style={styles.modalLaterButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.modalLaterButtonText}>لاحقاً</Text>
              </TouchableOpacity>
            )}
          </View>

          {updateInfo && updateInfo.forceUpdate && (
            <Text style={styles.modalForceUpdateText}>
              يجب التحديث للمتابعة
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {/* Render current screen */}
      {renderCurrentScreen()}

      {/* Update Modal overlays all screens */}
      {renderUpdateModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EAB308',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  phoneInputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  phonePrefix: {
    color: '#9CA3AF',
    fontSize: 16,
    marginLeft: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: '#EAB308',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  registerLinkBold: {
    color: '#EAB308',
    fontWeight: 'bold',
  },
  version: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAB308',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  label: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeStatus: {
    color: '#10B981',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 20,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#EAB308',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  horizontalPicker: {
    flexDirection: 'row',
  },
  pickerOption: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#EAB308',
  },
  pickerOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
  },
  imageUploadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  imageLabel: {
    color: '#EAB308',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'right',
  },
  uploadButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#475569',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  planCardSelected: {
    borderColor: '#EAB308',
    backgroundColor: '#1E293B',
  },
  planSavings: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  planPrice: {
    color: '#EAB308',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  planDuration: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'right',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  detailRow: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  detailLabel: {
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#EAB308',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Update Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  releaseNotesContainer: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  releaseNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 12,
    textAlign: 'right',
  },
  releaseNoteItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 20,
  },
  modalButtonContainer: {
    width: '100%',
    gap: 12,
  },
  modalUpdateButton: {
    backgroundColor: '#EAB308',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  modalUpdateButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLaterButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  modalLaterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalForceUpdateText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
});
