import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

export default function EditProductScreen({ route, navigation }) {
  const { product } = route.params || {};

  React.useEffect(() => {
    if (!product) {
      Alert.alert('خطأ', 'لم يتم العثور على المنتج', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    }
  }, [product, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>تعديل المنتج: {product?.name}</Text>
      <Text style={styles.comingSoon}>قريباً...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoon: {
    color: '#EAB308',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
