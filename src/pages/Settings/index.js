// screens/Settings/SettingsScreen.js
import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import { ThemeContext } from '../../../context/ThemeContext.js';
import { API_BASE_URL } from '../../config/api.js';

const RADIUS = 12;
const ELEV = 2;
const SPACING = { xs: 6, sm: 10, md: 16, lg: 20 };

// Ative/desative logs aqui se quiser
const DEBUG = true;
const log = (...a) => { if (DEBUG) console.log('[Settings]', ...a); };

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signed, userName, userFirstName, userId, logout, user, idFirebase } = useContext(AuthContext);
  const { theme, mode, setMode } = useContext(ThemeContext);

  const [notifications, setNotifications] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [libraryVisibility, setLibraryVisibility] = useState('friends');
  const [language, setLanguage] = useState('pt-BR');
  const [loading, setLoading] = useState(true);

  const STORAGE_KEYS = {
    notifications: 'settings.notifications',
    libraryVisibility: 'settings.libraryVisibility',
    dataSaver: 'settings.dataSaver',
    autoBackup: 'settings.autoBackup',
    language: 'settings.language',
  };

  // resolve id do Firebase a partir do contexto
  const firebaseId = useMemo(() => idFirebase || user?.idFirebase || user?.idfirebase || null, [idFirebase, user]);

  useEffect(() => {
    log('mounted. signed=', signed, 'firebaseId=', firebaseId, 'API_BASE_URL=', API_BASE_URL);
    (async () => {
      try {
        const [n, v, ds, ab, lang] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.notifications),
          AsyncStorage.getItem(STORAGE_KEYS.libraryVisibility),
          AsyncStorage.getItem(STORAGE_KEYS.dataSaver),
          AsyncStorage.getItem(STORAGE_KEYS.autoBackup),
          AsyncStorage.getItem(STORAGE_KEYS.language),
        ]);
        log('AsyncStorage loaded:', { n, v, ds, ab, lang });
        if (n !== null) setNotifications(n === 'true');
        if (v !== null) setLibraryVisibility(v);
        if (ds !== null) setDataSaver(ds === 'true');
        if (ab !== null) setAutoBackup(ab === 'true');
        if (lang !== null) setLanguage(lang);
      } catch (e) {
        log('AsyncStorage load error:', e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [signed, firebaseId]);

  const persist = useCallback(async (key, value) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      log('persisted in AsyncStorage:', key, value);
    } catch (e) {
      log('persist error:', e?.message || e);
      Alert.alert('Não foi possível salvar sua preferência agora.');
    }
  }, []);

  // ============ HTTP helper com LOG ============
  const patchPrefs = useCallback(async (patch) => {
    if (!signed) { log('skip patch: not signed'); return { ok: false, error: 'not signed' }; }
    if (!firebaseId) { log('skip patch: missing firebaseId'); return { ok: false, error: 'missing firebaseId' }; }

    const url = `${API_BASE_URL}/users/${firebaseId}/prefs`;
    log('PATCH →', url, 'payload=', patch);

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });

      const raw = await res.text(); // pode ser JSON ou vazio
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

      log('PATCH ← status=', res.status, 'ok=', res.ok, 'response=', data);

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || raw || 'Erro desconhecido';
        Alert.alert('Falha ao salvar no servidor', `${res.status} • ${msg}`);
        return { ok: false, status: res.status, data };
      }

      return { ok: true, status: res.status, data };
    } catch (e) {
      log('fetch error:', e?.message || e);
      Alert.alert('Não foi possível sincronizar com o servidor agora.');
      return { ok: false, error: e?.message || String(e) };
    }
  }, [signed, firebaseId]);

  // === Tema ===
  const cycleTheme = useCallback(async () => {
    const order = ['system', 'light', 'dark'];
    const idx = order.indexOf(mode);
    const next = order[(idx + 1) % order.length];
    await setMode(next);
    log('theme changed →', next);
    await patchPrefs({ theme: next });
  }, [mode, setMode, patchPrefs]);

  const labelTheme = useMemo(() => (mode === 'system' ? 'Acompanhar sistema' : mode === 'light' ? 'Claro' : 'Escuro'), [mode]);

  const profileLabel = useMemo(() => {
    if (!signed) return 'Entrar / Criar conta';
    const name = userFirstName || userName || 'Usuário';
    return name;
  }, [signed, userFirstName, userName]);

  const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

  const Chevron = () => <Icon name="chevron-right" size={22} color={theme.label} />;
  const Divider = () => <View style={styles.divider} />;
  const Card = ({ children }) => <View style={styles.card}>{children}</View>;
  const Row = ({ icon, title, subtitle, onPress, trailing, danger }) => (
    <Pressable onPress={onPress} android_ripple={{ color: '#00000010' }} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, danger && { backgroundColor: '#FFF5F5', borderColor: '#FDE2E2' }]}>
          <Icon name={icon} size={22} color={danger ? theme.error : theme.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, danger && { color: theme.error }]}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.trailing}>{trailing}</View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Icon name="arrow-back" size={26} color={theme.text} onPress={() => navigation.goBack()} />
          <Text style={styles.heroTitle}>Configurações</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.heroSubtitle}>Personalize sua experiência no MyLibrary</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }} showsVerticalScrollIndicator={false}>
        {/* Conta */}
        <Section title="Conta" styles={styles}>
          <Card>
            <Row
              icon="person-outline"
              title={profileLabel}
              subtitle={signed ? 'Toque para editar seu perfil' : 'Entre para salvar suas preferências'}
              onPress={() => (signed ? navigation.navigate('Profile') : navigation.navigate('Auth'))}
              trailing={<Chevron />}
            />
          </Card>
        </Section>

        {/* Preferências */}
        <Section title="Preferências" styles={styles}>
          <Card>
            {/* Tema */}
            <Row icon="dark-mode" title="Tema" subtitle={labelTheme} onPress={cycleTheme} trailing={<Chevron />} />
            <Divider />

            {/* Notificações → notifications.push */}
            <Row
              icon="notifications-none"
              title="Notificações"
              subtitle="Alertas de pedidos de empréstimo, retornos e amigos"
              onPress={async () => {
                const next = !notifications;
                setNotifications(next);
                await persist(STORAGE_KEYS.notifications, next);
                log('notifications.toggle →', next);
                await patchPrefs({ notifications: { push: next } });
              }}
              trailing={<Chevron />}
            />
            <Divider />

            {/* Visibilidade da biblioteca */}
            <Row
              icon="visibility"
              title="Visibilidade da biblioteca"
              subtitle={libraryVisibility === 'public' ? 'Pública' : libraryVisibility === 'private' ? 'Somente você' : 'Apenas amigos'}
              onPress={async () => {
                const order = ['public', 'friends', 'private'];
                const idx = order.indexOf(libraryVisibility);
                const next = order[(idx + 1) % order.length];
                setLibraryVisibility(next);
                await persist(STORAGE_KEYS.libraryVisibility, next);
                log('visibility.toggle →', next);
                await patchPrefs({ visibilidade_biblioteca: next });
              }}
              trailing={<Chevron />}
            />
            <Divider />

            {/* Idioma */}
            <Row
              icon="language"
              title="Idioma"
              subtitle={language === 'pt-BR' ? 'Português (Brasil)' : 'English (US)'}
              onPress={async () => {
                const order = ['pt-BR', 'en-US'];
                const idx = order.indexOf(language);
                const next = order[(idx + 1) % order.length];
                setLanguage(next);
                await persist(STORAGE_KEYS.language, next);
                log('language.toggle →', next);
                await patchPrefs({ language: next });
              }}
              trailing={<Chevron />}
            />
          </Card>
        </Section>

        {/* Dados & Sincronização (locais) */}
        <Section title="Dados e sincronização" styles={styles}>
          <Card>
            <Row
              icon="speed"
              title="Economia de dados"
              subtitle={dataSaver ? 'Ativado' : 'Desativado'}
              onPress={async () => {
                const next = !dataSaver;
                setDataSaver(next);
                await persist(STORAGE_KEYS.dataSaver, next);
                log('dataSaver.toggle →', next);
              }}
              trailing={<Chevron />}
            />
            <Divider />
            <Row
              icon="backup"
              title="Backup automático"
              subtitle={autoBackup ? 'Ativado' : 'Desativado'}
              onPress={async () => {
                const next = !autoBackup;
                setAutoBackup(next);
                await persist(STORAGE_KEYS.autoBackup, next);
                log('autoBackup.toggle →', next);
              }}
              trailing={<Chevron />}
            />
          </Card>
        </Section>

        {/* Ajuda */}
        <Section title="Ajuda" styles={styles}>
          <Card>
            <Row icon="help-outline" title="Central de ajuda" onPress={() => navigation.navigate('HelpCenterScreen', { returnTo: 'Settings' })} trailing={<Chevron />} />
            <Divider />
            <Row icon="info-outline" title="Sobre o app" onPress={() => navigation.navigate('AboutScreen', { returnTo: 'Settings' })} trailing={<Chevron />} />
            <Divider />
            <Row icon="policy" title="Privacidade" onPress={() => navigation.navigate('PrivacyScreen', { returnTo: 'Settings' })} trailing={<Chevron />} />
            <Divider />
            <Row icon="article" title="Termos de uso" onPress={() => navigation.navigate('TermsScreen', { returnTo: 'Settings' })} trailing={<Chevron />} />
          </Card>
        </Section>

        {/* Conta (Destrutivas) */}
        <Section title="Conta" styles={styles}>
          <Card>
            <Row
              icon="logout"
              title="Sair"
              onPress={() => {
                Alert.alert(
                  'Sair da conta',
                  'Deseja realmente sair?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sair', style: 'destructive', onPress: () => logout(() => navigation.navigate('Login')) },
                  ],
                  { cancelable: true }
                );
              }}
            />
            {signed && (
              <>
                <Divider />
                <Row
                  icon="delete-forever"
                  title="Excluir conta"
                  subtitle="Remove permanentemente seus dados"
                  onPress={() => {
                    Alert.alert('Excluir conta', 'Essa ação é permanente e removerá seus dados. Deseja continuar?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            // esta rota espera o _id do Mongo
                            const url = `${API_BASE_URL}/users/${userId}`;
                            log('DELETE →', url);
                            const res = await fetch(url, { method: 'DELETE' });
                            const raw = await res.text();
                            log('DELETE ← status=', res.status, 'ok=', res.ok, 'response=', raw);
                            if (!res.ok) throw new Error(raw || 'Falha ao excluir');
                            Alert.alert('Conta excluída com sucesso.');
                          } catch (e) {
                            log('delete error:', e?.message || e);
                            Alert.alert('Não foi possível excluir sua conta.');
                          }
                        }
                      }
                    ]);
                  }}
                />
              </>
            )}
          </Card>
        </Section>

        <View style={{ height: 24 }} />
        <Text style={styles.footerText}>v1.0 • {Platform.OS === 'android' ? 'Android' : 'iOS'}</Text>
        <View style={{ height: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, styles, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/* ========== STYLES (fim) ========== */
function createStyles(theme, mode) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    hero: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: '#F6E68B',
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroTitle: { fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center' },
    heroSubtitle: { marginTop: 4, fontSize: 12, color: theme.text, textAlign: 'center', opacity: 0.9 },
    container: { flex: 1 },

    sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },

    card: {
      backgroundColor: theme.card,
      borderRadius: RADIUS,
      paddingHorizontal: 8,
      paddingVertical: 4,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: ELEV },
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mode === 'dark' ? '#2A2A2A' : '#F4F5F7',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      marginRight: 12,
    },
    rowTitle: { fontSize: 16, color: theme.text, fontWeight: '700' },
    rowSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    trailing: { marginLeft: 10 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: 56 },
    footerText: { textAlign: 'center', color: theme.label, fontSize: 12 },
  });
}
