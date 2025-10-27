import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather
} from '@expo/vector-icons';
import { Buffer } from 'buffer';
import SecureTokenManager from '../services/secureStorage';
import { supabase } from '../services/supabase';
import { uploadImageToR2, requestUploadToken } from '../services/r2Upload';

const { width, height } = Dimensions.get('window');

export default function VendorRegistrationScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const scrollViewRef = useRef(null);

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    phoneDigits: '',
    password: '',
    whatsapp_number: '',
    whatsappDigits: '',
    region_id: '',
    city_id: '',
    address: '',
    package_plan: '2_months',
    referral_code: '',
    nni_image_url: '',
    personal_image_url: '',
    store_image_url: '',
    payment_screenshot_url: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const [uploadProgress, setUploadProgress] = useState({
    nni: 0,
    personal: 0,
    store: 0,
    payment: 0,
  });

  const [uploading, setUploading] = useState({
    nni: false,
    personal: false,
    store: false,
    payment: false,
  });

  const [uploadToken, setUploadToken] = useState(null);

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
    },
  ];

  useEffect(() => {
    fetchData();
    requestPermissions();
    checkInitialPhone();
  }, []);

  useEffect(() => {
    if (formData.region_id) {
      const filtered = cities.filter(
        (city) => city.region_id === formData.region_id
      );
      setFilteredCities(filtered);
      if (!filtered.find(c => c.id === formData.city_id)) {
        setFormData(prev => ({ ...prev, city_id: '' }));
      }
    }
  }, [formData.region_id, cities]);

  // Request upload token when reaching step 3 (documents)
  useEffect(() => {
    if (step === 3 && !uploadToken) {
      requestUploadToken()
        .then(token => {
          setUploadToken(token);
          console.log('Upload token acquired for R2 uploads');
        })
        .catch(error => {
          console.error('Failed to get upload token:', error);
          Alert.alert('خطأ', 'فشل في الحصول على رمز التحميل. يرجى تحديث الصفحة.');
        });
    }
  }, [step, uploadToken]);

  const checkInitialPhone = async () => {
    try {
      const storedPhone = await SecureTokenManager.getItem('vendor_registration_phone');
      if (storedPhone) {
        checkExistingRequest(storedPhone);
      }
    } catch (error) {
      console.error('Error checking initial phone:', error);
    }
  };

  const checkExistingRequest = async (phone) => {
    try {
      const { data, error } = await supabase
        .from('vendor_requests')
        .select('*')
        .eq('phone', phone)
        .eq('status', 'pending')
        .maybeSingle();

      if (data && !error) {
        setPendingRequest(data);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'تنبيه',
        'نحتاج إلى إذن الوصول إلى الصور لتحميل المستندات'
      );
    }
  };

  const fetchData = async () => {
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
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    }
  };

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri, result.assets[0].base64, type);
    }
  };

  const uploadImage = async (uri, base64Data, type) => {
    setUploading((prev) => ({ ...prev, [type]: true }));
    setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

    try {
      // Upload to R2 via API with progress tracking
      const result = await uploadImageToR2(
        uri,
        type,
        uploadToken || undefined,
        (progress) => {
          setUploadProgress((prev) => ({ ...prev, [type]: progress }));
        }
      );

      const publicUrl = result.url;

      const fieldMap = {
        nni: 'nni_image_url',
        personal: 'personal_image_url',
        store: 'store_image_url',
        payment: 'payment_screenshot_url',
      };

      setFormData((prev) => ({ ...prev, [fieldMap[type]]: publicUrl }));

      console.log(`Uploaded ${type} to R2:`, publicUrl);
      console.log(`Remaining uploads: ${result.remaining_uploads}`);
      Alert.alert('نجح', 'تم تحميل الصورة بنجاح!');

      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('خطأ', `فشل تحميل الصورة: ${error.message}`);
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const validatePassword = (password) => {
    const hasNumbers = /\d/.test(password);
    const hasLetters = /[a-zA-Z]/.test(password);
    const minLength = password.length >= 8;

    if (!minLength) {
      setPasswordError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return false;
    }
    if (!hasNumbers) {
      setPasswordError('كلمة المرور يجب أن تحتوي على أرقام');
      return false;
    }
    if (!hasLetters) {
      setPasswordError('كلمة المرور يجب أن تحتوي على حروف');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handlePhoneBlur = async () => {
    if (formData.phoneDigits && formData.phoneDigits.length === 8) {
      const fullPhone = `+222${formData.phoneDigits}`;
      await SecureTokenManager.saveItem('vendor_registration_phone', fullPhone);

      setFormData(prev => ({ ...prev, phone: fullPhone }));

      const { data, error } = await supabase
        .from('vendor_requests')
        .select('*')
        .eq('phone', fullPhone)
        .eq('status', 'pending')
        .maybeSingle();

      if (data && !error) {
        setPendingRequest(data);
        Alert.alert('تنبيه', 'لديك بالفعل طلب تسجيل قيد الانتظار!');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.phoneDigits || formData.phoneDigits.length !== 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح (8 أرقام)');
      return;
    }

    if (!formData.whatsappDigits || formData.whatsappDigits.length !== 8) {
      Alert.alert('خطأ', 'يرجى إدخال رقم واتساب صحيح (8 أرقام)');
      return;
    }

    if (
      !formData.nni_image_url ||
      !formData.personal_image_url ||
      !formData.store_image_url ||
      !formData.payment_screenshot_url
    ) {
      Alert.alert('خطأ', 'يرجى تحميل جميع الصور المطلوبة');
      return;
    }

    if (!formData.password || !validatePassword(formData.password)) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة مرور صحيحة');
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

      const selectedPlan = PRICING_PLANS.find((p) => p.id === formData.package_plan);
      const cleanPhone = fullPhone.replace(/[\s+\-()]/g, '');
      const generatedEmail = `${cleanPhone}@rimmarsa.com`;

      const { error } = await supabase.from('vendor_requests').insert([
        {
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
          status: 'pending',
        },
      ]);

      if (error) throw error;

      await SecureTokenManager.saveItem('vendor_registration_phone', fullPhone);
      setSuccess(true);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('خطأ', 'فشل في إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = (newStep) => {
    setStep(newStep);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Loading/pending/success screens
  if (pendingRequest) {
    return (
      <LinearGradient
        colors={['#111827', '#1F2937', '#000000']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Animatable.View animation="zoomIn" style={styles.statusCard}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="access-time" size={64} color="#10B981" />
            </View>

            <Text style={styles.statusTitle}>الطلب قيد الانتظار</Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Ionicons name="alert-circle-outline" size={20} color="#10B981" />
                <Text style={styles.infoText}>لديك بالفعل طلب تسجيل قيد الانتظار.</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsContainer}>
                <Text style={styles.detailLabel}>العمل: <Text style={styles.detailValue}>{pendingRequest.business_name}</Text></Text>
                <Text style={styles.detailLabel}>الهاتف: <Text style={styles.detailValue}>{pendingRequest.phone}</Text></Text>
                {pendingRequest.whatsapp_number && (
                  <Text style={styles.detailLabel}>الواتساب: <Text style={styles.detailValue}>{pendingRequest.whatsapp_number}</Text></Text>
                )}
                <Text style={styles.detailLabel}>الخطة: <Text style={styles.detailValue}>{PRICING_PLANS.find(p => p.id === pendingRequest.package_plan)?.name} - {pendingRequest.package_price} أوقية</Text></Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>الحالة: قيد الانتظار</Text>
              </View>
            </View>

            <Text style={styles.pendingMessage}>
              فريق الإدارة لدينا يراجع طلبك. ستتلقى إشعاراً بمجرد الموافقة على طلبك.
            </Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={async () => {
                setPendingRequest(null);
                await SecureTokenManager.removeItem('vendor_registration_phone');
              }}
            >
              <Text style={styles.secondaryButtonText}>التسجيل برقم هاتف مختلف</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Feather name="arrow-left" size={20} color="white" />
                <Text style={styles.primaryButtonText}>العودة إلى الصفحة الرئيسية</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (success) {
    return (
      <LinearGradient
        colors={['#111827', '#1F2937', '#000000']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Animatable.View animation="bounceIn" style={styles.statusCard}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>

            <Text style={[styles.statusTitle, { color: '#10B981' }]}>تم إرسال الطلب!</Text>

            <Text style={styles.successMessage}>
              شكراً لتقديم طلبك للانضمام إلى ريمارسا! لقد استلمنا طلبك وسنقوم بمراجعته قريباً.
            </Text>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>تفاصيل الطلب:</Text>
              <Text style={styles.successDetailValue}>{formData.business_name}</Text>
              <Text style={styles.successDetailPhone}>+222{formData.phoneDigits}</Text>
              <Text style={styles.successDetailPlan}>
                {PRICING_PLANS.find(p => p.id === formData.package_plan)?.name} - {PRICING_PLANS.find(p => p.id === formData.package_plan)?.price} أوقية
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.goBack()}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Feather name="arrow-left" size={20} color="white" />
                <Text style={styles.primaryButtonText}>العودة إلى الصفحة الرئيسية</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Main registration form
  return (
    <LinearGradient
      colors={['#111827', '#1F2937', '#000000']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" style={styles.header}>
          <Text style={styles.headerTitle}>كن بائعاً</Text>
          <Text style={styles.headerSubtitle}>انضم إلى منصة السوق الرائدة في موريتانيا</Text>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={16} color="#10B981" />
            <Text style={styles.backLinkText}>العودة إلى الصفحة الرئيسية</Text>
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
                <Text style={styles.inputLabel}>اسم العمل *</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="store-outline" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
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
                <Text style={styles.inputLabel}>اسم المالك *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
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
                <Text style={styles.inputLabel}>رقم الهاتف *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#6B7280" />
                  <Text style={styles.phonePrefix}>+222</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="XXXXXXXX"
                    placeholderTextColor="#6B7280"
                    keyboardType="phone-pad"
                    maxLength={8}
                    value={formData.phoneDigits}
                    onChangeText={(text) => {
                      const value = text.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, phoneDigits: value });
                    }}
                    onBlur={handlePhoneBlur}
                  />
                </View>
                <Text style={styles.helperText}>أدخل 8 أرقام فقط</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كلمة المرور *</Text>
                <View style={[styles.inputContainer, passwordError && styles.inputError]}>
                  <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="يجب أن تحتوي على أرقام وحروف"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (text) {
                        validatePassword(text);
                      } else {
                        setPasswordError('');
                      }
                    }}
                  />
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>
                    <MaterialIcons name="error-outline" size={12} color="#EF4444" /> {passwordError}
                  </Text>
                ) : null}
                <Text style={styles.helperText}>مثال: 23343534Aa (8 أحرف على الأقل، أرقام وحروف)</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم الواتساب *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="logo-whatsapp" size={20} color="#6B7280" />
                  <Text style={styles.phonePrefix}>+222</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
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
                <Text style={styles.helperText}>مطلوب للتواصل معك عند الموافقة على الطلب</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رمز الإحالة (اختياري)</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="star-outline" size={20} color="#10B981" />
                  <TextInput
                    style={styles.input}
                    placeholder="أدخل رمز الإحالة من بائع آخر"
                    placeholderTextColor="#6B7280"
                    value={formData.referral_code}
                    onChangeText={(text) =>
                      setFormData({ ...formData, referral_code: text.toUpperCase() })
                    }
                    maxLength={20}
                  />
                </View>
                <Text style={styles.helperText}>إذا كان لديك رمز إحالة، أدخله هنا للحصول على مزايا إضافية</Text>
              </View>

              <TouchableOpacity style={styles.nextButton} onPress={() => goToStep(2)}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.nextButtonText}>التالي: الموقع</Text>
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
                <Text style={styles.inputLabel}>المنطقة</Text>
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
                  <Text style={styles.inputLabel}>المدينة</Text>
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
                <Text style={styles.inputLabel}>العنوان</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="home-outline" size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
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
                <TouchableOpacity style={[styles.backBtn, { flex: 1 }]} onPress={() => goToStep(1)}>
                  <Text style={styles.backBtnText}>السابق</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextButton, { flex: 1 }]} onPress={() => goToStep(3)}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.nextButtonText}>التالي: المستندات</Text>
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
                <TouchableOpacity style={[styles.backBtn, { flex: 1 }]} onPress={() => goToStep(2)}>
                  <Text style={styles.backBtnText}>السابق</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextButton, { flex: 1, opacity: (!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url) ? 0.5 : 1 }]}
                  onPress={() => goToStep(4)}
                  disabled={!formData.nni_image_url || !formData.personal_image_url || !formData.store_image_url}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.nextButtonText}>التالي: الدفع</Text>
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
                      styles.planCard,
                      formData.package_plan === plan.id && styles.planCardSelected,
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
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>{plan.price} أوقية</Text>
                    <Text style={styles.planDuration}>{plan.duration}</Text>
                    <View style={styles.planFeatures}>
                      {plan.features.map((feature, i) => (
                        <View key={i} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {renderImageUpload('payment', 'لقطة شاشة الدفع *', 'receipt-outline')}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.backBtn, { flex: 1 }]} onPress={() => goToStep(3)}>
                  <Text style={styles.backBtnText}>السابق</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { flex: 1, opacity: (!formData.payment_screenshot_url || loading) ? 0.5 : 1 }]}
                  onPress={handleSubmit}
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
                        <Text style={styles.submitButtonText}>جاري الإرسال...</Text>
                      </>
                    ) : (
                      <Text style={styles.submitButtonText}>إرسال الطلب</Text>
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

  function renderImageUpload(type, label, iconName) {
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
          <View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => pickImage(type)}
              disabled={uploading[type]}
            >
              <Feather name="upload-cloud" size={40} color="#6B7280" />
              <Text style={styles.uploadButtonText}>
                {uploading[type]
                  ? `جاري التحميل... ${uploadProgress[type]}%`
                  : 'انقر للتحميل'}
              </Text>
            </TouchableOpacity>
            {uploading[type] && (
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBar, { width: `${uploadProgress[type]}%` }]}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#10B981',
  },
  stepNumber: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 48,
    height: 4,
    backgroundColor: '#374151',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    textAlign: 'right',
  },
  phonePrefix: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    textAlign: 'right',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  uploadGroup: {
    marginBottom: 24,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  uploadButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
  },
  uploadedContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  removeButtonText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#374151',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.125)',
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backBtn: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  backBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 16,
  },
  detailsContainer: {
    gap: 8,
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
  },
  statusBadgeText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pendingMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  successDetails: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  successDetailLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 8,
  },
  successDetailValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successDetailPhone: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  successDetailPlan: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
});
