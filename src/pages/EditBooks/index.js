import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { RadioButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Se estiver usando Expo, descomente a linha abaixo e instale expo-image-picker
// import * as ImagePicker from 'expo-image-picker';

import { storage } from '../../firebase/firebase.config.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

import { AuthContext } from '../../../context/AuthContext.js';
import { API_BASE_URL } from '../../config/api.js';

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
};

const RADIUS = 12;
const ELEV = 2;

const EditBooks = ({ route }) => {
  const navigation = useNavigation();
  const { bookId } = route.params || {};
  const { userMongoId } = useContext(AuthContext);

  const { control, handleSubmit, setValue, reset } = useForm();
  const [isPublic, setIsPublic] = useState(true);
  const [isLearn, setIsLearn] = useState('não lido');

  const [image, setImage] = useState(null);
  const [isImageFromAPI, setIsImageFromAPI] = useState(false);

  const [bookDetails, setBookDetails] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [isOtherGenre, setIsOtherGenre] = useState(false);

  const [currentPage, setCurrentPage] = useState('');
  const [rating, setRating] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const initializeForm = useCallback(() => {
    reset();
    setImage(null);
    setIsImageFromAPI(false);
    setSelectedGenre('');
    setCustomGenre('');
    setIsOtherGenre(false);
    setCurrentPage('');
    setRating(0);
    setIsPublic(true);
    setIsLearn('não lido');
    setBookDetails(null);
  }, [reset]);

  const formatarData = (data) => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    setValue('publishedDate', formatarData(date));
    hideDatePicker();
  };

  // ========= Fetch único (evita duplicidade) =========
  const fetchBookDetails = useCallback(async () => {
    if (!bookId) return initializeForm();
    try {
      setIsLoading(true);
      const resp = await fetch(`${API_BASE_URL}/books/${bookId}/book`);
      const data = await resp.json();
      if (!resp.ok) throw new Error('Não foi possível obter os detalhes do livro');

      setBookDetails(data);

      setValue('title', data.title);
      setValue('author', data.author);
      setValue('publisher', data.publisher);
      setValue('publishedDate', data.publishedDate);
      setValue('description', data.description);
      setValue('page_count', data.page_count);
      setValue('genre', data.genre);
      setValue('visibility', data.visibility);
      setValue('rating', data.rating);
      setValue('status', data.status);
      setValue('currentPage', data.currentPage);

      setImage(data.image_url || null);
      setIsImageFromAPI(!!data.image_url);
      setSelectedGenre(data.genre || '');
      setIsPublic(data.visibility === 'public');
      setIsLearn(data.status || 'não lido');
      setRating(data.rating || 0);
      setCurrentPage(String(data.currentPage || ''));

    } catch (e) {
      console.error(e);
      Alert.alert('Erro', e.message || 'Erro ao buscar detalhes do livro.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, initializeForm, setValue]);

  useFocusEffect(
    React.useCallback(() => {
      fetchBookDetails();
      return () => {}; // cleanup opcional
    }, [fetchBookDetails])
  );

  // Gêneros do usuário
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/books/${userMongoId}/genres`);
        if (!response.ok) {
          if (isMounted) setGenres([]);
          return;
        }
        const data = await response.json();
        const list = (Array.isArray(data) ? data : []).filter(Boolean).sort((a, b) => a.localeCompare(b));
        if (isMounted) setGenres(list);
      } catch {
        if (isMounted) setGenres([]);
      }
    })();
    return () => { isMounted = false; };
  }, [userMongoId]);

  // ======= Image Picker (opcional) =======
  const handleImagePicker = async () => {
    Alert.alert(
      'Selecione uma opção',
      'Você quer tirar uma foto ou escolher da galeria?',
      [
        {
          text: 'Tirar Foto',
          onPress: async () => {
            // if (!ImagePicker) return Alert.alert('Câmera indisponível');
            // const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 5], quality: 1 });
            // if (!result.canceled) { setImage(result.assets[0].uri); setIsImageFromAPI(false); }
            Alert.alert('Dica', 'Ative o ImagePicker para usar a câmera.');
          },
        },
        {
          text: 'Escolher da Galeria',
          onPress: async () => {
            // if (!ImagePicker) return Alert.alert('Galeria indisponível');
            // const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 5], quality: 1 });
            // if (!result.canceled) { setImage(result.assets[0].uri); setIsImageFromAPI(false); }
            Alert.alert('Dica', 'Ative o ImagePicker para usar a galeria.');
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // ======= Save / Delete =======
  const handleSaveChanges = useCallback(async (data) => {
    setIsLoading(true);
    try {
      let image_url = '';

      if (image && !isImageFromAPI) {
        const response = await fetch(image);
        const blob = await response.blob();
        const imageRef = ref(storage, `images/books/${Date.now()}`);
        const snapshot = await uploadBytes(imageRef, blob);
        image_url = await getDownloadURL(snapshot.ref);
      } else if (isImageFromAPI) {
        image_url = image;
      }

      const payload = {
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        publishedDate: data.publishedDate,
        description: data.description,
        page_count: data.page_count,
        visibility: isPublic ? 'public' : 'private',
        image_url,
        owner_id: userMongoId,
        genre: isOtherGenre ? customGenre : (data.genre || selectedGenre),
        status: isLearn, // 'lido' | 'lendo' | 'não lido'
        currentPage: isLearn === 'lendo' ? currentPage : '',
        rating,
      };

      const url = bookId ? `${API_BASE_URL}/books/${bookId}` : `${API_BASE_URL}/books`;
      const method = bookId ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error(bookId ? 'Não foi possível atualizar o livro.' : 'Não foi possível criar o livro.');

      Alert.alert('Sucesso', bookId ? 'Livro atualizado com sucesso!' : 'Livro criado com sucesso!');
      navigation.goBack();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      Alert.alert('Erro', e.message || 'Erro ao salvar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId, image, isImageFromAPI, isPublic, isOtherGenre, customGenre, selectedGenre, isLearn, currentPage, rating, userMongoId, navigation]);

  const handleDeleteBook = useCallback(() => {
    if (!bookId) return;
    Alert.alert(
      'Confirmação',
      'Tem certeza de que deseja deletar este livro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              if (image) {
                try {
                  const imageRef = ref(storage, decodeURIComponent(image.split('/').slice(-1)[0]));
                  await deleteObject(imageRef);
                } catch (err) {
                  console.warn('Falha ao deletar imagem do Firebase:', err?.message);
                }
              }
              const resp = await fetch(`${API_BASE_URL}/books/${bookId}`, { method: 'DELETE' });
              if (!resp.ok) throw new Error('Não foi possível deletar o livro.');
              Alert.alert('Sucesso', 'Livro deletado com sucesso!');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Erro', e.message || 'Erro ao deletar o livro.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [bookId, image, navigation]);

  // ======= UI =======
  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <Text style={styles.label}>Avaliação do Livro</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Icon
              name={star <= rating ? 'star' : 'star-border'}
              size={28}
              color="#fdd835"
              style={{ marginRight: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{bookId ? 'Editar Livro' : 'Novo Livro'}</Text>
          <TouchableOpacity onPress={handleSubmit(handleSaveChanges)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="save" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Capa */}
          <View style={styles.card}>
            <View style={{ alignItems: 'center' }}>
              {image ? (
                <Image source={{ uri: image }} style={styles.bookImage} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>Imagem não disponível</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleImagePicker} style={styles.imagePicker}>
                <Icon name="photo-camera" size={20} color={COLORS.text} />
                <Text style={styles.imageText}> Nova Capa</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informações</Text>

            <Text style={styles.label}>Título</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Digite o título do livro"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Autor</Text>
            <Controller
              control={control}
              name="author"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Digite o autor do livro"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Editora</Text>
            <Controller
              control={control}
              name="publisher"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Digite a editora"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Número de páginas</Text>
            <Controller
              control={control}
              name="page_count"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Quantidade de páginas"
                  keyboardType="numeric"
                  value={value ? String(value) : ''}
                  onChangeText={onChange}
                />
              )}
            />

            <Text style={styles.label}>Gênero</Text>
            <Controller
              control={control}
              name="genre"
              render={({ field: { onChange } }) => (
                <View>
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={selectedGenre}
                      onValueChange={(v) => {
                        setSelectedGenre(v);
                        setIsOtherGenre(v === 'Outro');
                        if (v !== 'Outro') setCustomGenre('');
                        onChange(v);
                      }}
                      dropdownIconColor={COLORS.textSecondary}
                    >
                      {genres.map((g) => (
                        <Picker.Item key={g} label={g} value={g} />
                      ))}
                      <Picker.Item label="Outro" value="Outro" />
                    </Picker>
                  </View>

                  {isOtherGenre && (
                    <TextInput
                      style={styles.input}
                      placeholder="Especifique o gênero"
                      value={customGenre}
                      onChangeText={setCustomGenre}
                    />
                  )}
                </View>
              )}
            />

            <Text style={styles.label}>Data de publicação</Text>
            <Controller
              control={control}
              name="publishedDate"
              render={({ field: { value } }) => (
                <TouchableOpacity onPress={showDatePicker} activeOpacity={0.8}>
                  <TextInput
                    style={styles.input}
                    placeholder="Data de publicação"
                    value={value}
                    editable={false}
                  />
                </TouchableOpacity>
              )}
            />
            <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirm} onCancel={hideDatePicker} />

            <Text style={styles.label}>Descrição</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.textArea}
                  placeholder="Descrição"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={8}
                />
              )}
            />
          </View>

          {/* Opções */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Opções</Text>

            <Text style={styles.label}>Visibilidade</Text>
            <View style={styles.radioGroup}>
              <View style={styles.radioItem}>
                <RadioButton
                  value="public"
                  status={isPublic ? 'checked' : 'unchecked'}
                  onPress={() => setIsPublic(true)}
                />
                <Text style={styles.radioLabel}>Público</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton
                  value="private"
                  status={!isPublic ? 'checked' : 'unchecked'}
                  onPress={() => setIsPublic(false)}
                />
                <Text style={styles.radioLabel}>Privado</Text>
              </View>
            </View>

            <Text style={styles.label}>Status de leitura</Text>
            <View style={styles.radioGroup}>
              {['lido', 'lendo', 'não lido'].map((opt) => (
                <View key={opt} style={styles.radioItem}>
                  <RadioButton
                    value={opt}
                    status={isLearn === opt ? 'checked' : 'unchecked'}
                    onPress={() => setIsLearn(opt)}
                  />
                  <Text style={styles.radioLabel}>{opt[0].toUpperCase() + opt.slice(1)}</Text>
                </View>
              ))}
            </View>

            {isLearn === 'lendo' && (
              <View style={styles.pageInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Página atual"
                  keyboardType="numeric"
                  value={currentPage}
                  onChangeText={setCurrentPage}
                />
              </View>
            )}

            {renderRating()}
          </View>

          {/* Ações */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleSubmit(handleSaveChanges)} activeOpacity={0.9}>
              <Text style={styles.btnText}>Salvar alterações</Text>
            </TouchableOpacity>

            {!!bookId && (
              <TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={handleDeleteBook} activeOpacity={0.9}>
                <Text style={styles.btnTextLight}>Deletar livro</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      )}
    </SafeAreaView>
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
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },

  scroll: { padding: 16 },

  // Cards
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

  // Imagem
  bookImage: {
    width: 140,
    height: 210,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  placeholder: {
    width: 140, height: 210,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  placeholderText: { color: COLORS.textSecondary },
  imagePicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 1, borderColor: '#E9CC16',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12,
  },
  imageText: { color: COLORS.text, fontWeight: '800' },

  // Form
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Radios
  radioGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 },
  radioLabel: { fontSize: 13, color: COLORS.text },

  // Rating
  ratingContainer: { marginTop: 14 },
  stars: { flexDirection: 'row', marginTop: 6 },

  // Página atual
  pageInputContainer: { marginTop: 8 },

  // Ações
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtn: { backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: '#3B79E6' },
  dangerBtn: { backgroundColor: COLORS.error, borderWidth: 1, borderColor: '#B51F2D' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnTextLight: { color: '#fff', fontWeight: '800' },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EditBooks;
