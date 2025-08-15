import React, { useState, useContext, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  InteractionManager,
  SafeAreaView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import FastImage from 'react-native-fast-image';
import { useForm, Controller } from 'react-hook-form';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js';
import ImagePicker from 'react-native-image-crop-picker';
// ⬇️ Troca o Web SDK pelo pacote nativo:
import storage from '@react-native-firebase/storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ---------- Tema ----------
const PRIMARY = '#f3d00f';
const BG = '#F6F7FB';
const CARD = '#FFFFFF';
const TEXT = '#1F2937';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

// ---------- Subcomponentes ----------
const Chip = memo(({ label, selected, onPress, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected && styles.chipActive]}
    activeOpacity={0.9}
  >
    {icon ? <Ionicons name={icon} size={14} color={selected ? '#111827' : MUTED} style={{ marginRight: 6 }} /> : null}
    <Text style={[styles.chipTxt, selected && styles.chipTxtActive]}>{label}</Text>
  </TouchableOpacity>
));

const Section = ({ title, children, right }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
    {children}
  </View>
);

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const { userId, user, updateUser, setTimeStamp } = useContext(AuthContext);
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', phone: '' },
    mode: 'onChange',
  });

  // UI/estado
  const [foto_perfil, setfoto_perfil] = useState(null); // pode ser URL OU caminho local
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [aboutMe, setAboutMe] = useState('');
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [isWriter, setIsWriter] = useState(false);
  const [isReader, setIsReader] = useState(true);
  const [visibility, setVisibility] = useState('public');

  const mounted = useRef(true);

  const genres = ['Ficção', 'Não-ficção', 'Aventura', 'Romance', 'Mistério', 'Fantasia'];

  // ----------- Carregar dados -----------
  useEffect(() => {
    mounted.current = true;
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        const userData = response.data;

        setValue('name', userData.nome_completo || '');
        setValue('phone', userData.telefone || '');
        setAboutMe(userData.sobremim || '');
        setPreferredGenres(userData.generos_favoritos || []);
        setDateOfBirth(new Date(userData.data_nascimento || Date.now()));
        setfoto_perfil(userData.foto_perfil || null); // aqui vem a URL do Storage (se existir)
        setVisibility(userData.visibilidade_biblioteca || 'public');

        const role = userData.role || {};
        setIsReader(!!role.isReader ?? true);
        setIsWriter(!!role.isWriter ?? false);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar seu perfil.');
      } finally {
        if (mounted.current) setLoading(false);
      }
    });
    return () => {
      mounted.current = false;
      task.cancel?.();
    };
  }, [userId, setValue]);

  // ----------- Handlers -----------
  const handleImagePick = useCallback(() => {
    ImagePicker.openPicker({
      width: 600,
      height: 600,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
      mediaType: 'photo',
      includeBase64: false,
    })
      .then((image) => {
        // image.path => caminho local (ex.: file:///... ou content://...)
        setfoto_perfil(image.path);
      })
      .catch((error) => {
        if (error?.code !== 'E_PICKER_CANCELLED') {
          Alert.alert('Erro', 'Não foi possível selecionar a imagem');
        }
      });
  }, []);

  const toggleGenre = useCallback((genre) => {
    setPreferredGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  // ----------- Upload Helpers -----------
  const deleteOldPhotoIfNeeded = useCallback(async (oldUrl, newLocalPath) => {
    if (!oldUrl) return;
    // Se o usuário escolheu uma nova foto local diferente da URL antiga, apaga a antiga
    if (newLocalPath && newLocalPath !== oldUrl) {
      try {
        // Quando você salva a URL de download no banco, use refFromURL para deletar:
        await storage().refFromURL(oldUrl).delete();
      } catch {
        // Ignora se já não existir
      }
    }
  }, []);

  const uploadNewPhotoIfNeeded = useCallback(async (localPath, uid) => {
    if (!localPath) return null;

    // Se o valor já é uma URL http(s), é porque não mudou
    if (/^https?:\/\//i.test(localPath)) {
      return localPath;
    }

    // `putFile` aceita file:// e content:// (Android)
    let uploadUri = localPath;
    // iOS costuma precisar remover o prefixo file://
    if (Platform.OS === 'ios' && uploadUri.startsWith('file://')) {
      uploadUri = uploadUri.replace('file://', '');
    }

    const fileName = `${uid}-${Date.now()}.jpg`;
    const ref = storage().ref(`images/users/${fileName}`);

    // Faz upload direto do arquivo local
    await ref.putFile(uploadUri);

    // Pega URL pública
    const url = await ref.getDownloadURL();
    return url;
  }, []);

  // ----------- Submit -----------
  const onSubmit = useCallback(async (data) => {
    setIsSaving(true);

    try {
      // 1) Se havia foto antiga e o usuário escolheu outra, apaga a antiga
      await deleteOldPhotoIfNeeded(user?.foto_perfil, foto_perfil);

      // 2) Sobe a foto nova se for caminho local; se já for URL, mantém
      const image_url = await uploadNewPhotoIfNeeded(foto_perfil, userId);

      const userData = {
        nome_completo: (data.name || '').trim(),
        telefone: (data.phone || '').trim(),
        // Só atualiza o campo se tiver novo valor (ou mantém a antiga)
        foto_perfil: image_url ?? user?.foto_perfil ?? null,
        data_nascimento: dateOfBirth.toISOString(),
        sobremim: (aboutMe || '').trim(),
        generos_favoritos: preferredGenres,
        role: { isReader, isWriter },
        visibilidade_biblioteca: visibility,
      };

      await axios.patch(`${API_BASE_URL}/users/${userId}`, userData);

      updateUser(userData);
      setTimeStamp?.(new Date());
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      navigation.goBack();
    } catch (e) {
      console.log('[ProfileEdit] Erro ao salvar:', e?.message);
      Alert.alert('Erro', 'Houve um problema ao atualizar seus dados.');
    } finally {
      setIsSaving(false);
    }
  }, [
    aboutMe,
    dateOfBirth,
    foto_perfil,
    preferredGenres,
    isReader,
    isWriter,
    visibility,
    user?.foto_perfil,
    userId,
    updateUser,
    navigation,
    setTimeStamp,
    deleteOldPhotoIfNeeded,
    uploadNewPhotoIfNeeded,
  ]);

  // ----------- Loading -----------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animation2.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Carregando seu perfil, aguarde...</Text>
      </View>
    );
  }

  // ---------- UI ----------
  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} style={[styles.iconBtn, styles.saveBtn]} disabled={isSaving}>
          <Ionicons name="checkmark" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar + editar */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleImagePick} style={styles.avatarBtn}>
            <FastImage
              source={foto_perfil ? { uri: foto_perfil, priority: FastImage.priority.normal } : require('../../../assets/perfilLendo.png')}
              style={styles.avatar}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#111827" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Alterar foto</Text>
        </View>

        {/* Dados básicos */}
        <Section title="Informações básicas">
          <Controller
            control={control}
            name="name"
            rules={{ required: 'Informe seu nome completo' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome completo"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                style={styles.input}
                error={!!errors.name}
              />
            )}
          />
          {errors.name && <Text style={styles.errorTxt}>{errors.name.message}</Text>}

          <Controller
            control={control}
            name="phone"
            rules={{
              minLength: { value: 8, message: 'Telefone inválido' },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Telefone"
                mode="outlined"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                style={styles.input}
                error={!!errors.phone}
              />
            )}
          />
          {errors.phone && <Text style={styles.errorTxt}>{errors.phone.message}</Text>}

          {/* Data de nascimento */}
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn} activeOpacity={0.9}>
            <Ionicons name="calendar" size={16} color={MUTED} />
            <Text style={styles.dateTxt}>{dateOfBirth.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDateOfBirth(selectedDate);
              }}
            />
          )}
        </Section>

        {/* Sobre mim */}
        <Section title="Sobre mim">
          <TextInput
            label="Escreva um pouco sobre você"
            value={aboutMe}
            onChangeText={setAboutMe}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />
        </Section>

        {/* Gêneros favoritos */}
        <Section
          title="Gêneros favoritos"
          right={<Text style={styles.helpTxt}>Toque para selecionar</Text>}
        >
          <View style={styles.chipsWrap}>
            {genres.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={preferredGenres.includes(g)}
                onPress={() => toggleGenre(g)}
                icon="pricetag"
              />
            ))}
          </View>
        </Section>

        {/* Tipo de perfil */}
        <Section title="Tipo de perfil">
          <View style={styles.chipsWrap}>
            <Chip
              label="Leitor"
              selected={isReader}
              onPress={() => setIsReader((v) => !v)}
              icon="book"
            />
            <Chip
              label="Escritor"
              selected={isWriter}
              onPress={() => setIsWriter((v) => !v)}
              icon="pencil"
            />
          </View>
          <Text style={styles.helpTxt}>Você pode ser os dois 😉</Text>
        </Section>

        {/* Visibilidade da biblioteca */}
        <Section title="Visibilidade da biblioteca">
          <View style={styles.chipsWrap}>
            <Chip
              label="Pública"
              selected={visibility === 'public'}
              onPress={() => setVisibility('public')}
              icon="earth"
            />
            <Chip
              label="Somente amigos"
              selected={visibility === 'friends'}
              onPress={() => setVisibility('friends')}
              icon="people"
            />
            <Chip
              label="Privada"
              selected={visibility === 'private'}
              onPress={() => setVisibility('private')}
              icon="lock-closed"
            />
          </View>
        </Section>

        <Button
          mode="contained"
          style={styles.saveButton}
          buttonColor={PRIMARY}
          textColor="#111827"
          onPress={handleSubmit(onSubmit)}
          loading={isSaving}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Estilos ----------
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
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  saveBtn: { backgroundColor: '#FDE68A' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 18, color: TEXT, fontWeight: '800' },

  container: { padding: 16, paddingBottom: 28 },

  avatarWrap: { alignItems: 'center', marginBottom: 12 },
  avatarBtn: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEE', borderWidth: 2, borderColor: '#fff' },
  editBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: PRIMARY,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  changePhotoText: { marginTop: 8, color: MUTED, fontWeight: '600' },

  section: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT },
  helpTxt: { color: MUTED, fontSize: 12 },

  input: { marginTop: 8, backgroundColor: CARD },

  dateBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateTxt: { color: TEXT, fontWeight: '600' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTxt: { color: TEXT, fontWeight: '700' },
  chipTxtActive: { color: '#111827' },

  saveButton: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },

  errorTxt: { color: '#DC2626', marginTop: 6, fontSize: 12 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: TEXT,
    textAlign: 'center',
    fontWeight: '600',
  },
});
