import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather
} from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const CURRENT_VERSION = '1.5.1';
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
    features: ['وصول كامل للمنصة', 'منتجات غير محدودة', 'دعم العملاء', 'لوحة التحليلات']
  },
  {
    id: '2_months',
    name: 'خطة شهرين',
    price: 1600,
    duration: '60 يوم',
    savings: 'وفر 350 أوقية',
    features: ['وصول كامل للمنصة', 'منتجات غير محدودة', 'دعم العملاء ذو الأولوية', 'لوحة التحليلات', 'شارة البائع المميز']
  }
];

export default function App() {
  const scrollViewRef = useRef(null);
  const [screen, setScreen] = useState('login');
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

  const [uploadToken, setUploadToken] = useState(null);
  const [uploadTokenExpiry, setUploadTokenExpiry] = useState(null);

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

  const requestUploadToken = async () => {
    try {
      const response = await fetch('https://www.rimmarsa.com/api/vendor/request-upload-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get upload token');
      }

      setUploadToken(result.token);
      setUploadTokenExpiry(new Date(result.expires_at));
      return result.token;
    } catch (error) {
      console.error('Error requesting upload token:', error);
      throw error;
    }
  };

  const getValidUploadToken = async () => {
    // Check if we have a valid token
    if (uploadToken && uploadTokenExpiry && new Date(uploadTokenExpiry) > new Date()) {
      return uploadToken;
    }

    // Request new token
    return await requestUploadToken();
  };

  const uploadImage = async (asset, type) => {
    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      // Get or request upload token
      const token = await getValidUploadToken();

      // Create FormData for multipart upload
      const formData = new FormData();

      // Get file extension and create file object
      const fileExt = asset.uri.split('.').pop() || 'jpg';
      const fileName = `image.${fileExt}`;

      // Add upload token
      formData.append('token', token);

      // Add image file to FormData
      formData.append('image', {
        uri: asset.uri,
        type: asset.type || `image/${fileExt}`,
        name: fileName,
      });

      // Add image type
      formData.append('type', type);

      // Upload to server API
      const response = await fetch('https://www.rimmarsa.com/api/upload-vendor-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // If token expired or invalid, try getting a new token
        if (response.status === 401 && result.error?.includes('token')) {
          setUploadToken(null);
          setUploadTokenExpiry(null);
          throw new Error('انتهت صلاحية رمز التحميل. يرجى المحاولة مرة أخرى');
        }
        throw new Error(result.error || result.details || 'Upload failed');
      }

      // Map type to form field
      const fieldMap = {
        nni: 'nni_image_url',
        personal: 'personal_image_url',
        store: 'store_image_url',
        payment: 'payment_screenshot_url'
      };

      setFormData(prev => ({ ...prev, [fieldMap[type]]: result.url }));
      Alert.alert('نجح', 'تم تحميل الصورة بنجاح!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('خطأ', 'فشل تحميل الصورة. ' + (error instanceof Error ? error.message : 'حاول مرة أخرى'));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmitRegistration = async () => {
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

  const goToStep = (newStep) => {
    setStep(newStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderImageUpload = (type, label, iconName) => {
    const fieldMap = {
      nni: 'nni_image_url',
      personal: 'personal_image_url',
      store: 'store_image_url',
      payment: 'payment_screenshot_url',
    };

    return (
      <View style={styles.uploadGroup}>
        <View style={styles.uploadHeader}>
          <Ionicons name={iconName} size={20} color="#10B981" />
          <Text style={styles.uploadLabel}>{label}</Text>
        </View>
        {formData[fieldMap[type]] ? (
          <View style={styles.uploadedContainer}>
            <Image
              source={{ uri: formData[fieldMap[type]] }}
              style={styles.uploadedImage}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                setFormData((prev) => ({ ...prev, [fieldMap[type]]: '' }))
              }
            >
              <Text style={styles.removeButtonText}>إزالة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage(type)}
            disabled={uploading[type]}
          >
            <Feather name="upload-cloud" size={40} color="#6B7280" />
            <Text style={styles.uploadButtonText}>
              {uploading[type] ? 'جاري التحميل...' : 'انقر للتحميل'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCurrentScreen = () => {
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

    // Modern Registration Screen with LinearGradient
    if (screen === 'register') {
      return (
        <LinearGradient
          colors={['#111827', '#1F2937', '#000000']}
          style={styles.container}
        >
          <StatusBar barStyle="light-content" />
          <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Animatable.View animation="fadeInDown" style={styles.modernHeader}>
              <Text style={styles.modernHeaderTitle}>كن بائعاً</Text>
              <Text style={styles.modernHeaderSubtitle}>انضم إلى منصة السوق الرائدة في موريتانيا</Text>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setScreen('login')}
              >
                <Feather name="arrow-left" size={16} color="#10B981" />
                <Text style={styles.backLinkText}>العودة إلى تسجيل الدخول</Text>
              </TouchableOpacity>
            </Animatable.View>

            {/* Progress Steps */}
            <Animatable.View animation="fadeIn" delay={200} style={styles.progressContainer}>
              {[1, 2, 3, 4].map((s, index) => (
                <React.Fragment key={s}>
                  <View style={styles.stepWrapper}>
                    <View
                      style={[
                        styles.stepCircle,
                        step >= s && styles.stepCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumber,
                          step >= s && styles.stepNumberActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </View>
                  </View>
                  {s < 4 && (
                    <View
                      style={[
                        styles.stepLine,
                        step > s && styles.stepLineActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </Animatable.View>

            {/* Form Card */}
            <Animatable.View animation="fadeInUp" delay={400} style={styles.formCard}>
              {/* Step 1: Business Information */}
              {step === 1 && (
                <View>
                  <View style={styles.stepHeader}>
                    <MaterialCommunityIcons name="store" size={24} color="#10B981" />
                    <Text style={styles.stepTitle}>معلومات العمل</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>اسم العمل *</Text>
                    <View style={styles.modernInputContainer}>
                      <MaterialCommunityIcons name="store-outline" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.modernInput}
                        placeholder="اسم عملك التجاري"
                        placeholderTextColor="#6B7280"
                        value={formData.business_name}
                        onChangeText={(text) =>
                          setFormData({ ...formData, business_name: text })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>اسم المالك *</Text>
                    <View style={styles.modernInputContainer}>
                      <Ionicons name="person-outline" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.modernInput}
                        placeholder="الاسم الكامل"
                        placeholderTextColor="#6B7280"
                        value={formData.owner_name}
                        onChangeText={(text) =>
                          setFormData({ ...formData, owner_name: text })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>رقم الهاتف *</Text>
                    <View style={styles.modernInputContainer}>
                      <Ionicons name="call-outline" size={20} color="#6B7280" />
                      <Text style={styles.phonePrefix}>+222</Text>
                      <TextInput
                        style={[styles.modernInput, { flex: 1 }]}
                        placeholder="XXXXXXXX"
                        placeholderTextColor="#6B7280"
                        keyboardType="phone-pad"
                        maxLength={8}
                        value={formData.phoneDigits}
                        onChangeText={(text) => {
                          const value = text.replace(/\D/g, '').slice(0, 8);
                          setFormData({ ...formData, phoneDigits: value });
                        }}
                        onBlur={checkExistingRequest}
                      />
                    </View>
                    <Text style={styles.helperText}>أدخل 8 أرقام فقط</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>كلمة المرور *</Text>
                    <View style={styles.modernInputContainer}>
                      <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.modernInput}
                        placeholder="يجب أن تحتوي على أرقام وحروف"
                        placeholderTextColor="#6B7280"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(text) =>
                          setFormData({ ...formData, password: text })
                        }
                      />
                    </View>
                    <Text style={styles.helperText}>8 أحرف على الأقل، أرقام وحروف</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>رقم الواتساب *</Text>
                    <View style={styles.modernInputContainer}>
                      <Ionicons name="logo-whatsapp" size={20} color="#6B7280" />
                      <Text style={styles.phonePrefix}>+222</Text>
                      <TextInput
                        style={[styles.modernInput, { flex: 1 }]}
                        placeholder="XXXXXXXX"
                        placeholderTextColor="#6B7280"
                        keyboardType="phone-pad"
                        maxLength={8}
                        value={formData.whatsappDigits}
                        onChangeText={(text) => {
                          const value = text.replace(/\D/g, '').slice(0, 8);
                          setFormData({ ...formData, whatsappDigits: value });
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>رمز الإحالة (اختياري)</Text>
                    <View style={styles.modernInputContainer}>
                      <MaterialCommunityIcons name="star-outline" size={20} color="#10B981" />
                      <TextInput
                        style={styles.modernInput}
                        placeholder="أدخل رمز الإحالة"
                        placeholderTextColor="#6B7280"
                        value={formData.referral_code}
                        onChangeText={(text) =>
                          setFormData({ ...formData, referral_code: text.toUpperCase() })
                        }
                        maxLength={20}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.modernNextButton} onPress={() => goToStep(2)}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.modernNextButtonText}>التالي: الموقع</Text>
                      <Feather name="arrow-right" size={20} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <View>
                  <View style={styles.stepHeader}>
                    <Ionicons name="location-outline" size={24} color="#10B981" />
                    <Text style={styles.stepTitle}>الموقع</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>المنطقة</Text>
                    <View style={styles.chipContainer}>
                      {regions.map((region) => (
                        <TouchableOpacity
                          key={region.id}
                          style={[
                            styles.chip,
                            formData.region_id === region.id && styles.chipSelected,
                          ]}
                          onPress={() =>
                            setFormData({ ...formData, region_id: region.id, city_id: '' })
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              formData.region_id === region.id && styles.chipTextSelected,
                            ]}
                          >
                            {region.name_ar || region.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {formData.region_id && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.modernInputLabel}>المدينة</Text>
                      <View style={styles.chipContainer}>
                        {filteredCities.map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={[
                              styles.chip,
                              formData.city_id === city.id && styles.chipSelected,
                            ]}
                            onPress={() =>
                              setFormData({ ...formData, city_id: city.id })
                            }
                          >
                            <Text
                              style={[
                                styles.chipText,
                                formData.city_id === city.id && styles.chipTextSelected,
                              ]}
                            >
                              {city.name_ar || city.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.modernInputLabel}>العنوان</Text>
                    <View style={styles.modernInputContainer}>
                      <Ionicons name="home-outline" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.modernInput}
                        placeholder="عنوان الشارع"
                        placeholderTextColor="#6B7280"
                        value={formData.address}
                        onChangeText={(text) =>
                          setFormData({ ...formData, address: text })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.modernBackBtn, { flex: 1 }]} onPress={() => goToStep(1)}>
                      <Text style={styles.modernBackBtnText}>السابق</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modernNextButton, { flex: 1 }]} onPress={() => goToStep(3)}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.modernNextButtonText}>التالي: المستندات</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Step 3: Documents */}
              {step === 3 && (
                <View>
                  <View style={styles.stepHeader}>
                    <Feather name="upload" size={24} color="#10B981" />
                    <Text style={styles.stepTitle}>تحميل المستندات</Text>
                  </View>

                  {renderImageUpload('nni', 'البطاقة الوطنية (NNI) *', 'shield-checkmark-outline')}
                  {renderImageUpload('personal', 'الصورة الشخصية *', 'person-outline')}
                  {renderImageUpload('store', 'صورة المتجر *', 'business-outline')}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.modernBackBtn, { flex: 1 }]} onPress={() => goToStep(2)}>
                      <Text style={styles.modernBackBtnText}>السابق</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modernNextButton, { flex: 1, opacity: (!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url) ? 0.5 : 1 }]}
                      onPress={() => goToStep(4)}
                      disabled={!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.modernNextButtonText}>التالي: الدفع</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Step 4: Payment */}
              {step === 4 && (
                <View>
                  <View style={styles.stepHeader}>
                    <Ionicons name="card-outline" size={24} color="#10B981" />
                    <Text style={styles.stepTitle}>اختيار الخطة والدفع</Text>
                  </View>

                  <View style={styles.plansContainer}>
                    {PRICING_PLANS.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.modernPlanCard,
                          formData.package_plan === plan.id && styles.modernPlanCardSelected,
                        ]}
                        onPress={() =>
                          setFormData({ ...formData, package_plan: plan.id })
                        }
                      >
                        {plan.savings && (
                          <View style={styles.savingsBadge}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                          </View>
                        )}
                        <Text style={styles.modernPlanName}>{plan.name}</Text>
                        <Text style={styles.modernPlanPrice}>{plan.price} أوقية</Text>
                        <Text style={styles.modernPlanDuration}>{plan.duration}</Text>
                        {plan.features && (
                          <View style={styles.planFeatures}>
                            {plan.features.map((feature, i) => (
                              <View key={i} style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>{feature}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {renderImageUpload('payment', 'لقطة شاشة الدفع *', 'receipt-outline')}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.modernBackBtn, { flex: 1 }]} onPress={() => goToStep(3)}>
                      <Text style={styles.modernBackBtnText}>السابق</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modernSubmitButton, { flex: 1, opacity: (!formData.payment_screenshot_url || loading) ? 0.5 : 1 }]}
                      onPress={handleSubmitRegistration}
                      disabled={loading || !formData.payment_screenshot_url}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        {loading ? (
                          <>
                            <ActivityIndicator color="white" size="small" />
                            <Text style={styles.modernSubmitButtonText}> جاري الإرسال...</Text>
                          </>
                        ) : (
                          <Text style={styles.modernSubmitButtonText}>إرسال الطلب</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animatable.View>
          </ScrollView>
        </LinearGradient>
      );
    }

    return null;
  };

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
      {renderCurrentScreen()}
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
  // Modern Registration Styles
  modernHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  modernHeaderTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  modernHeaderSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backLinkText: {
    color: '#10B981',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  stepWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumber: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#374151',
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  stepHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  modernInputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'right',
  },
  modernInputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  modernInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 14,
    textAlign: 'right',
  },
  phonePrefix: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  modernNextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradientButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  modernNextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modernBackBtn: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modernBackBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  uploadGroup: {
    marginBottom: 20,
  },
  uploadHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  uploadLabel: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
  },
  uploadedContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  plansContainer: {
    marginBottom: 24,
  },
  modernPlanCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  modernPlanCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modernPlanName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  modernPlanPrice: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  modernPlanDuration: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
  },
  planFeatures: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  featureRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  modernSubmitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernSubmitButtonText: {
    color: '#FFFFFF',
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
