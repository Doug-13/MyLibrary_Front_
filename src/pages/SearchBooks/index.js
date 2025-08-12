import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

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

const PAGE_SIZE = 18;

const SearchBooks = () => {
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // limpa quando sai da tela
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setQuery('');
      setBooks([]);
      setPage(0);
      setHasMore(false);
      setError(null);
    });
    return unsubscribe;
  }, [navigation]);

  // ===== debounce do texto =====
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const toGBooksQuery = useCallback((raw) => {
    if (!raw) return '';
    const onlyDigits = raw.replace(/[^\dxX]/g, '');
    // se parece ISBN 10/13, use "isbn:"
    if (onlyDigits.length === 10 || onlyDigits.length === 13) {
      return `isbn:${onlyDigits}`;
    }
    return encodeURIComponent(raw);
  }, []);

  const fetchBooks = useCallback(
    async ({ reset = false } = {}) => {
      const q = toGBooksQuery(debounced || query);
      if (!q) return;

      setLoading(true);
      setError(null);

      try {
        const startIndex = reset ? 0 : page * PAGE_SIZE;
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=${PAGE_SIZE}&startIndex=${startIndex}`
        );
        const data = await res.json();

        const items = Array.isArray(data.items) ? data.items : [];
        setHasMore(startIndex + items.length < (data.totalItems || 0));

        if (reset) {
          setBooks(items);
          setPage(1);
        } else {
          setBooks((prev) => [...prev, ...items]);
          setPage((p) => p + 1);
        }
      } catch (e) {
        console.error('Erro ao buscar livros:', e);
        setError('Não foi possível buscar os livros.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debounced, query, page, toGBooksQuery]
  );

  // busca automática ao mudar o texto (debounced)
  useEffect(() => {
    if (!debounced) {
      setBooks([]);
      setHasMore(false);
      setPage(0);
      setError(null);
      return;
    }
    fetchBooks({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const onSubmit = () => {
    if (!query.trim()) return;
    fetchBooks({ reset: true });
  };

  const onRefresh = () => {
    if (!debounced) return;
    setRefreshing(true);
    fetchBooks({ reset: true });
  };

  const renderRatingStars = (rating) => {
    if (!rating) return null;
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <View style={styles.ratingContainer}>
        {Array.from({ length: full }).map((_, i) => (
          <Icon key={`f-${i}`} name="star" size={14} color="#FFD700" />
        ))}
        {half && <Icon name="star-half" size={14} color="#FFD700" />}
        {Array.from({ length: empty }).map((_, i) => (
          <Icon key={`e-${i}`} name="star-outline" size={14} color="#FFD700" />
        ))}
      </View>
    );
  };

  const BookCard = React.memo(({ item }) => {
    const info = item.volumeInfo || {};
    const thumb =
      info.imageLinks?.thumbnail ||
      info.imageLinks?.smallThumbnail ||
      null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AddBooks', { book: item })}
      >
        <Image
          source={thumb ? { uri: thumb } : require('../../../assets/noImageAvailable.jpg')}
          style={styles.cover}
        />
        <Text style={styles.title} numberOfLines={2}>
          {info.title || 'Título não disponível'}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {info.authors?.[0] || 'Autor não disponível'}
        </Text>
        {renderRatingStars(info.averageRating)}
      </TouchableOpacity>
    );
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.root}>
        {/* Header MD3 com voltar + busca */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="arrow-back" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Buscar Livros</Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={styles.searchWrap}>
            <Icon name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Digite o ISBN ou nome do livro"
              placeholderTextColor={COLORS.label}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={onSubmit}
              returnKeyType="search"
              autoCorrect={false}
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lista em grid (3 colunas) com paginação */}
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          renderItem={({ item }) => <BookCard item={item} />}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, paddingTop: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  {error ? error : 'Digite um termo ou ISBN para buscar.'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              {loading && <ActivityIndicator color={COLORS.secondary} />}
              {!loading && hasMore && (
                <TouchableOpacity
                  onPress={() => fetchBooks()}
                  style={[styles.moreBtn, styles.secondaryButton]}
                  activeOpacity={0.9}
                >
                  <Text style={styles.moreBtnText}>Carregar mais</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loading && hasMore) fetchBooks();
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          // Perf
          initialNumToRender={12}
          windowSize={7}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={40}
          removeClippedSubviews
        />

        {/* CTA manual */}
        {books.length > 0 && !loading && (
          <TouchableOpacity
            style={[styles.fab]}
            onPress={() => navigation.navigate('EditBooks')}
            activeOpacity={0.9}
          >
            <Icon name="library-add" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
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

  // Grid
  row: { justifyContent: 'space-between' },
  card: {
    flex: 1 / 3,
    marginHorizontal: 4,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    alignItems: 'center',
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cover: {
    width: 90,
    height: 135,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  title: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  author: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },

  ratingContainer: { flexDirection: 'row', marginTop: 4 },

  // Footer / Empty
  emptyWrap: { alignItems: 'center', marginTop: 32, paddingHorizontal: 24 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center' },

  moreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: '#3B79E6',
  },
  moreBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9CC16',
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

export default SearchBooks;
