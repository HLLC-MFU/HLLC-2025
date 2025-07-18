import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassButton } from '@/components/ui/GlassButton';
import { router } from 'expo-router';
import { Globe, Trash, Info, ShieldCheck, LogOut } from 'lucide-react-native';
import useProfile from '@/hooks/useProfile';
import { apiRequest } from '@/utils/api';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import GlassConfirmModal from '@/components/evoucher/GlassConfirmModal';
import useAuth from '@/hooks/useAuth';

export default function SettingsScreen() {
  const { user } = useProfile();
  const { signOut } = useAuth();

  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'th' : 'en');
  };

  const handleDeleteAccount = async () => {
    const username = user?.data?.[0]?.username;
    if (!username) {
      Alert.alert(t('global.error'), t('profile.username') + ' ' + t('global.error'));
      return;
    }
    try {
      setIsDeleting(true);
      const res = await apiRequest('/auth/delete-account', 'POST', { username });
      if (res && (res.statusCode === 200 || res.statusCode === 201)) {
        Alert.alert(t('global.success'), t('settings.delete'));
        router.replace('/(auth)/login'); // optionally logout
      } else {
        Alert.alert(t('global.error'), res?.message || t('global.error'));
      }
    } catch (err) {
      Alert.alert(t('global.error'), t('global.error'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const [showPolicy, setShowPolicy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Text style={styles.text}>{t('settings.title')}</Text>
        <GlassButton onPress={toggleLanguage}>
          <View style={styles.row}>
            <Globe color="white" size={20} style={styles.icon} />
            <Text style={{ color: 'white' }}>
              {language === 'en' ? t('settings.switch_to_thai') : t('settings.switch_to_english')}
            </Text>
          </View>
        </GlassButton>
        <GlassButton onPress={() => setShowDeleteConfirm(true)}>
          <View style={styles.row}>
            <Trash color="white" size={20} style={styles.icon} />
            <Text style={{ color: 'white' }}>{t('settings.delete')}</Text>
          </View>
        </GlassButton>
        <GlassButton onPress={() => Alert.alert('About', 'HLLC 2025 Student App\nVersion 1.0.0')}>
          <View style={styles.row}>
            <Info color="white" size={20} style={styles.icon} />
            <Text style={{ color: 'white' }}>{t('settings.about')}</Text>
          </View>
        </GlassButton>
        <GlassButton onPress={() => setShowPolicy(true)}>
          <View style={styles.row}>
            <ShieldCheck color="white" size={20} style={styles.icon} />
            <Text style={{ color: 'white' }}>{t('settings.privacy')}</Text>
          </View>
        </GlassButton>
        <GlassButton onPress={signOut}>
          <LogOut color="white" size={20} style={styles.icon} />
          <Text style={{ color: 'white' }}>{t('settings.logout')}</Text>
        </GlassButton>
        <GlassButton onPress={() => router.back()}>
          <Text style={{ color: 'white' }}>{t('settings.back')}</Text>
        </GlassButton>
      </ScrollView>
      <Modal
        visible={showPolicy}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPolicy(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPolicy(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.privacy')}</Text>
            <Text style={styles.policyText}>
              <Trans
                i18nKey="login.policy"
                components={{
                  tos: <Text style={styles.link} onPress={() => Linking.openURL('https://hllc.mfu.ac.th/terms-of-service')} />,
                  privacy: <Text style={styles.link} onPress={() => Linking.openURL('https://hllc.mfu.ac.th/privacy-policy')} />
                }}
              />
            </Text>
            <GlassButton onPress={() => setShowPolicy(false)}>
              <Text style={{ color: 'white' }}>{t('settings.back')}</Text>
            </GlassButton>
          </View>
        </Pressable>
      </Modal>
      <GlassConfirmModal
        visible={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
        title={t('settings.delete_confirm_title')}
        message={t('settings.delete_confirm_message')}
        confirmText={t('global.confirm')}
        cancelText={t('global.cancel')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: undefined, // keep as is or set if needed
  },
  center: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 48,
    minHeight: '100%',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  policyText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  link: {
    color: '#4FC3F7',
    textDecorationLine: 'underline',
  },
}); 