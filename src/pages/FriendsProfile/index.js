import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  FlatList,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';

import { AuthContext } from '../../../context/AuthContext.js';
import ModalBook from '../../components/Modal/index.js';
import { API_BASE_URL } from '../../config/api.js';

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

export default function FriendsProfile({ route }) {
  const navigation = useNavigation();
  const { userMongoId, setTimeStamp } = useContext(AuthContext);

  const [friendData, setFriendData] = useState(null);
  const [sections, setSections] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBack, setIsFollowedBack] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const [isGridView, setIsGridView] = useState(true);

  const isFocused = useIsFocused();

  // busca
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  // ✅ pegue friendId apenas UMA vez
  const { friendId } = route.params ?? {};

  // ---------- Helpers para capa ----------
  const pick = (...vals) => vals.find(v => typeof v === 'string' && v.trim().length > 0);
  const joinUrl = (base, path) => {
    if (!base) return path;
    const b = String(base).replace(/\/+$/, '');
    const p = String(path).replace(/^\/+/, '');
    return `${b}/${p}`;
  };
  const resolveCoverUri = (book) => {
    const raw =
      pick(
        book?.coverUrl,
        book?.coverURL,
        book?.imageBook,
        book?.image_url,
        book?.cover,
        book?.thumbnail,
        book?.photo,
        book?.photoURL,
        book?.coverImageUrl
      ) || '';
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return joinUrl(API_BASE_URL, trimmed);
    return joinUrl(API_BASE_URL, trimmed);
  };
  // ---------------------------------------

  const categorizeBooksByGenre = useCallback((data = []) => {
    const categories = {};
    const publicBooks = data.filter((book) => book.visibility === 'public');
    publicBooks.forEach((book) => {
      const genre = book.genre || 'Outros';
      if (!categories[genre]) categories[genre] = { title: genre, books: [] };
      categories[genre].books.push({ ...book });
    });
    return Object.values(categories);
  }, []);

  const fetchFollowStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/connections/${userMongoId}/follow-status/${friendId}`);
      const data = await res.json();
      if (data) {
        setIsFollowing(data.isFollowing);
        setIsFollowedBack(data.isFollowedBack);
      }
    } catch (err) {
      console.error('Erro ao buscar follow status:', err);
    }
  }, [userMongoId, friendId]);

  const fetchFriendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/users/${friendId}/friends`);
      const data = await response.json();

      setFriendData(data.user);
      setSections(categorizeBooksByGenre(data.books || []));

      // follow status em paralelo
      await fetchFollowStatus();

      setTimeStamp(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar informações.');
      setLoading(false);
    }
  }, [friendId, categorizeBooksByGenre, fetchFollowStatus, setTimeStamp]);

  const handleAdicionarAmizade = useCallback(
    async (followerId, followingId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/connections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower: followerId, following: followingId }),
        });
        if (response.ok) setIsFollowing(true);
        else alert('Erro ao seguir usuário');
      } catch (error) {
        console.error('Erro ao seguir usuário:', error);
      }
    },
    []
  );

  const handleDeixarDeSeguir = useCallback(
    async (followerId, followingId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/connections/${followerId}/${followingId}`, {
          method: 'DELETE',
        });
        if (response.ok) setIsFollowing(false);
        else alert('Erro ao deixar de seguir');
      } catch (error) {
        console.error('Erro ao deixar de seguir:', error);
      }
    },
    []
  );

  const toggleFollow = useCallback(async () => {
    setTimeStamp(new Date());
    if (isFollowing) await handleDeixarDeSeguir(userMongoId, friendId);
    else await handleAdicionarAmizade(userMongoId, friendId);
    await fetchFollowStatus();
  }, [isFollowing, userMongoId, friendId, handleAdicionarAmizade, handleDeixarDeSeguir, fetchFollowStatus, setTimeStamp]);

  useEffect(() => {
    if (!friendId) return;
    // limpa estado ao trocar de amigo
    setFriendData(null);
    setSections([]);
    setSearchText('');
    setLoading(true);
    fetchFriendData();
  }, [friendId, fetchFriendData]);

  useEffect(() => {
    if (isFocused && friendId) {
      // ao voltar para a tela, garante dados atualizados
      fetchFriendData();
    }
  }, [isFocused, friendId, fetchFriendData]);

  // ===== Busca local (título/autor) =====
  const filteredSections = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return sections;

    const next = sections
      .map((section) => {
        const books = section.books.filter((b) => {
          const t = (b.title || '').toLowerCase();
          const a = (b.author || '').toLowerCase();
          return t.includes(q) || a.includes(q);
        });
        return { ...section, books };
      })
      .filter((s) => s.books.length > 0);

    return next;
  }, [sections, searchText]);

  // === UI ===
  const handleBookPress = (book) => {
    navigation.navigate('BookDetailsFriends', {
      book: { ...book, friendId }, // <-- passa o friendId aqui
      friendId,                    // opcional: também passo fora de book
    });
  };

  const renderBookItem = ({ item }) => {
    if (item.visibility !== 'public') return null;
    const uri = resolveCoverUri(item);
    const imageSource = uri ? { uri } : require('../../../assets/noImageAvailable.jpg');
    const onImgError = () => {};

    return isGridView ? (
      <TouchableOpacity style={styles.card} onPress={() => handleBookPress(item)} activeOpacity={0.9}>
        <Image source={imageSource} style={styles.coverImage} onError={onImgError} />
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.bookListItem} onPress={() => handleBookPress(item)} activeOpacity={0.9}>
        <Image source={imageSource} style={styles.bookCover} onError={onImgError} />
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = ({ item }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      <FlatList
        data={item.books}
        renderItem={renderBookItem}
        keyExtractor={(book) => String(book.id || book._id || `${book.title}-${book.author}`)}
        horizontal={isGridView}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
  };

  // ===== Estados de carregamento/erro =====
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView source={require('../../../assets/animation3.json')} autoPlay loop style={{ width: 200, height: 200 }} />
        <Text style={styles.loadingText}>Carregando estatísticas, aguarde...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ color: COLORS.error, textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!friendData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary }}>Carregando dados do usuário...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.root}>
        {/* HERO com Voltar + Buscar */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-back" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.heroTitle} numberOfLines={1}>Perfil do Amigo</Text>
            <TouchableOpacity onPress={() => setShowSearch((s) => !s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name={showSearch ? 'close' : 'search'} size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSubtitle}>Veja os livros públicos deste usuário</Text>

          {showSearch && (
            <View style={styles.searchWrap}>
              <Icon name="search" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por título ou autor..."
                placeholderTextColor={COLORS.label}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {!!searchText && (
                <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Perfil */}
        <View style={styles.profileContainer}>
          <Image
            source={
              friendData?.photos
                ? { uri: friendData.photos }
                : require('../../../assets/perfilLendo.png')
            }
            style={styles.profileImageLarge}
          />
          <Text style={styles.userName}>{friendData?.name || 'Amigo'}</Text>
          <Text style={styles.userBio}>{friendData?.bio || 'Sem informações.'}</Text>

          <TouchableOpacity
            style={[styles.followButton, isFollowing ? styles.unfollowButton : styles.followButton]}
            onPress={toggleFollow}
            activeOpacity={0.9}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? 'Seguindo' : !isFollowing && !isFollowedBack ? 'Seguir' : 'Seguir de volta'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo conforme visibilidade */}
        {friendData?.visibility === 'public' && (
          <FlatList
            data={filteredSections}
            renderItem={renderSection}
            keyExtractor={(section) => section.title}
            contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
            scrollIndicatorInsets={{ right: 1 }}
          />
        )}

        {friendData?.visibility === 'private' && (
          <View style={styles.privateProfileMessage}>
            <Text style={styles.privateProfileText}>
              Este perfil é privado. Não é possível visualizar os livros.
            </Text>
          </View>
        )}

        {friendData?.visibility === 'friends' && isFollowing && isFollowedBack && (
          <FlatList
            data={filteredSections}
            renderItem={renderSection}
            keyExtractor={(section) => section.title}
            contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
            scrollIndicatorInsets={{ right: 1 }}
          />
        )}

        {friendData?.visibility === 'friends' && (!isFollowing || !isFollowedBack) && (
          <View style={styles.privateProfileMessage}>
            <Text style={styles.privateProfileText}>
              Este perfil é visível apenas para amigos mútuos.
            </Text>
          </View>
        )}

        {/* Modal de livro (mantido) */}
        <ModalBook visible={modalVisible} onClose={closeModal} book={selectedBook} />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const AVATAR = 96;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.bg },
  loadingText: { marginTop: 8, color: COLORS.textSecondary },

  // HERO
  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: '#F6E68B' },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  heroSubtitle: { marginTop: 4, fontSize: 12, color: COLORS.textSecondary },

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
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, color: COLORS.text, paddingVertical: 0, fontSize: 14 },

  // Perfil
  profileContainer: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, backgroundColor: COLORS.bg },
  profileImageLarge: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, borderWidth: 2, borderColor: COLORS.border, backgroundColor: '#F1F5F9' },
  userName: { fontSize: 20, fontWeight: '700', marginTop: 8, color: COLORS.text },
  userBio: { color: COLORS.textSecondary, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 },
  followButton: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLORS.secondary, borderRadius: 20 },
  unfollowButton: { backgroundColor: '#dc3545' },
  followButtonText: { color: '#fff', fontWeight: '700' },

  list: { paddingHorizontal: 12 },

  sectionContainer: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: COLORS.text },

  card: {
    width: 140,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    padding: 8,
    borderWidth: 1, borderColor: COLORS.border,
    elevation: ELEV, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  coverImage: { width: '100%', height: 160, borderRadius: 8, marginBottom: 6, backgroundColor: '#F1F5F9' },
  bookTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  bookAuthor: { fontSize: 12, color: COLORS.textSecondary },

  bookListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 8, marginBottom: 8, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  bookCover: { width: 60, height: 90, borderRadius: 6, marginRight: 10, backgroundColor: '#F1F5F9' },
  bookDetails: { flex: 1 },

  privateProfileMessage: { padding: 16, alignItems: 'center' },
  privateProfileText: { textAlign: 'center', color: COLORS.textSecondary },
});
