import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import SecureTokenManager from '../services/secureStorage';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

export default function VendorRegistrationScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    phone: '',
    password: '',
    whatsapp_number: '',
    region_id: '',
    city_id: '',
    address: '',
    package_plan: '2_months',
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
    },
  ];

  useEffect(() => {
    fetchData();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (formData.region_id) {
      const filtered = cities.filter(
        (city) => city.region_id === formData.region_id
      );
      setFilteredCities(filtered);
    }
  }, [formData.region_id, cities]);

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

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[type];
        if (current < 90) {
          return { ...prev, [type]: current + 10 };
        }
        return prev;
      });
    }, 200);

    try {
      const fileName = `${Date.now()}-${type}.jpg`;
      const filePath = `vendor-requests/${type}/${fileName}`;

      // Convert base64 to ArrayBuffer using native atob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, byteArray.buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('images').getPublicUrl(filePath);

      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [type]: 100 }));

      const fieldMap = {
        nni: 'nni_image_url',
        personal: 'personal_image_url',
        store: 'store_image_url',
        payment: 'payment_screenshot_url',
      };

      setFormData((prev) => ({ ...prev, [fieldMap[type]]: publicUrl }));

      Alert.alert('نجح', 'تم تحميل الصورة بنجاح');

      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      Alert.alert('خطأ', `فشل تحميل الصورة: ${error.message}`);
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const validatePassword = (password) => {
    // Password must contain both numbers and letters (like 23343534Aa)
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

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.nni_image_url ||
      !formData.personal_image_url ||
      !formData.store_image_url ||
      !formData.payment_screenshot_url
    ) {
      Alert.alert('خطأ', 'يرجى تحميل جميع الصور المطلوبة');
      return;
    }

    // Validate password
    if (!formData.password || !validatePassword(formData.password)) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة مرور صحيحة (يجب أن تحتوي على أرقام وحروف)');
      return;
    }

    setLoading(true);

    try {
      const selectedPlan = PRICING_PLANS.find((p) => p.id === formData.package_plan);

      // Generate email from phone: remove +, spaces, -, () and add @rimmarsa.com
      const cleanPhone = formData.phone.replace(/[\s+\-()]/g, '');
      const generatedEmail = `${cleanPhone}@rimmarsa.com`;

      const { error } = await supabase.from('vendor_requests').insert([
        {
          business_name: formData.business_name,
          owner_name: formData.owner_name,
          email: generatedEmail,
          phone: formData.phone,
          password: formData.password,
          whatsapp_number: formData.whatsapp_number || null,
          region_id: formData.region_id || null,
          city_id: formData.city_id || null,
          address: formData.address || null,
          package_plan: formData.package_plan,
          package_price: selectedPlan?.price || 0,
          nni_image_url: formData.nni_image_url,
          personal_image_url: formData.personal_image_url,
          store_image_url: formData.store_image_url,
          payment_screenshot_url: formData.payment_screenshot_url,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      await SecureTokenManager.saveItem('vendor_registration_phone', formData.phone);

      Alert.alert(
        'نجح',
        'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
        [
          {
            text: 'حسناً',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={styles.stepContainer}>
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
          {s < 4 && (
            <View
              style={[
                styles.stepLine,
                step > s && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderImageUpload = (type, label) => (
    <View style={styles.uploadContainer}>
      <Text style={styles.uploadLabel}>{label}</Text>
      {formData[`${type}_image_url`] ? (
        <View>
          <Image
            source={{ uri: formData[`${type}_image_url`] }}
            style={styles.uploadedImage}
          />
          <Button
            mode="outlined"
            style={styles.removeButton}
            onPress={() =>
              setFormData((prev) => ({ ...prev, [`${type}_image_url`]: '' }))
            }
          >
            إزالة
          </Button>
        </View>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage(type)}
            disabled={uploading[type]}
          >
            <Text style={styles.uploadButtonText}>
              {uploading[type]
                ? `جاري التحميل... ${uploadProgress[type]}%`
                : 'انقر للتحميل'}
            </Text>
          </TouchableOpacity>
          {uploading[type] && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${uploadProgress[type]}%` },
                ]}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {renderStepIndicator()}

      <View style={styles.formContainer}>
        {/* Step 1: Business Information */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>معلومات العمل</Text>

            <TextInput
              style={styles.input}
              placeholder="اسم العمل *"
              placeholderTextColor="#9CA3AF"
              value={formData.business_name}
              onChangeText={(text) =>
                setFormData({ ...formData, business_name: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="اسم المالك *"
              placeholderTextColor="#9CA3AF"
              value={formData.owner_name}
              onChangeText={(text) =>
                setFormData({ ...formData, owner_name: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="رقم الهاتف *"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) =>
                setFormData({ ...formData, phone: text })
              }
            />

            <TextInput
              style={[
                styles.input,
                passwordError ? styles.inputError : null,
              ]}
              placeholder="كلمة المرور * (يجب أن تحتوي على أرقام وحروف)"
              placeholderTextColor="#9CA3AF"
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
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            <Text style={styles.helperText}>
              مثال: 23343534Aa (8 أحرف على الأقل، أرقام وحروف)
            </Text>

            <TextInput
              style={styles.input}
              placeholder="رقم الواتساب (اختياري)"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={formData.whatsapp_number}
              onChangeText={(text) =>
                setFormData({ ...formData, whatsapp_number: text })
              }
            />

            <Button
              mode="contained"
              style={styles.nextButton}
              onPress={() => setStep(2)}
            >
              التالي: الموقع
            </Button>
          </View>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>الموقع</Text>

            <Text style={styles.label}>المنطقة</Text>
            <View style={styles.pickerContainer}>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={[
                    styles.pickerOption,
                    formData.region_id === region.id && styles.pickerOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, region_id: region.id, city_id: '' })
                  }
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.region_id === region.id && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {region.name_ar || region.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.region_id && (
              <>
                <Text style={styles.label}>المدينة</Text>
                <View style={styles.pickerContainer}>
                  {filteredCities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        styles.pickerOption,
                        formData.city_id === city.id && styles.pickerOptionSelected,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, city_id: city.id })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.city_id === city.id && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {city.name_ar || city.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="العنوان"
              placeholderTextColor="#9CA3AF"
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
            />

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                السابق
              </Button>
              <Button
                mode="contained"
                style={styles.nextButton}
                onPress={() => setStep(3)}
              >
                التالي: المستندات
              </Button>
            </View>
          </View>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>تحميل المستندات</Text>

            {renderImageUpload('nni', 'البطاقة الوطنية (NNI) *')}
            {renderImageUpload('personal', 'الصورة الشخصية *')}
            {renderImageUpload('store', 'صورة المتجر *')}

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                style={styles.backButton}
                onPress={() => setStep(2)}
              >
                السابق
              </Button>
              <Button
                mode="contained"
                style={styles.nextButton}
                onPress={() => setStep(4)}
                disabled={
                  !formData.nni_image_url ||
                  !formData.personal_image_url ||
                  !formData.store_image_url
                }
              >
                التالي: الدفع
              </Button>
            </View>
          </View>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>اختيار الخطة والدفع</Text>

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
              </TouchableOpacity>
            ))}

            {renderImageUpload('payment', 'لقطة شاشة الدفع *')}

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                style={styles.backButton}
                onPress={() => setStep(3)}
              >
                السابق
              </Button>
              <Button
                mode="contained"
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading || !formData.payment_screenshot_url}
                loading={loading}
              >
                {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </Button>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
    backgroundColor: colors.gray[800],
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary[500],
  },
  stepNumber: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: colors.text.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray[700],
  },
  stepLineActive: {
    backgroundColor: colors.primary[500],
  },
  formContainer: {
    padding: spacing[5],
  },
  stepTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary[400],
    marginBottom: spacing[5],
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    color: colors.text.primary,
    fontSize: fontSize.base,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    textAlign: 'right',
  },
  inputError: {
    borderColor: colors.error[500],
  },
  errorText: {
    color: colors.error[500],
    fontSize: fontSize.xs,
    marginTop: -spacing[2],
    marginBottom: spacing[2],
    textAlign: 'right',
  },
  helperText: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
    marginTop: -spacing[2],
    marginBottom: spacing[3],
    textAlign: 'right',
  },
  label: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    marginBottom: spacing[2],
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  pickerOption: {
    backgroundColor: colors.gray[800],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pickerOptionText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
  },
  pickerOptionTextSelected: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  uploadContainer: {
    marginBottom: spacing[5],
  },
  uploadLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    marginBottom: spacing[2],
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: 40,
    borderWidth: 2,
    borderColor: colors.gray[700],
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  removeButton: {
    borderColor: colors.error[500],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.sm,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  planCard: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.gray[700],
  },
  planCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(16, 185, 129, 0.125)',
  },
  savingsBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.lg,
  },
  savingsText: {
    color: colors.text.primary,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
  planName: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing[2],
  },
  planPrice: {
    color: colors.primary[400],
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing[1],
  },
  planDuration: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[5],
  },
  backButton: {
    flex: 1,
    borderColor: colors.gray[500],
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.success[500],
  },
});
