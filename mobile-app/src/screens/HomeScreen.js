import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card } from 'react-native-paper';

export default function HomeScreen({ navigation }) {
  const stats = [
    { value: '10K+', label: 'منتج' },
    { value: '5K+', label: 'بائع' },
    { value: '50K+', label: 'طلب' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>اكتشف منتجات رائعة محلية</Text>
        <Text style={styles.heroSubtitle}>
          اشتر مباشرة من البائعين المحليين في موريتانيا.
          احصل على عمولات إحالة حصرية عند البيع.
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            style={styles.primaryButton}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate('Products')}
          >
            تصفح المنتجات
          </Button>

          <Button
            mode="outlined"
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            onPress={() => navigation.navigate('VendorRegistration')}
          >
            كن بائعاً
          </Button>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>لماذا ريمارسا؟</Text>

        <Card style={styles.featureCard}>
          <Card.Content>
            <Text style={styles.featureTitle}>🛍️ تسوق محلي</Text>
            <Text style={styles.featureText}>
              اشتر مباشرة من البائعين المحليين في موريتانيا
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content>
            <Text style={styles.featureTitle}>💰 عمولات الإحالة</Text>
            <Text style={styles.featureText}>
              احصل على عمولة عند إحالة عملاء جدد
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content>
            <Text style={styles.featureTitle}>🚀 سهل الاستخدام</Text>
            <Text style={styles.featureText}>
              واجهة بسيطة وسهلة للبائعين والمشترين
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Become Vendor Section */}
      <View style={styles.becomeVendorSection}>
        <Text style={styles.becomeVendorTitle}>هل أنت بائع؟</Text>
        <Text style={styles.becomeVendorText}>
          انضم إلى منصة ريمارسا وابدأ في بيع منتجاتك اليوم
        </Text>
        <Button
          mode="contained"
          style={styles.becomeVendorButton}
          labelStyle={styles.buttonLabel}
          onPress={() => navigation.navigate('VendorRegistration')}
        >
          سجل الآن
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  heroSection: {
    padding: 24,
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#EAB308',
    borderRadius: 12,
    paddingVertical: 6,
  },
  secondaryButton: {
    borderColor: '#EAB308',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  featuresSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#1E293B',
    marginBottom: 12,
    borderRadius: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  becomeVendorSection: {
    padding: 24,
    backgroundColor: '#1E293B',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  becomeVendorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 12,
  },
  becomeVendorText: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  becomeVendorButton: {
    backgroundColor: '#EAB308',
    borderRadius: 12,
    paddingHorizontal: 32,
  },
});
