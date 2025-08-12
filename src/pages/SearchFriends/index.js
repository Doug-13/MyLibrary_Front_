import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.js';

const api = axios.create({ baseURL: API_BASE_URL });

// ===== Design System (MyLibrary App) =====
const COLORS = {
  primary: '#F3D00F',
  secondary: '#4E8CFF',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  label: '#B2BEC3',
  border: '#E0E0E0',
  error: '#DC3545',
  success: '#28A745',
};
const RADIUS = 12;
const ELEV = 2;
const AVATAR = 56;

const SearchFriends = ({ navigation }) => {
  const { userMongoId, setTimeStamp } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [textoBusca, setTextoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===== Carregamento principal (sem N+1) =====
  const fetchBaseList = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/users/${userMongoId}/first30-with-follow-status`);
    const data = await res.json();
    // remove o próprio usuário
    return (Array.isArray(data) ? data : []).filter(u => u._id !== userMongoId);
  }, [userMongoId]);

  const maybePatchFollowStatus = useCallback(async (arr) => {
    // Se já vierem os campos, retorna direto (evita N+1)
    if (arr.every(u => 'isFollowing' in u || 'isFollowedByMe' in u || 'isFollowedBack' in u)) {
      return arr;
    }
    // fallback opcional: faz UMA chamada por usuário, mas tente evitar esse caminho
    const patched = await Promise.all(
      arr.map(async (u) => {
        try {
          const r = await fetch(`${API_BASE_URL}/connections/${userMongoId}/follow-status/${u._id}`);
          const s = await r.json();
          return { ...u, ...s };
        } catch {
          return u;
        }
      })
    );
    return patched;
  }, [userMongoId]);

  const atualizarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const base = await fetchBaseList();
      const withStatus = await maybePatchFollowStatus(base);
      setUsuarios(withStatus);
    } catch (e) {
      console.error('Erro ao atualizar usuários:', e);
      setUsuarios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTimeStamp(new Date());
    }
  }, [fetchBaseList, maybePatchFollowStatus, setTimeStamp]);

  useEffect(() => {
    atualizarUsuarios();
  }, [userMongoId, atualizarUsuarios]);

  // ===== Debounce da busca =====
  const [debouncedText, setDebouncedText] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(textoBusca.trim().toLowerCase()), 220);
    return () => clearTimeout(t);
  }, [textoBusca]);

  // ===== Lista filtrada (derivada) =====
  const usuariosFiltrados = useMemo(() => {
    if (!debouncedText) return usuarios;
    return usuarios.filter((u) =>
      (u.nome_completo || '').toLowerCase().includes(debouncedText)
    );
  }, [usuarios, debouncedText]);

  // ===== Ações seguir/deixar de seguir =====
  const handleAdicionarAmizade = useCallback(async (followingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: userMongoId, following: followingId }),
      });
      if (!response.ok) return alert('Erro ao seguir usuário');

      // notificação
      try {
        await api.post('/notifications', {
          recipient_id: followingId,
          user_id: userMongoId,
          messageType: 'newFollower',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Erro ao criar notificação de novo seguidor:', err);
      }

      // otimista: atualiza estado local sem refetch completo
      setUsuarios((prev) =>
        prev.map((u) => (u._id === followingId ? { ...u, isFollowing: true } : u))
      );
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    }
  }, [userMongoId]);

  const handleDeixarDeSeguir = useCallback(async (followingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${userMongoId}/${followingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) return alert('Erro ao deixar de seguir');

      // deleta notificação
      try {
        await api.delete(`/notifications/${userMongoId}/${followingId}`);
      } catch (err) {
        console.error('Erro ao deletar notificação de deixar de seguir:', err);
      }

      // otimista
      setUsuarios((prev) =>
        prev.map((u) => (u._id === followingId ? { ...u, isFollowing: false } : u))
      );
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
    }
  }, [userMongoId]);

  // ===== Item da lista (memo) =====
  const FriendRow = React.memo(({ item }) => {
    const isFollowing = !!item.isFollowing;
    const followLabel = isFollowing ? 'Seguindo' : item.isFollowedBack ? 'Seguir de volta' : 'Seguir';

    return (
      <TouchableOpacity
        style={styles.userItem}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('FriendsProfile', { friendId: item._id })}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: item.foto_perfil || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.nome_completo}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing ? styles.unfollowBtn : styles.followBtn]}
              onPress={() => (isFollowing ? handleDeixarDeSeguir(item._id) : handleAdicionarAmizade(item._id))}
              activeOpacity={0.9}
            >
              <Text style={styles.followBtnText}>{followLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Icon name="chevron-right" size={22} color={COLORS.label} />
      </TouchableOpacity>
    );
  });

  // ===== Header com voltar + busca =====
  const Header = (
    <View style={styles.hero}>
      <View style={styles.heroRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Procurar Amigos</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquise pelo nome..."
          placeholderTextColor={COLORS.label}
          value={textoBusca}
          onChangeText={setTextoBusca}
          returnKeyType="search"
        />
        {!!textoBusca && (
          <TouchableOpacity onPress={() => setTextoBusca('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ===== Render =====
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Carregando amigos…</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        {Header}

        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => <FriendRow item={item} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                atualizarUsuarios();
              }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          // 🔧 Perf
          initialNumToRender={10}
          windowSize={7}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // HERO
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E68B',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },

  // Busca “pill”
  searchWrap: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, color: COLORS.text, paddingVertical: 0, fontSize: 14 },

  // Item da lista
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: { width: '100%', height: '100%' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: COLORS.text },

  actionsRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  followBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: '#3B79E6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  unfollowBtn: {
    backgroundColor: COLORS.error,
    borderColor: '#C32735',
  },
  followBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Empty / Loading
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.textSecondary },
  loadingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchFriends;
