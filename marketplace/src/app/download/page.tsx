'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface AppVersion {
  version: string;
  buildNumber: number;
  downloadUrl: string;
  fileSize: number;
  releasedAt: string;
  releaseNotes: {
    ar: string[];
    en: string[];
  };
}

export default function DownloadPage() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect if user is on Android
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsAndroid(/android/i.test(userAgent));

    // Fetch latest version info from API
    fetch('/api/app-version?app=vendor')
      .then(res => res.json())
      .then(data => {
        setVersionInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch version info:', err);
        setLoading(false);
      });
  }, []);

  const appVersion = versionInfo?.version || "1.3.0";
  const releaseDate = versionInfo?.releasedAt
    ? new Date(versionInfo.releasedAt).toLocaleDateString('ar-SA')
    : "2025-10-26";
  const apkUrl = "/api/download/vendor-app";
  const apkSize = versionInfo?.fileSize
    ? `~${Math.round(versionInfo.fileSize / (1024 * 1024))} MB`
    : "~60 MB";
  const apkChecksum = ""; // Will be generated after build

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" dir="rtl">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-yellow-400">
              ريمارسا
            </Link>
            <Link
              href="/"
              className="text-gray-300 hover:text-yellow-400 transition-colors"
            >
              ← العودة للرئيسية
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-400 rounded-3xl mb-6">
              <DevicePhoneMobileIcon className="w-14 h-14 text-gray-900" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              تطبيق ريمارسا للبائعين
            </h1>
            <p className="text-xl text-gray-300">
              إدارة متجرك من هاتفك في أي وقت وأي مكان
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="px-4 py-2 bg-gray-800 rounded-full text-gray-300 text-sm">
                الإصدار {appVersion}
              </span>
              <span className="px-4 py-2 bg-gray-800 rounded-full text-gray-300 text-sm">
                {releaseDate}
              </span>
            </div>
          </div>

          {/* Download Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">تحميل التطبيق</h2>
              <ShieldCheckIcon className="w-8 h-8 text-green-400" />
            </div>

            {/* Download Button */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <a
                href={apkUrl}
                download
                className="w-full max-w-md bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
              >
                <ArrowDownTrayIcon className="w-6 h-6" />
                <span>تحميل التطبيق ({apkSize})</span>
              </a>

              {isAndroid && (
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <CheckBadgeIcon className="w-5 h-5" />
                  تم الكشف عن جهاز أندرويد
                </p>
              )}

              {!isAndroid && (
                <p className="text-yellow-400 text-sm">
                  ⚠️ هذا التطبيق متاح فقط لأجهزة أندرويد
                </p>
              )}
            </div>

            {/* File Info */}
            <div className="bg-gray-900/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">اسم الملف:</span>
                <span className="text-white font-mono">rimmarsa-vendor-{appVersion}.apk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الحجم:</span>
                <span className="text-white">{apkSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">نوع الملف:</span>
                <span className="text-white">Android APK</span>
              </div>
              {apkChecksum && (
                <div className="flex flex-col gap-1 pt-2 border-t border-gray-700">
                  <span className="text-gray-400">SHA-256:</span>
                  <span className="text-white font-mono text-xs break-all">
                    {apkChecksum}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">خطوات التثبيت</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">تفعيل "مصادر غير معروفة"</h3>
                  <p className="text-gray-300">
                    افتح الإعدادات ← الأمان ← فعّل "السماح بالتثبيت من مصادر غير معروفة"
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">تحميل التطبيق</h3>
                  <p className="text-gray-300">
                    انقر على زر "تحميل التطبيق" أعلاه وانتظر حتى يكتمل التحميل
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">تثبيت التطبيق</h3>
                  <p className="text-gray-300">
                    افتح الملف المحمّل وانقر على "تثبيت" - قد تحتاج لتأكيد التثبيت
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">تسجيل الدخول</h3>
                  <p className="text-gray-300">
                    افتح التطبيق وسجّل الدخول باستخدام رقم هاتفك وكلمة المرور
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 border border-blue-700 rounded-2xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <LockClosedIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-white mb-3">أمان التطبيق</h2>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>التطبيق موقّع رقمياً من ريمارسا</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>جميع البيانات مشفرة ومحمية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>لا نطلب أي أذونات غير ضرورية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>التحقق الثنائي متاح لحماية حسابك</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">مميزات التطبيق</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">التسجيل كبائع</h3>
                  <p className="text-gray-400 text-sm">
                    تسجيل جديد مع رفع المستندات والاختيار بين الباقات
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">إدارة المنتجات</h3>
                  <p className="text-gray-400 text-sm">
                    إضافة وتعديل وحذف المنتجات بسهولة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">متابعة الطلبات</h3>
                  <p className="text-gray-400 text-sm">
                    تتبع جميع الطلبات في الوقت الفعلي
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">تقارير وإحصائيات</h3>
                  <p className="text-gray-400 text-sm">
                    رؤية شاملة لأداء متجرك ومبيعاتك
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">إشعارات فورية</h3>
                  <p className="text-gray-400 text-sm">
                    تنبيهات للطلبات والرسائل الجديدة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">إدارة المخزون</h3>
                  <p className="text-gray-400 text-sm">
                    تتبع الكميات المتوفرة وإدارة المخزون
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-white font-semibold mb-1">دعم ثنائي اللغة</h3>
                  <p className="text-gray-400 text-sm">
                    واجهة باللغتين العربية والفرنسية
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Requirements */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">متطلبات التشغيل</h2>

            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between">
                <span>نظام التشغيل:</span>
                <span className="text-white font-semibold">Android 8.0 أو أحدث</span>
              </div>
              <div className="flex justify-between">
                <span>مساحة التخزين:</span>
                <span className="text-white font-semibold">100 MB على الأقل</span>
              </div>
              <div className="flex justify-between">
                <span>الذاكرة العشوائية:</span>
                <span className="text-white font-semibold">2 GB RAM أو أكثر</span>
              </div>
              <div className="flex justify-between">
                <span>الاتصال بالإنترنت:</span>
                <span className="text-white font-semibold">مطلوب</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">
              هل تحتاج إلى مساعدة في التثبيت؟
            </p>
            <Link
              href="https://wa.me/22237892800"
              target="_blank"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              تواصل معنا عبر واتساب
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© 2025 ريمارسا - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
