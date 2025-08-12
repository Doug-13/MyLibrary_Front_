import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Image,
  InteractionManager,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../../context/AuthContext.js';
import { API_BASE_URL } from '../../config/api.js';

// ---------- Tema (igual ao restante do app) ----------
const PRIMARY = '#f3d00f';
const BG = '#F6F7FB';
const CARD = '#FFFFFF';
const TEXT = '#1F2937';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

// ---------- Helpers ----------
const translateVisibility = (v) =>
  v === 'public' ? 'Pública' : v === 'private' ? 'Privada' : v === 'friends' ? 'Somente amigos' : '—';

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={16} color={MUTED} />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value || 'Não informado'}</Text>
  </View>
);

const Chip = ({ icon, text, tone = 'default' }) => (
  <View style={[styles.chip, tone === 'dark' && styles.chipDark]}>
    {!!icon && <Ionicons name={icon} size={12} color={tone === 'dark' ? '#fff' : '#111827'} style={{ marginRight: 6 }} />}
    <Text style={[styles.chipTxt, tone === 'dark' && styles.chipTxtDark]}>{text}</Text>
  </View>
);

export default function ProfilePage() {
  const navigation = useNavigation();
  const { userMongoId, userId, timeStamp } = useContext(AuthContext);

  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/${userId}`);
      const data = res.data;

      // prefetch da imagem pra transição suave
      if (data?.foto_perfil) {
        try { await FastImage.preload([{ uri: data.foto_perfil }]); } catch {}
      }

      if (!mounted.current) return;
      setUserData(data);
    } catch (e) {
      // opcional: exibir toast/alert
    } finally {
      if (!mounted.current) return;
      setRefreshing(false);
    }
  }, [API_BASE_URL, userId]);

  useEffect(() => {
    mounted.current = true;
    // processa após animação de navegação para evitar travadas
    const task = InteractionManager.runAfterInteractions(() => { fetchUserData(); });
    return () => { mounted.current = false; task.cancel?.(); };
  }, [fetchUserData, timeStamp, userMongoId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  const handleEditProfile = () => navigation.navigate('Profile');

  const genresText = userData?.generos_favoritos?.length
    ? userData.generos_favoritos.join(', ')
    : 'Não informado';

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Meu Perfil</Text>
        <TouchableOpacity style={[styles.iconBtn, styles.editBtn]} onPress={handleEditProfile} accessibilityLabel="Editar perfil">
          <Ionicons name="pencil" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
      >
        {/* Header do perfil */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            <FastImage
              source={
                userData?.foto_perfil
                  ? { uri: userData.foto_perfil, priority: FastImage.priority.normal }
                  : require('../../../assets/perfilLendo.png')
              }
              style={styles.avatar}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <Text style={styles.name} numberOfLines={1}>{userData?.nome_completo || '—'}</Text>

          <View style={styles.chipsRow}>
            {userData?.role?.isReader ? <Chip icon="book" text="Leitor" tone="dark" /> : null}
            {userData?.role?.isWriter ? <Chip icon="pencil" text="Escritor" tone="dark" /> : null}
            <Chip icon="lock-closed" text={translateVisibility(userData?.visibilidade_biblioteca)} />
          </View>

          <Text style={styles.bio} numberOfLines={3}>
            {userData?.sobremim ? `"${userData.sobremim}"` : 'Nenhuma descrição disponível.'}
          </Text>

          <TouchableOpacity style={styles.cta} onPress={handleEditProfile}>
            <Ionicons name="create" size={16} color="#111827" />
            <Text style={styles.ctaTxt}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Detalhes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          <InfoRow icon="call" label="Telefone" value={userData?.telefone} />
          <InfoRow
            icon="calendar"
            label="Data de nascimento"
            value={
              userData?.data_nascimento
                ? new Date(userData.data_nascimento).toLocaleDateString()
                : 'Não informado'
            }
          />
          <InfoRow icon="pricetags" label="Gêneros favoritos" value={genresText} />
          <InfoRow icon="eye" label="Visibilidade da biblioteca" value={translateVisibility(userData?.visibilidade_biblioteca)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Estilos ----------
const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  topBar: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  editBtn: { backgroundColor: '#FDE68A' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 18, color: TEXT, fontWeight: '800' },

  container: { padding: 16, paddingBottom: 28 },

  cardHeader: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    padding: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 2,
  },
  avatar: { width: '100%', height: '100%', borderRadius: AVATAR_SIZE / 2, backgroundColor: '#EEE' },

  name: { fontSize: 20, fontWeight: '800', color: TEXT, marginTop: 10, textAlign: 'center' },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: PRIMARY,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  chipDark: { backgroundColor: '#111827', borderColor: '#111827' },
  chipTxt: { color: '#111827', fontSize: 12, fontWeight: '800' },
  chipTxtDark: { color: '#fff' },

  bio: { marginTop: 8, color: MUTED, textAlign: 'center' },

  cta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderColor: '#FACC15',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaTxt: { color: '#111827', fontWeight: '800' },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 8 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoLabel: { width: 150, color: MUTED, fontWeight: '700' },
  infoValue: { flex: 1, color: TEXT, fontWeight: '600' },
});
