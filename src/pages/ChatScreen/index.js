// screens/ChatScreen/index.js
import React, { useContext, useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  TextInput,
  InteractionManager,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import { API_BASE_URL } from '../../config/api.js';

// ---------- Tema (mesma linha das outras telas) ----------
const PRIMARY = '#f3d00f';
const BG = '#F6F7FB';
const CARD = '#FFFFFF';
const TEXT = '#1F2937';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

// ---------- Utils ----------
const normalize = (s = '') => s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const timeAgo = (dateStr) => {
  const d = new Date(dateStr);
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const dys = Math.floor(h / 24);
  return `${dys} d`;
};

// ---------- Item memoizado ----------
const NotificationItem = memo(function NotificationItem({
  item,
  status,
  onPress,
  onFollowToggle,
  onAcceptLoan,
  onDeclineLoan,
}) {
  const isUnread = item.status === 'unread';
  const isBook = item.messageType === 'bookAdded';
  const isFollower = item.messageType === 'newFollower';
  const isLoan = item.messageType === 'loanRequest';

  return (
    <Pressable style={[styles.card, isUnread && styles.cardUnread]} onPress={onPress}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image
          source={item.foto_perfil ? { uri: item.foto_perfil } : require('../../../assets/perfilLendo.png')}
          style={styles.avatar}
        />
        {isUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Conteúdo (texto + ações de empréstimo) */}
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <View style={styles.typeChip}>
            {isBook ? (
              <Ionicons name="book" size={12} />
            ) : isLoan ? (
              <MaterialIcons name="swap-horiz" size={14} />
            ) : (
              <Ionicons name="person-add" size={12} />
            )}
            <Text style={styles.typeChipTxt}>
              {isBook ? 'Livro' : isLoan ? 'Empréstimo' : 'Seguidor'}
            </Text>
          </View>

          <Text style={styles.timeTxt}>{timeAgo(item.created_at)}</Text>
        </View>

        <Text style={styles.titleTxt} numberOfLines={2}>
          {isFollower
            ? `${item.nome_completo} começou a te seguir!`
            : isLoan
              ? `${item.nome_completo} solicitou emprestado "${item.titleBook ?? 'seu livro'}".`
              : `${item.nome_completo} adicionou um novo livro`}
        </Text>

        {item.titleBook ? (
          <Text style={styles.subtitleTxt} numberOfLines={1}>Livro: {item.titleBook}</Text>
        ) : null}

        {/* BOTÕES DE EMPRÉSTIMO AGORA AQUI LOGO ABAIXO DO NOME DO LIVRO */}
        {isLoan && (
          <View style={styles.buttonsRow}>
            {/* <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={onAcceptLoan}
              accessibilityLabel="Aceitar solicitação de empréstimo"
            >
              <Text style={styles.actionBtnTxt}>Aceitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.dangerBtn]}
              onPress={onDeclineLoan}
              accessibilityLabel="Recusar solicitação de empréstimo"
            >
              <Text style={styles.actionBtnTxt}>Recusar</Text>
            </TouchableOpacity> */}
          </View>
        )}
      </View>

      {/* Trailing (thumbnail ou botão seguir) */}
      <View style={styles.trailing}>
        {(isBook || isLoan) && item.imageBook ? (
          <Image source={{ uri: item.imageBook }} style={styles.bookThumb} />
        ) : null}

        {isFollower ? (
          <TouchableOpacity
            style={[styles.followBtn, status?.isFollowing ? styles.unfollow : styles.follow]}
            onPress={onFollowToggle}
          >
            <Text style={styles.followTxt}>{status?.isFollowing ? 'Seguindo' : 'Seguir'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Pressable>
  );
});

// ---------- Tela ----------
export default function ChatScreen() {
  const { userMongoId } = useContext(AuthContext);
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Busca / Filtros
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | followers | books | loans

  // caches
  const fetchedUsersRef = useRef(new Set());
  const cacheRef = useRef({});
  const pendingRef = useRef(new Set());
  const mounted = useRef(true);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // --------- API: Notificações ---------
  const fetchNotifications = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await fetch(`${API_BASE_URL}/notifications/${userMongoId}/all-friends-notifications`);
      const data = await res.json();

      // filtra últimos 7 dias e ordena
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 7);
      const filtered = (Array.isArray(data) ? data : [])
        .filter((it) => new Date(it.created_at) >= dateLimit)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      InteractionManager.runAfterInteractions(() => {
        if (!mounted.current) return;
        setNotifications(filtered);
      });
    } catch (e) {
      console.log('Erro ao buscar notificações:', e?.message ?? e);
    } finally {
      if (!mounted.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [userMongoId, refreshing]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      fetchNotifications();
      return () => { mounted.current = false; };
    }, [fetchNotifications])
  );

  // --------- API: Follow status (com cache/lote) ---------
  const getFollowStatus = useCallback(async (userId) => {
    if (cacheRef.current[userId]) return cacheRef.current[userId];
    if (pendingRef.current.has(userId)) {
      return new Promise((resolve) => {
        const iv = setInterval(() => {
          if (cacheRef.current[userId]) {
            clearInterval(iv);
            resolve(cacheRef.current[userId]);
          }
        }, 100);
      });
    }

    pendingRef.current.add(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${userMongoId}/follow-status/${userId}`);
      const data = await res.json();
      cacheRef.current[userId] = data;
      return data;
    } catch (e) {
      console.log('Erro status follow:', e?.message ?? e);
      return null;
    } finally {
      pendingRef.current.delete(userId);
    }
  }, [userMongoId]);

  // Lote para novos seguidores
  useEffect(() => {
    const newUsers = notifications
      .filter((it) => it.messageType === 'newFollower')
      .map((it) => it.user_id)
      .filter(Boolean);

    const unique = Array.from(new Set(newUsers))
      .filter((id) => !fetchedUsersRef.current.has(id))
      .filter((id) => !cacheRef.current[id]);

    if (!unique.length) return;

    unique.forEach((id) => fetchedUsersRef.current.add(id));

    (async () => {
      const results = await Promise.all(unique.map(getFollowStatus));
      const updates = {};
      unique.forEach((id, i) => {
        if (results[i]) {
          updates[id] = results[i];
          cacheRef.current[id] = results[i];
        }
      });
      if (Object.keys(updates).length) {
        setFollowStatus((prev) => ({ ...prev, ...updates }));
      }
    })();
  }, [notifications, getFollowStatus]);

  // --------- Actions ---------
  const markAsRead = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/mark-as-read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, status: 'read' } : n)));
      }
    } catch (e) {
      console.log('Erro marcar como lida:', e?.message ?? e);
    }
  }, []);

  const handleFollow = useCallback(async (followerId, followingId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: followerId, following: followingId }),
      });
      if (res.ok) {
        setFollowStatus((prev) => {
          const updated = { ...prev, [followingId]: { ...(prev[followingId] || {}), isFollowing: true } };
          cacheRef.current[followingId] = updated[followingId];
          return updated;
        });
      }
    } catch (e) {
      console.log('Erro ao seguir:', e?.message ?? e);
    }
  }, []);

  const handleUnfollow = useCallback(async (followerId, followingId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${followerId}/${followingId}`, { method: 'DELETE' });
      if (res.ok) {
        setFollowStatus((prev) => {
          const updated = { ...prev, [followingId]: { ...(prev[followingId] || {}), isFollowing: false } };
          cacheRef.current[followingId] = updated[followingId];
          return updated;
        });
      }
    } catch (e) {
      console.log('Erro ao deixar de seguir:', e?.message ?? e);
    }
  }, []);

  const handleAcceptLoan = useCallback(async (request) => {
    try {
      console.log('Aceitar empréstimo:', request._id);
      // const res = await fetch(`${API_BASE_URL}/loans/requests/${request._id}/accept`, { method: 'POST' });
      // if (res.ok) markAsRead(request._id);
      markAsRead(request._id); // otimista
    } catch (e) {
      console.log('Erro aceitar empréstimo:', e?.message ?? e);
    }
  }, [markAsRead]);

  const handleDeclineLoan = useCallback(async (request) => {
    try {
      console.log('Recusar empréstimo:', request._id);
      // const res = await fetch(`${API_BASE_URL}/loans/requests/${request._id}/decline`, { method: 'POST' });
      // if (res.ok) markAsRead(request._id);
      markAsRead(request._id); // otimista
    } catch (e) {
      console.log('Erro recusar empréstimo:', e?.message ?? e);
    }
  }, [markAsRead]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // --------- Filtro/Busca em memória ---------
  const filteredList = useMemo(() => {
    let list = notifications;

    if (filter === 'unread') list = list.filter((n) => n.status === 'unread');
    if (filter === 'followers') list = list.filter((n) => n.messageType === 'newFollower');
    if (filter === 'books') list = list.filter((n) => n.messageType === 'bookAdded');
    if (filter === 'loans') list = list.filter((n) => n.messageType === 'loanRequest');

    const q = normalize(debouncedQuery);
    if (q) {
      list = list.filter((n) => {
        const name = normalize(n.nome_completo || '');
        const book = normalize(n.titleBook || '');
        return name.includes(q) || book.includes(q);
      });
    }
    return list;
  }, [notifications, filter, debouncedQuery]);

  // --------- Renderers ----------
  const renderItem = useCallback(
    ({ item }) => {
      const status = followStatus[item.user_id];

      const onPress = async () => {
        if (item.status === 'unread') markAsRead(item._id);
        if (item.imageBook) { try { await Image.prefetch(item.imageBook); } catch { } }
        if (item.foto_perfil) { try { await Image.prefetch(item.foto_perfil); } catch { } }

        if (item.messageType === 'newFollower') {
          navigation.navigate('FriendsProfile', { friendId: item.user_id });
        } else if (item.messageType === 'bookAdded') {
          // navigation.navigate('BooksView', { bookId: item.bookId });
        } else if (item.messageType === 'loanRequest') {
          // navigation.navigate('LoanRequestDetail', { requestId: item._id });
        }
      };

      const onFollowToggle = () => {
        if (status?.isFollowing) {
          handleUnfollow(userMongoId, item.user_id);
        } else {
          handleFollow(userMongoId, item.user_id);
        }
      };

      const onAcceptLoan = () => handleAcceptLoan(item);
      const onDeclineLoan = () => handleDeclineLoan(item);

      return (
        <NotificationItem
          item={item}
          status={status}
          onPress={onPress}
          onFollowToggle={onFollowToggle}
          onAcceptLoan={onAcceptLoan}
          onDeclineLoan={onDeclineLoan}
        />
      );
    },
    [followStatus, handleFollow, handleUnfollow, markAsRead, navigation, userMongoId, handleAcceptLoan, handleDeclineLoan]
  );

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <Image source={require('../../../assets/emptyLibrary.jpg')} style={styles.emptyImg} resizeMode="contain" />
      <Text style={styles.emptyTitle}>Nada por aqui</Text>
      <Text style={styles.emptyMsg}>Sem mensagens recentes nos últimos 7 dias.</Text>
    </View>
  );

  // ---------- UI ----------
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Busca */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome ou livro…"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Limpar busca">
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Chips de filtro */}
      <View style={styles.filters}>
        <Pressable style={[styles.chip, filter === 'all' && styles.chipActive]} onPress={() => setFilter('all')}>
          <Text style={[styles.chipTxt, filter === 'all' && styles.chipTxtActive]}>Todos</Text>
          <View style={[styles.badge, filter === 'all' && styles.badgeActive]}>
            <Text style={styles.badgeTxt}>{notifications.length}</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.chip, filter === 'unread' && styles.chipActive]} onPress={() => setFilter('unread')}>
          <Text style={[styles.chipTxt, filter === 'unread' && styles.chipTxtActive]}>Não lidas</Text>
          <View style={[styles.badge, filter === 'unread' && styles.badgeActive]}>
            <Text style={styles.badgeTxt}>{notifications.filter(n => n.status === 'unread').length}</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.chip, filter === 'followers' && styles.chipActive]} onPress={() => setFilter('followers')}>
          <Text style={[styles.chipTxt, filter === 'followers' && styles.chipTxtActive]}>Seguidores</Text>
          <View style={[styles.badge, filter === 'followers' && styles.badgeActive]}>
            <Text style={styles.badgeTxt}>{notifications.filter(n => n.messageType === 'newFollower').length}</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.chip, filter === 'books' && styles.chipActive]} onPress={() => setFilter('books')}>
          <Text style={[styles.chipTxt, filter === 'books' && styles.chipTxtActive]}>Livros</Text>
          <View style={[styles.badge, filter === 'books' && styles.badgeActive]}>
            <Text style={styles.badgeTxt}>{notifications.filter(n => n.messageType === 'bookAdded').length}</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.chip, filter === 'loans' && styles.chipActive]} onPress={() => setFilter('loans')}>
          <Text style={[styles.chipTxt, filter === 'loans' && styles.chipTxtActive]}>Empréstimos</Text>
          <View style={[styles.badge, filter === 'loans' && styles.badgeActive]}>
            <Text style={styles.badgeTxt}>{notifications.filter(n => n.messageType === 'loanRequest').length}</Text>
          </View>
        </Pressable>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={ListEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
        initialNumToRender={10}
        windowSize={10}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

// ---------- Estilos ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  topBar: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, color: TEXT, fontWeight: '800' },

  searchWrap: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },

  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTxt: { color: TEXT, fontWeight: '600' },
  chipTxtActive: { color: '#111827' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: '#111827' },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 24 },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFF',
  },

  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEE' },
  unreadDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 12,
    height: 12,
    backgroundColor: '#1D4ED8',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CARD,
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  typeChipTxt: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  timeTxt: { fontSize: 11, color: MUTED },

  titleTxt: { fontSize: 14, fontWeight: '800', color: TEXT, marginTop: 6 },
  subtitleTxt: { fontSize: 12, color: MUTED, marginTop: 2 },

  // Linha de botões "Aceitar/Recusar" para empréstimo (logo abaixo do livro)
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  primaryBtn: { backgroundColor: '#111827' },
  dangerBtn: { backgroundColor: '#DC2626' },
  actionBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  trailing: { alignItems: 'flex-end', gap: 8, marginLeft: 8 },
  bookThumb: { width: 48, height: 64, borderRadius: 6, backgroundColor: '#EEE' },

  // Botão seguir (somente para "newFollower")
  followBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  follow: { backgroundColor: '#111827' },
  unfollow: { backgroundColor: '#DC2626' },
  followTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  emptyImg: { width: 200, height: 200, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 4 },
  emptyMsg: { fontSize: 14, color: MUTED, textAlign: 'center' },
});
