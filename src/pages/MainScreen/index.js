import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  FlatList,
  View,
  Image,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  TextInput,
  InteractionManager,
} from 'react-native';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import { AuthContext } from '../../../context/AuthContext.js';
import ModalBook from '../../components/Modal/index.js';
import { API_BASE_URL } from '../../config/api.js';

// ✅ importe o ThemeContext
import { ThemeContext } from '../../../context/ThemeContext.js';

// ---------- Subcomponentes ----------
const Rating = memo(({ rating, color }) => {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f-${i}`} name="star" size={14} color={color} />
      ))}
      {half && <Ionicons name="star-half" size={14} color={color} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons key={`e-${i}`} name="star-outline" size={14} color={color} />
      ))}
    </View>
  );
});

const Progress = memo(({ currentPage, pageCount, barColor, trackColor, textColor }) => {
  const cur = Number(currentPage);
  const total = Number(pageCount);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(cur) || cur < 0) return null;

  const pct = Math.min(cur / total, 1);
  const widthPct = Math.max(pct * 100, 2);

  return (
    <View style={[{ marginTop: 10, height: 8, borderRadius: 999, overflow: 'hidden', position: 'relative', width: '100%', backgroundColor: trackColor }]} accessibilityLabel={`Progresso de leitura ${Math.round(pct * 100)}%`}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${widthPct}%`, backgroundColor: barColor }} />
      <Text style={{ position: 'absolute', right: 8, top: -18, fontSize: 11, color: textColor }}>
        {Math.round(pct * 100)}%
      </Text>
    </View>
  );
});

const BookCard = memo(({ item, onPress, styles, textColorMuted, starColor, barColor, trackColor }) => {
  const src =
    item.coverUrl && item.coverUrl.trim() !== ''
      ? { uri: item.coverUrl }
      : require('../../../assets/noImageAvailable.jpg');

  return (
    <Pressable style={styles.card} onPress={() => onPress(item)}>
      <Image source={src} style={styles.cover} />
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.cardAuthor, { color: textColorMuted }]} numberOfLines={1}>{item.author}</Text>
      <Rating rating={item.rating} color={starColor} />
      {item.status === 'lendo' && (
        <Progress
          currentPage={item.currentPage}
          pageCount={item.page_count}
          barColor={barColor}
          trackColor={trackColor}
          textColor={textColorMuted}
        />
      )}
    </Pressable>
  );
});

const BookRow = memo(({ item, onPress, styles, textColorMuted, starColor, barColor, trackColor, chevronColor }) => {
  const src =
    item.coverUrl && item.coverUrl.trim() !== ''
      ? { uri: item.coverUrl }
      : require('../../../assets/noImageAvailable.jpg');

  return (
    <Pressable style={styles.row} onPress={() => onPress(item)}>
      <Image source={src} style={styles.rowCover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.rowAuthor, { color: textColorMuted }]} numberOfLines={1}>{item.author}</Text>
        <Rating rating={item.rating} color={starColor} />
        {item.status === 'lendo' && (
          <Progress
            currentPage={item.currentPage}
            pageCount={item.page_count}
            barColor={barColor}
            trackColor={trackColor}
            textColor={textColorMuted}
          />
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={chevronColor} />
    </Pressable>
  );
});

// ---------- Helpers ----------
const normalizeTxt = (s = '') =>
  s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const toArray = (v) =>
  Array.isArray(v) ? v
    : Array.isArray(v?.books) ? v.books
      : Array.isArray(v?.data) ? v.data
        : [];

// ---------- Tela ----------
export default function MainScreen() {
  const navigation = useNavigation();
  const { nome_completo, primeiro_nome, foto_perfil, userMongoId } = useContext(AuthContext);

  // ✅ tema atual
  const { theme } = useContext(ThemeContext);

  // altíssimo contraste em cima do amarelo (primary)
  const onPrimary = '#111827';

  const styles = useMemo(() => mkStyles(theme, onPrimary), [theme]);

  const textMuted = theme.textSecondary;
  const border = theme.border;
  const card = theme.card;

  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isGridView, setIsGridView] = useState(true);

  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  // Filtros
  const [showAllBooks, setShowAllBooks] = useState(true);
  const [showPrivateBooks, setShowPrivateBooks] = useState(false);
  const [showLoanedBooks, setShowLoanedBooks] = useState(false);
  const [hasPrivateBooks, setHasPrivateBooks] = useState(false);
  const [hasLoanedBooks, setHasLoanedBooks] = useState(false);

  // Busca
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const isFocused = useIsFocused();
  const mounted = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ---------- Dados ----------
  const categorizeBooksByGenre = useCallback((data) => {
    const list = toArray(data);
    if (list.length === 0) return [];

    const readingBooks = list.filter((b) => b.status === 'lendo');
    const readingSection = {
      title: 'Lendo',
      books: readingBooks.map((book) => ({
        id: book._id,
        title: book.title,
        author: book.author,
        coverUrl: book.image_url,
        description: book.description,
        visibility: book.visibility,
        status: book.status,
        rating: book.rating,
        currentPage: book.currentPage,
        page_count: book.page_count,
        loans: book.loans,
      })),
    };

    const categories = {};
    list.forEach((book) => {
      if (book.status === 'lendo') return;
      const genre = book.genre || 'Outros';
      if (!categories[genre]) categories[genre] = { title: genre, books: [] };
      categories[genre].books.push({
        id: book._id,
        title: book.title,
        author: book.author,
        coverUrl: book.image_url,
        description: book.description,
        visibility: book.visibility,
        status: book.status,
        rating: book.rating,
        currentPage: book.currentPage,
        page_count: book.page_count,
        loans: book.loans,
      });
    });

    const sorted = Object.values(categories).sort((a, b) => a.title.localeCompare(b.title));
    return readingSection.books.length ? [readingSection, ...sorted] : sorted;
  }, []);

  // Filtros + Busca
  const applyFilters = useCallback(
    (data, query = '') => {
      const q = normalizeTxt(query);
      const safeSections = Array.isArray(data) ? data : [];

      return safeSections
        .map((section) => {
          const books = Array.isArray(section?.books) ? section.books : [];

          const baseFiltered = books.filter((book) => {
            if (showAllBooks) return true;
            if (showPrivateBooks && book.visibility === 'private') return true;
            if (showLoanedBooks && Array.isArray(book.loans) && book.loans.length) {
              const lastLoan = book.loans[book.loans.length - 1];
              return lastLoan?.status === 'Pendente';
            }
            return false;
          });

          if (!q) return { ...section, books: baseFiltered };

          const sectionMatches = normalizeTxt(section?.title || '').includes(q);

          const searched = sectionMatches
            ? baseFiltered
            : baseFiltered.filter((b) => {
                const t = normalizeTxt(b.title || '');
                const a = normalizeTxt(b.author || '');
                return t.includes(q) || a.includes(q);
              });

          return { ...section, books: searched };
        })
        .filter((s) => Array.isArray(s.books) && s.books.length > 0)
        .sort((a, b) => {
          if (a.title === 'Lendo') return -1;
          if (b.title === 'Lendo') return 1;
          return (a.title || '').localeCompare(b.title || '');
        });
    },
    [showAllBooks, showPrivateBooks, showLoanedBooks]
  );

  const fetchBooks = useCallback(async () => {
    try {
      if (!userMongoId) {
        setAllSections([]);
        setSections([]);
        setHasPrivateBooks(false);
        setHasLoanedBooks(false);
        setLoading(false);
        return;
      }

      if (!refreshing) setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/books/${userMongoId}/with-loans`);

      let raw = null;
      try {
        raw = await res.json();
      } catch {
        raw = null;
      }

      const list = toArray(raw);

      InteractionManager.runAfterInteractions(() => {
        if (!mounted.current) return;

        const formatted = categorizeBooksByGenre(list);
        setAllSections(formatted);
        setSections(applyFilters(formatted, debouncedQuery));

        setHasPrivateBooks(list.some((b) => b?.visibility === 'private'));
        setHasLoanedBooks(
          list.some((b) => Array.isArray(b?.loans) && b.loans.some((l) => l?.status === 'Pendente'))
        );
      });
    } catch (e) {
      if (!mounted.current) return;
      setError('Falha ao carregar os livros. Tente novamente.');
      setAllSections([]);
      setSections([]);
      setHasPrivateBooks(false);
      setHasLoanedBooks(false);
    } finally {
      if (!mounted.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [userMongoId, applyFilters, categorizeBooksByGenre, refreshing, debouncedQuery]);

  useFocusEffect(
    useCallback(() => {
      mounted.current = true;
      fetchBooks();
      return () => {
        mounted.current = false;
      };
    }, [fetchBooks])
  );

  useEffect(() => {
    if (!allSections.length) return;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!mounted.current) return;
      setSections(applyFilters(allSections, debouncedQuery));
    });
    return () => task.cancel();
  }, [allSections, applyFilters, debouncedQuery]);

  // ---------- Handlers ----------
  const onToggleView = useCallback(() => setIsGridView((v) => !v), []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBooks();
  }, [fetchBooks]);

  const onBookPress = useCallback(
    async (book) => {
      if (!book?.id) return;
      if (book.coverUrl) {
        try {
          await Image.prefetch(book.coverUrl);
        } catch {}
      }
      navigation.navigate('BooksView', { bookId: book.id });
    },
    [navigation]
  );

  const onEdit = useCallback(
    (book) => {
      navigation.navigate('EditBooks', { selectedBook: book });
    },
    [navigation]
  );

  const filterAll = useCallback(() => {
    setShowAllBooks(true);
    setShowPrivateBooks(false);
    setShowLoanedBooks(false);
  }, []);
  const filterPrivate = useCallback(() => {
    setShowAllBooks(false);
    setShowPrivateBooks(true);
    setShowLoanedBooks(false);
  }, []);
  const filterLoaned = useCallback(() => {
    setShowAllBooks(false);
    setShowPrivateBooks(false);
    setShowLoanedBooks(true);
  }, []);

  // Contadores
  const counts = useMemo(() => {
    const sectionsSafe = Array.isArray(allSections) ? allSections : [];
    const total = sectionsSafe.reduce((acc, s) => acc + (s.books?.length || 0), 0);
    const priv = sectionsSafe.reduce(
      (acc, s) => acc + (s.books?.filter((b) => b.visibility === 'private').length || 0),
      0
    );
    const loan = sectionsSafe.reduce(
      (acc, s) =>
        acc +
        (s.books?.filter(
          (b) => Array.isArray(b.loans) && b.loans.some((l) => l.status === 'Pendente')
        ).length || 0),
      0
    );
    return { total, priv, loan };
  }, [allSections]);

  // Renderers
  const renderBookItem = useCallback(
    ({ item }) =>
      isGridView ? (
        <BookCard
          item={item}
          onPress={onBookPress}
          styles={styles}
          textColorMuted={textMuted}
          starColor={theme.primary}
          barColor={theme.primary}
          trackColor={theme.border}
        />
      ) : (
        <BookRow
          item={item}
          onPress={onBookPress}
          styles={styles}
          textColorMuted={textMuted}
          starColor={theme.primary}
          barColor={theme.primary}
          trackColor={theme.border}
          chevronColor={textMuted}
        />
      ),
    [isGridView, onBookPress, styles, textMuted, theme.primary, theme.border]
  );

  const renderSection = useCallback(
    ({ item, index }) => (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{item.title}</Text>
        <FlatList
          key={`${item.title}-${index}-${isGridView}-${showAllBooks}-${showPrivateBooks}-${showLoanedBooks}-${debouncedQuery}`}
          data={item.books}
          renderItem={renderBookItem}
          keyExtractor={(b) => String(b.id)}
          horizontal={isGridView}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={isGridView ? styles.hList : undefined}
          removeClippedSubviews={false}
          initialNumToRender={6}
          windowSize={10}
          getItemLayout={
            isGridView ? (_, idx) => ({ length: 168, offset: 168 * idx, index: idx }) : undefined
          }
          extraData={{ isGridView, showAllBooks, showPrivateBooks, showLoanedBooks, debouncedQuery }}
        />
      </View>
    ),
    [isGridView, renderBookItem, showAllBooks, showPrivateBooks, showLoanedBooks, debouncedQuery, styles]
  );

  // ---------- Estados de erro ----------
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchBooks}>
          <Ionicons name="refresh" size={18} color={onPrimary} />
          <Text style={styles.retryTxt}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasBooks = sections.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.openDrawer()}
          accessibilityLabel="Abrir menu"
        >
          <MaterialIcons name="menu" size={26} color={onPrimary} />
        </TouchableOpacity>

        <Text style={styles.hello}>
          Olá, <Text style={{ fontWeight: '800', color: onPrimary }}>{primeiro_nome}</Text>
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate('Profile')} accessibilityLabel="Abrir perfil">
          <Image
            source={
              foto_perfil && foto_perfil.trim() !== ''
                ? { uri: foto_perfil }
                : require('../../../assets/perfilLendo.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* Header + toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Minha Biblioteca</Text>
        <TouchableOpacity style={styles.toggle} onPress={onToggleView} accessibilityLabel="Alternar visualização">
          <Ionicons name={isGridView ? 'list' : 'grid'} size={18} color={theme.text} />
          <Text style={styles.toggleTxt}>{isGridView ? 'Lista' : 'Grade'}</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por livro ou prateleira…"
          placeholderTextColor={theme.label}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Limpar busca">
            <Ionicons name="close-circle" size={18} color={theme.label} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      {hasBooks && (
        <View style={styles.filters}>
          <Pressable
            onPress={filterAll}
            style={[styles.chip, showAllBooks && styles.chipActive]}
            accessibilityState={{ selected: showAllBooks }}
          >
            <Text style={[styles.chipTxt, showAllBooks && styles.chipTxtActive]}>Todos</Text>
            <View style={[styles.badge, showAllBooks && styles.badgeActive]}>
              <Text style={styles.badgeTxt}>{counts.total}</Text>
            </View>
          </Pressable>

          {hasPrivateBooks && (
            <Pressable
              onPress={filterPrivate}
              style={[styles.chip, showPrivateBooks && styles.chipActive]}
              accessibilityState={{ selected: showPrivateBooks }}
            >
              <Text style={[styles.chipTxt, showPrivateBooks && styles.chipTxtActive]}>Privados</Text>
              <View style={[styles.badge, showPrivateBooks && styles.badgeActive]}>
                <Text style={styles.badgeTxt}>{counts.priv}</Text>
              </View>
            </Pressable>
          )}

          {hasLoanedBooks && (
            <Pressable
              onPress={filterLoaned}
              style={[styles.chip, showLoanedBooks && styles.chipActive]}
              accessibilityState={{ selected: showLoanedBooks }}
            >
              <Text style={[styles.chipTxt, showLoanedBooks && styles.chipTxtActive]}>Emprestados</Text>
              <View style={[styles.badge, showLoanedBooks && styles.badgeActive]}>
                <Text style={styles.badgeTxt}>{counts.loan}</Text>
              </View>
            </Pressable>
          )}
        </View>
      )}

      {/* Sem resultados para a busca */}
      {debouncedQuery.length > 0 && sections.length === 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <Text style={{ color: textMuted }}>
            Nenhum resultado para “{debouncedQuery}”. Tente outro termo.
          </Text>
        </View>
      )}

      {/* Empty state */}
      {!hasBooks && debouncedQuery.length === 0 && (
        <View style={styles.emptyWrap}>
          <Image
            source={require('../../../assets/emptyLibrary.jpg')}
            style={styles.emptyImg}
            resizeMode="contain"
          />
          <Text style={styles.emptyHello}>👋 Olá, {nome_completo}!</Text>
          <Text style={styles.emptyTitle}>📚 Sua biblioteca está vazia</Text>
          <Text style={styles.emptyMsg}>
            Toque em “+” para adicionar seus primeiros livros e começar sua estante dos sonhos.
          </Text>
          <Text style={styles.emptyMsg}>
            Conecte-se com amigos e descubra novas leituras juntos! 🌟
          </Text>
        </View>
      )}

      {/* Seções */}
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(s, i) => `${s.title}::${i}`}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        extraData={{ isGridView, showAllBooks, showPrivateBooks, showLoanedBooks, debouncedQuery }}
      />

      {/* Modal de notificações */}
      <Modal
        transparent
        visible={notificationModalVisible}
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Notificações</Text>
            <FlatList
              data={notifications}
              keyExtractor={(_, i) => `n-${i}`}
              renderItem={({ item }) => (
                <View style={styles.notifItem}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifMsg}>{item.message}</Text>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.closeTxt}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal do livro */}
      <ModalBook
        modalVisible={bookModalVisible}
        closeModal={() => setBookModalVisible(false)}
        selectedBook={selectedBook}
        onEdit={onEdit}
        onDelete={() => fetchBooks()}
      />
    </SafeAreaView>
  );
}

// ---------- Estilos dinâmicos por tema ----------
function mkStyles(t, onPrimary) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    topBar: {
      backgroundColor: t.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 12,
    },
    iconBtn: { padding: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
    hello: { flex: 1, textAlign: 'center', fontSize: 20, color: onPrimary, fontWeight: '600' },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#fff',
    },

    headerRow: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: { fontSize: 28, color: t.text, fontWeight: '800', flex: 1 },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: t.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.border,
    },
    toggleTxt: { color: t.text, fontWeight: '600' },

    searchWrap: {
      marginTop: 8,
      marginHorizontal: 16,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: t.text, paddingVertical: 0 },

    filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    chipActive: { backgroundColor: t.primary, borderColor: t.primary },
    chipTxt: { color: t.text, fontWeight: '600' },
    chipTxtActive: { color: '#111827' }, // mantém alto contraste sobre o amarelo

    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeActive: { backgroundColor: '#111827' }, // mantém contraste independente do tema
    badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

    listContent: { paddingBottom: 24 },

    section: { paddingHorizontal: 16, paddingTop: 14 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 10 },

    hList: { paddingRight: 8 },

    card: {
      width: 132,
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 10,
      marginRight: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      borderWidth: 1,
      borderColor: t.border,
    },
    cover: { width: '100%', height: 164, borderRadius: 10, marginBottom: 8, backgroundColor: '#EEE' },
    cardTitle: { fontSize: 12, fontWeight: '700', color: t.text },
    cardAuthor: { fontSize: 11, marginTop: 2 },

    row: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.border,
    },
    rowCover: { width: 60, height: 88, borderRadius: 8, backgroundColor: '#EEE' },
    rowTitle: { fontSize: 14, fontWeight: '800', color: t.text },
    rowAuthor: { fontSize: 12, marginTop: 2 },

    emptyWrap: { paddingHorizontal: 24, paddingTop: 30, alignItems: 'center' },
    emptyImg: { width: 200, height: 200, marginBottom: 10 },
    emptyHello: { fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 6, textAlign: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 6, textAlign: 'center' },
    emptyMsg: { fontSize: 14, color: t.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 4 },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },
    loadingText: { marginTop: 12, fontSize: 16, color: t.text, fontWeight: '600' },

    errorText: {
      color: '#B91C1C',
      textAlign: 'center',
      fontSize: 16,
      marginBottom: 12,
      paddingHorizontal: 24,
    },
    retryBtn: {
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 8,
      backgroundColor: t.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#EAB308',
    },
    retryTxt: { color: onPrimary, fontWeight: '700' },

    // Modal
    modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalCard: { width: '90%', backgroundColor: t.card, borderRadius: 20, padding: 20, elevation: 10, borderWidth: 1, borderColor: t.border },
    modalTitle: { fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 12, textAlign: 'center' },
    notifItem: { marginVertical: 8, padding: 14, backgroundColor: t.bg, borderRadius: 12, borderWidth: 1, borderColor: t.border },
    notifTitle: { fontWeight: '800', fontSize: 15, color: t.text, marginBottom: 4 },
    notifMsg: { fontSize: 13, color: t.textSecondary },
    closeBtn: { marginTop: 16, backgroundColor: t.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    closeTxt: { fontSize: 16, fontWeight: '800', color: onPrimary },
  });
}
