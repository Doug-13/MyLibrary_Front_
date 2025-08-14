import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { ActivityIndicator } from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../../context/AuthContext.js';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
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

const AddBooks = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { book } = route.params || {};
  const { userMongoId, userId } = useContext(AuthContext);

  const { control, handleSubmit, getValues, setValue, reset } = useForm({ defaultValues: { genre: '' } });

  const [bookDetails, setBookDetails] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [isOtherGenre, setIsOtherGenre] = useState(false);

  const [isPublic, setIsPublic] = useState(false); // privado por padrão
  const [notifyFriends, setNotifyFriends] = useState(false);
  const [statusUi, setStatusUi] = useState('Não lido'); // 'Lido' | 'Lendo' | 'Não lido' (UI)
  const [rating, setRating] = useState(0);
  const [currentPage, setCurrentPage] = useState('');
  const [image, setImage] = useState('');
  const [isImageFromAPI, setIsImageFromAPI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Limpa ao sair
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      reset();
      setBookDetails(null);
      setImage('');
      setSelectedGenre('');
      setCustomGenre('');
      setIsOtherGenre(false);
      setIsPublic(false);
      setNotifyFriends(false);
      setStatusUi('Não lido');
      setRating(0);
      setCurrentPage('');
    });
    return unsub;
  }, [navigation, reset]);

  // Confirmação ao voltar (Android hardware)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Voltar', 'Deseja salvar as alterações antes de sair?', [
          { text: 'Não', style: 'cancel', onPress: () => navigation.goBack() },
          { text: 'Sim', onPress: handleSubmit(handleSaveChanges) },
        ]);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [navigation, handleSubmit]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Recebe o livro vindo do Google Books
  useEffect(() => {
    if (book?.volumeInfo) {
      setBookDetails(book);
      const thumb = book.volumeInfo.imageLinks?.thumbnail || '';
      setImage(thumb);
      setIsImageFromAPI(!!thumb);
    }
  }, [book]);

  // Gêneros (prateleiras) do usuário
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/books/${userMongoId}/genres`);
        if (res.ok) {
          const data = await res.json();
          const filtered = Array.isArray(data) ? data.filter(Boolean).sort((a, b) => a.localeCompare(b)) : [];
          setGenres(filtered);
        } else {
          setGenres([]);
          Alert.alert('Informação', 'Crie suas prateleiras para organizar seus livros.');
        }
      } catch {
        setGenres([]);
        Alert.alert('Informação', 'Crie suas prateleiras para organizar seus livros.');
      }
    };
    if (userId) fetchGenres();
  }, [userId, userMongoId]);

  // Helpers
  const normStatusForApi = (ui) => {
    if (ui === 'Lido') return 'Lido';
    if (ui === 'Lendo') return 'lendo';
    return 'não lido';
  };

  const numberOrZero = (val) => {
    const n = parseInt(String(val || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const title = getValues('title') || bookDetails?.volumeInfo?.title || '';
  const authors = getValues('author') || (bookDetails?.volumeInfo?.authors || []).join(', ');
  const publisher = getValues('publisher') || bookDetails?.volumeInfo?.publisher || '';
  const publishedDate = getValues('publishedDate') || bookDetails?.volumeInfo?.publishedDate || '';
  const description = getValues('description') || bookDetails?.volumeInfo?.description || '';
  const pageCount = getValues('page_count') || bookDetails?.volumeInfo?.pageCount || 0;
  const categories = bookDetails?.volumeInfo?.categories || [];

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      const genreToSave = selectedGenre === 'Outro' ? (customGenre || 'Outros') : (selectedGenre || 'Outros');
      const image_url = image || '';

      const payload = {
        title: title || 'Título Desconhecido',
        author: authors || 'Autor Desconhecido',
        isbn:
          bookDetails?.volumeInfo?.industryIdentifiers?.[0]?.identifier ||
          getValues('isbn') ||
          'N/A',
        publisher: publisher || 'Desconhecido',
        page_count: numberOrZero(pageCount),
        publishedDate: publishedDate || 'N/A',
        description: description || 'Sem descrição',
        image_url,
        visibility: isPublic ? 'public' : 'private',
        status: normStatusForApi(statusUi),
        rating: numberOrZero(rating),
        currentPage: statusUi === 'Lendo' ? numberOrZero(currentPage) : 0,
        owner_id: userMongoId,
        genre: genreToSave,
      };

      const res = await fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erro ao cadastrar o livro');

      const created = await res.json();

      // Notificação opcional
      if (notifyFriends && created?._id) {
        try {
          await axios.post(`${API_BASE_URL}/notifications`, {
            messageType: 'bookAdded',
            recipient_id: 'allFriends',
            book_id: created._id,
            user_id: userMongoId,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Falha ao notificar amigos:', err?.response?.data || err?.message);
        }
      }

      Alert.alert('Sucesso', 'Livro cadastrado com sucesso!');
      navigation.navigate('HomeTabs', { screen: 'HomeMainScreen', params: { newBookAdded: true } });
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível cadastrar o livro.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = () => handleSaveChanges();

  return (
    <SafeAreaView style={styles.root}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>Adicionar Livro</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="check" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Card: capa + meta */}
        <View style={styles.card}>
          {image ? (
            <Image source={{ uri: image }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: COLORS.label, fontWeight: '700' }}>Sem imagem</Text>
            </View>
          )}
          {!!title && <Text style={styles.title} numberOfLines={2}>{title}</Text>}
          {!!authors && <Text style={styles.subtitle} numberOfLines={1}>{authors}</Text>}
          <View style={styles.metaRow}>
            {!!publisher && (
              <View style={styles.chip}>
                <Icon name="apartment" size={14} color={COLORS.text} />
                <Text style={styles.chipTxt} numberOfLines={1}>{publisher}</Text>
              </View>
            )}
            {!!publishedDate && (
              <View style={styles.chip}>
                <Icon name="event" size={14} color={COLORS.text} />
                <Text style={styles.chipTxt}>{publishedDate}</Text>
              </View>
            )}
            {pageCount ? (
              <View style={styles.chip}>
                <Icon name="menu-book" size={14} color={COLORS.text} />
                <Text style={styles.chipTxt}>{pageCount} págs</Text>
              </View>
            ) : null}
          </View>
          {categories?.length > 0 && (
            <Text style={styles.smallMuted}>Categorias: {categories.join(', ')}</Text>
          )}
          {!!description && (
            <Text style={styles.desc} numberOfLines={6}>{description}</Text>
          )}
        </View>

        {/* Card: prateleira */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Prateleira</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'O que é a Prateleira?',
                  'Organize seus livros como quiser: favoritos, por autor, gênero ou qualquer outro critério.'
                )
              }
            >
              <Icon name="help-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="genre"
            render={({ field: { onChange } }) => (
              <>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={selectedGenre}
                    onValueChange={(val) => {
                      setSelectedGenre(val);
                      onChange(val);
                      const isOutro = val === 'Outro';
                      setIsOtherGenre(isOutro);
                      if (!isOutro) setCustomGenre('');
                    }}
                  >
                    <Picker.Item label="Selecione ou crie uma prateleira" value="" />
                    {genres.map((g) => (
                      <Picker.Item key={g} label={g} value={g} />
                    ))}
                    <Picker.Item label="Outro" value="Outro" />
                  </Picker>
                </View>

                {isOtherGenre && (
                  <TextInput
                    style={styles.input}
                    placeholder="Nome da nova prateleira"
                    value={customGenre}
                    onChangeText={(t) => {
                      setCustomGenre(t);
                      onChange(t);
                    }}
                    placeholderTextColor={COLORS.label}
                  />
                )}
              </>
            )}
          />
        </View>

        {/* Card: visibilidade e notificação */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Opções</Text>

          <Text style={styles.label}>Deixar visível?</Text>
          <View style={styles.radioRow}>
            <RadioButton
              value="public"
              status={isPublic ? 'checked' : 'unchecked'}
              onPress={() => setIsPublic(true)}
            />
            <Text style={styles.radioTxt}>Público</Text>

            <View style={{ width: 18 }} />
            <RadioButton
              value="private"
              status={!isPublic ? 'checked' : 'unchecked'}
              onPress={() => setIsPublic(false)}
            />
            <Text style={styles.radioTxt}>Privado</Text>
          </View>

          <Text style={[styles.label, { marginTop: 10 }]}>Notificar amigos?</Text>
          <View style={styles.radioRow}>
            <RadioButton
              value="yes"
              status={notifyFriends ? 'checked' : 'unchecked'}
              onPress={() => setNotifyFriends(true)}
            />
            <Text style={styles.radioTxt}>Sim</Text>

            <View style={{ width: 18 }} />
            <RadioButton
              value="no"
              status={!notifyFriends ? 'checked' : 'unchecked'}
              onPress={() => setNotifyFriends(false)}
            />
            <Text style={styles.radioTxt}>Não</Text>
          </View>
        </View>

        {/* Card: status, página e rating */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Leitura</Text>

          <View style={styles.radioRowWrap}>
            {['Lido', 'Lendo', 'Não lido'].map((opt) => (
              <TouchableOpacity key={opt} style={styles.radioItem} onPress={() => {
                setStatusUi(opt);
                if (opt === 'Não lido') setCurrentPage('');
              }}>
                <RadioButton value={opt} status={statusUi === opt ? 'checked' : 'unchecked'} />
                <Text style={styles.radioTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {statusUi === 'Lendo' && (
            <TextInput
              style={[styles.input, { marginTop: 6 }]}
              placeholder="Página atual"
              keyboardType="numeric"
              value={currentPage}
              onChangeText={setCurrentPage}
              placeholderTextColor={COLORS.label}
            />
          )}

          <Text style={[styles.label, { marginTop: 10 }]}>Avaliação</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Icon name={star <= rating ? 'star' : 'star-border'} size={28} color="#fdd835" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.btnTxt}>Adicionar Livro</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>Salvando…</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // AppBar
  appbar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E68B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appbarTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },

  scroll: { padding: 16 },

  // Card base
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  // Capa + meta
  cover: {
    width: 140,
    height: 210,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipTxt: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  smallMuted: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  desc: { marginTop: 10, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'justify' },

  // Seções
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },

  // Radios
  radioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  radioRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioItem: { flexDirection: 'row', alignItems: 'center' },
  radioTxt: { color: COLORS.text },

  // Stars
  stars: { flexDirection: 'row', gap: 4, marginTop: 6 },

  // Botões
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtn: { backgroundColor: COLORS.primary, borderWidth: 1, borderColor: '#E9CC16' },
  btnTxt: { color: COLORS.text, fontWeight: '800' },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
});

export default AddBooks;
