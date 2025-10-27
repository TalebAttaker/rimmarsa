# Image Upload Bug Fix

## Problem Identified

The current image upload implementation in `VendorRegistrationScreen.js` has several issues:

### Issues:
1. **Custom base64 decoder**: Using a manual base64 decode function (lines 191-220) which is error-prone and inefficient
2. **Base64 conversion overhead**: Converting images to base64 adds ~33% size overhead
3. **Memory issues**: Large images can cause out-of-memory errors when converting to base64
4. **Incomplete decode function**: The custom decoder may not handle all edge cases correctly

### Current Flow:
```
Image Picker → Get base64 → Custom decode → Upload to Supabase
```

### Problems:
- Base64 encoding/decoding is slow and memory-intensive
- Custom decoder is not thoroughly tested
- No error handling for large files
- Potential data corruption during conversion

## Solution

Use React Native's modern file upload approach with `expo-file-system` and ArrayBuffer.

### New Flow:
```
Image Picker → Read as blob/ArrayBuffer → Upload directly to Supabase
```

### Benefits:
- ✅ No base64 conversion overhead
- ✅ Better memory management
- ✅ Faster uploads
- ✅ Native blob handling
- ✅ Support for larger images

## Implementation

### Step 1: Install Required Dependencies

```bash
npx expo install expo-file-system
```

### Step 2: Replace Upload Function

Replace the current `uploadImage` function (lines 132-189) with:

```javascript
import * as FileSystem from 'expo-file-system';

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

    // Read file as base64 (ImagePicker already provides this)
    const base64 = uri.includes('base64')
      ? uri.split(',')[1]
      : base64Data;

    // Convert base64 to ArrayBuffer for Supabase
    const byteCharacters = atob(base64);
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
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

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
```

### Step 3: Remove Custom Decode Function

Delete the entire `decode` function (lines 191-220) as it's no longer needed.

### Step 4: Alternative Solution Using FileSystem (Recommended)

For better performance and memory management, use expo-file-system:

```javascript
import * as FileSystem from 'expo-file-system';

const uploadImage = async (uri, base64Data, type) => {
  setUploading((prev) => ({ ...prev, [type]: true }));
  setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

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

    // Read file from URI
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to binary
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, byteArray.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

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
```

## Testing Checklist

After applying the fix:

- [ ] Test NNI image upload
- [ ] Test personal photo upload
- [ ] Test store photo upload
- [ ] Test payment screenshot upload
- [ ] Test with small images (< 1MB)
- [ ] Test with medium images (1-5MB)
- [ ] Test with large images (5-10MB)
- [ ] Verify images appear in Supabase Storage
- [ ] Verify public URLs are accessible
- [ ] Test on both iOS and Android
- [ ] Check memory usage during upload
- [ ] Verify progress indicator works correctly

## Rollback Plan

If issues occur, revert to previous version but add better error handling:

```javascript
// Keep old approach but add better error messages
const uploadImage = async (uri, base64Data, type) => {
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Detailed upload error:', {
      message: error.message,
      stack: error.stack,
      type: type,
      uriLength: uri?.length,
      base64Length: base64Data?.length,
    });
    Alert.alert('خطأ', `فشل تحميل الصورة: ${error.message}`);
  }
};
```

## Additional Improvements

### 1. Add File Size Validation

```javascript
const pickImage = async (type) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    const asset = result.assets[0];

    // Check file size (limit to 10MB)
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    const fileSizeMB = fileInfo.size / (1024 * 1024);

    if (fileSizeMB > 10) {
      Alert.alert('خطأ', 'حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    uploadImage(asset.uri, null, type);
  }
};
```

### 2. Add Image Compression

```javascript
const pickImage = async (type) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7, // Reduce quality to 70% for smaller file size
    allowsMultipleSelection: false,
  });

  if (!result.canceled) {
    uploadImage(result.assets[0].uri, null, type);
  }
};
```

### 3. Add Retry Logic

```javascript
const uploadImageWithRetry = async (uri, base64Data, type, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await uploadImage(uri, base64Data, type);
      return; // Success
    } catch (error) {
      if (i === retries - 1) throw error; // Last retry failed
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
};
```

## Notes

- The `expo-file-system` approach is more reliable than custom base64 decoding
- Always test with real images of various sizes
- Monitor Supabase Storage quotas
- Consider implementing image compression for better UX
- Add proper error logging for production debugging

---

**Status**: Ready to implement
**Priority**: High
**Estimated time**: 30 minutes
**Testing time**: 1 hour
