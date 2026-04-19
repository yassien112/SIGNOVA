import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'signova_lang';

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard', chat: 'Chat', aiCamera: 'AI Camera',
    profile: 'Profile', logout: 'Logout', login: 'Login', register: 'Register',
    chats: 'Chats', newChat: 'New Chat', searchChats: 'Search chats...',
    typeMessage: 'Type a message...', send: 'Send',
    noMessages: 'No messages yet. Say hello!', noChats: 'No chats yet.',
    loading: 'Loading...', startPrivateChat: 'Start private chat',
    enterEmail: 'Enter user email', start: 'Start',
    voiceToText: 'Voice to Text', voiceToSign: 'Voice to Sign', language: 'Language',
    welcomeBack: 'Welcome back', refresh: 'Refresh',
    recentMessages: 'Recent Messages', recentChats: 'Recent Chats',
    noMessagesYet: 'No messages yet.', noChatsYet: 'No chats yet.',
    totalChats: 'Total Chats', totalMessages: 'Total Messages',
    onlineUsers: 'Online Users', myMessages: 'My Messages',
    myProfile: 'My Profile', manageAccount: 'Manage your account information and preferences.',
    editProfile: 'Edit Profile', fullName: 'Full Name', avatarUrl: 'Avatar URL',
    bio: 'Bio', preferredLanguage: 'Preferred Language',
    saveChanges: 'Save Changes', saving: 'Saving...', memberSince: 'Member since',
    aiTranslator: 'AI Sign Language Translator',
    aiSubtitle: 'Low-latency sign recognition with backend sentence smoothing',
    startRecognition: 'Start Recognition', loadingModel: 'Loading Model...',
    detectedTranslation: 'Detected Translation:', waitingForSigns: 'Waiting for signs...',
    clear: 'Clear', sendToChat: 'Send to Chat', stopCamera: 'Stop Camera',
    realtimeOnline: 'Realtime backend online', realtimeOffline: 'Realtime backend offline',
    global: 'Global', private: 'Private', group: 'Group',
    online: 'Online', offline: 'Offline', today: 'Today', yesterday: 'Yesterday',
    signMessage: 'Sign message', skipped: 'Skipped', english: 'English', arabic: 'Arabic',
  },
  ar: {
    dashboard: 'لوحة التحكم', chat: 'المحادثة', aiCamera: 'كاميرا الذكاء',
    profile: 'الملف الشخصي', logout: 'تسجيل خروج', login: 'تسجيل دخول', register: 'إنشاء حساب',
    chats: 'المحادثات', newChat: 'محادثة جديدة', searchChats: 'بحث في المحادثات...',
    typeMessage: 'اكتب رسالة...', send: 'إرسال',
    noMessages: 'لا توجد رسائل بعد. قل مرحبا!', noChats: 'لا توجد محادثات بعد.',
    loading: 'جاري التحميل...', startPrivateChat: 'بدء محادثة خاصة',
    enterEmail: 'أدخل بريد المستخدم', start: 'ابدأ',
    voiceToText: 'صوت إلى نص', voiceToSign: 'صوت إلى إشارة', language: 'اللغة',
    welcomeBack: 'مرحباً بعودتك', refresh: 'تحديث',
    recentMessages: 'آخر الرسائل', recentChats: 'آخر المحادثات',
    noMessagesYet: 'لا توجد رسائل بعد.', noChatsYet: 'لا توجد محادثات بعد.',
    totalChats: 'إجمالي المحادثات', totalMessages: 'إجمالي الرسائل',
    onlineUsers: 'المستخدمون المتصلون', myMessages: 'رسائلي',
    myProfile: 'ملفي الشخصي', manageAccount: 'إدارة معلومات حسابك وتفضيلاتك.',
    editProfile: 'تعديل الملف الشخصي', fullName: 'الاسم الكامل', avatarUrl: 'رابط الصورة الشخصية',
    bio: 'نبذة تعريفية', preferredLanguage: 'اللغة المفضلة',
    saveChanges: 'حفظ التغييرات', saving: 'جاري الحفظ...', memberSince: 'عضو منذ',
    aiTranslator: 'مترجم لغة الإشارة بالذكاء الاصطناعي',
    aiSubtitle: 'تعرف الإشارات بكمون منخفض مع معالجة ذكية للجمل',
    startRecognition: 'ابدأ التعرف', loadingModel: 'جاري تحميل النموذج...',
    detectedTranslation: 'الترجمة المكتشفة:', waitingForSigns: 'في انتظار الإشارات...',
    clear: 'مسح', sendToChat: 'إرسال للمحادثة', stopCamera: 'إيقاف الكاميرا',
    realtimeOnline: 'الخادم الفوري متصل', realtimeOffline: 'الخادم الفوري غير متصل',
    global: 'عام', private: 'خاص', group: 'مجموعة',
    online: 'متصل', offline: 'غير متصل', today: 'اليوم', yesterday: 'أمس',
    signMessage: 'رسالة إشارة', skipped: 'تم تخطي', english: 'English', arabic: 'عربي',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  /* always default to 'en' — ignore stale localStorage */
  const [lang, setLangState] = useState('en');

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir',  dir);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t    = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
  const isRTL = lang === 'ar';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
