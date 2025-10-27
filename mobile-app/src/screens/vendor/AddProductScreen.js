import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import SecureTokenManager from '../../services/secureStorage';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { uploadMultipleImagesToR2 } from '../../services/r2Upload';

const MAX_IMAGES = 6;

export default function AddProductScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [vendorId, setVendorId] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    region_id: '',
    city_id: '',
    stock_quantity: '0',
    is_active: true,
  });

  // Categories, Regions, Cities
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  // Images
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadVendorAndData();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (formData.region_id) {
      const filtered = cities.filter((city) => city.region_id === formData.region_id);
      setFilteredCities(filtered);
      setFormData((prev) => ({ ...prev, city_id: '' }));
    } else {
      setFilteredCities([]);
    }
  }, [formData.region_id, cities]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى الصور');
      }
    }
  };

  const loadVendorAndData = async () => {
    try {
      const vendorData = await SecureTokenManager.getItem('vendor');
      if (!vendorData) {
        navigation.replace('VendorLogin');
        return;
      }

      const vendor = JSON.parse(vendorData);
      setVendorId(vendor.id);

      // Fetch form data
      const [categoriesRes, regionsRes, citiesRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('order'),
        supabase.from('regions').select('*').eq('is_active', true).order('name'),
        supabase.from('cities').select('*').eq('is_active', true).order('name'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (regionsRes.data) setRegions(regionsRes.data);
      if (citiesRes.data) setCities(citiesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('تنبيه', `يمكنك إضافة ${MAX_IMAGES} صور كحد أقصى`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (!result.canceled) {
        const newImages = result.assets || [result];
        const remainingSlots = MAX_IMAGES - images.length;
        const imagesToAdd = newImages.slice(0, remainingSlots);

        if (newImages.length > remainingSlots) {
          Alert.alert('تنبيه', `تم إضافة ${remainingSlots} صور فقط (الحد الأقصى ${MAX_IMAGES})`);
        }

        setImages([...images, ...imagesToAdd]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (images.length === 0) return [];

    setUploadingImages(true);

    try {
      // Upload all images to R2 via API with progress tracking
      const uploadedUrls = await uploadMultipleImagesToR2(
        images,
        'product',
        (current, total, percentage) => {
          console.log(`Uploading image ${current}/${total} (${percentage}%)`);
        }
      );

      console.log(`Successfully uploaded ${uploadedUrls.length} images to R2`);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('فشل في رفع الصور');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!vendorId) return;

    if (!formData.name || !formData.price || !formData.category_id) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (images.length === 0) {
      Alert.alert('خطأ', 'الرجاء إضافة صورة واحدة على الأقل');
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      // Create product
      const { error } = await supabase.from('products').insert([
        {
          vendor_id: vendorId,
          name: formData.name,
          name_ar: formData.name_ar || formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price
            ? parseFloat(formData.compare_at_price)
            : null,
          category_id: formData.category_id,
          region_id: formData.region_id || null,
          city_id: formData.city_id || null,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          is_active: formData.is_active,
          images: imageUrls,
        },
      ]);

      if (error) throw error;

      Alert.alert('نجاح', 'تم إضافة المنتج بنجاح!', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('خطأ', error.message || 'فشل في إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          صور المنتج (حتى {MAX_IMAGES} صور)
        </Text>
        <View style={styles.imagesGrid}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
              <View style={styles.imageNumber}>
                <Text style={styles.imageNumberText}>{index + 1}</Text>
              </View>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Icon name="camera-plus" size={32} color="#9CA3AF" />
              <Text style={styles.addImageText}>إضافة صورة</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.helperText}>
          • الصورة الأولى ستكون الصورة الرئيسية
          {'\n'}• الحد الأقصى: {MAX_IMAGES} صور
        </Text>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>

        <Text style={styles.label}>
          اسم المنتج <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: هاتف ذكي"
          placeholderTextColor="#9CA3AF"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          textAlign="right"
        />

        <Text style={styles.label}>الاسم بالعربية</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: هاتف ذكي"
          placeholderTextColor="#9CA3AF"
          value={formData.name_ar}
          onChangeText={(text) => setFormData({ ...formData, name_ar: text })}
          textAlign="right"
        />

        <Text style={styles.label}>الوصف</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="وصف تفصيلي للمنتج..."
          placeholderTextColor="#9CA3AF"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
          textAlign="right"
        />

        <Text style={styles.label}>
          السعر (أوقية) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="decimal-pad"
          textAlign="right"
        />

        <Text style={styles.label}>السعر قبل الخصم (اختياري)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#9CA3AF"
          value={formData.compare_at_price}
          onChangeText={(text) =>
            setFormData({ ...formData, compare_at_price: text })
          }
          keyboardType="decimal-pad"
          textAlign="right"
        />

        <Text style={styles.label}>
          الفئة <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  formData.category_id === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setFormData({ ...formData, category_id: cat.id })}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    formData.category_id === cat.id &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name_ar}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.label}>الكمية المتوفرة</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          value={formData.stock_quantity}
          onChangeText={(text) =>
            setFormData({ ...formData, stock_quantity: text })
          }
          keyboardType="number-pad"
          textAlign="right"
        />
      </View>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>إلغاء</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, (loading || uploadingImages) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingImages}
        >
          {loading || uploadingImages ? (
            <>
              <ActivityIndicator color="#000" size="small" />
              <Text style={styles.submitButtonText}>
                {uploadingImages ? 'جاري رفع الصور...' : 'جاري الحفظ...'}
              </Text>
            </>
          ) : (
            <>
              <Icon name="content-save" size={20} color="#000" />
              <Text style={styles.submitButtonText}>حفظ المنتج</Text>
            </>
          )}
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
  },
  addImageText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    marginLeft: 8,
  },
  categoryChipActive: {
    backgroundColor: '#EAB308',
    borderColor: '#EAB308',
  },
  categoryChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
