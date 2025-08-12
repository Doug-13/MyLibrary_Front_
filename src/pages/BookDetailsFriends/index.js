import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext.js';
import { useNavigation } from '@react-navigation/native';
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

export default function BookDetailsFriends({ route }) {
  const navigation = useNavigation();
  const { book } = route.params || {};
  const { userMongoId } = useContext(AuthContext);

  const [loanRequested, setLoanRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const bookId = book?._id || book?.id;
  const backFriendId =
    route.params?.friendId || book?.friendId || book?.ownerId || null;

  const coverUri = useMemo(() => {
    const candidate =
      book?.coverUrl ||
      book?.coverURL ||
      book?.imageBook ||
      book?.image_url ||
      book?.cover ||
      book?.thumbnail ||
      book?.photo ||
      book?.photoURL ||
      book?.coverImageUrl ||
      '';
    return (candidate && String(candidate).trim()) || null;
  }, [book]);

  const imageSource = coverUri
    ? { uri: coverUri }
    : require('../../../assets/noImageAvailable.jpg');

  useEffect(() => {
    setLoanRequested(false);
    setIsRequesting(false);
    setIsExpanded(false);
  }, [bookId]);

  const handleLoanRequest = async () => {
    if (!backFriendId || !userMongoId || loanRequested || isRequesting) {
      Alert.alert('Aviso', 'Não é possível enviar a solicitação neste momento.');
      return;
    }
    setIsRequesting(true);
    try {
      const payload = {
        messageType: 'loanRequest',
        recipient_id: backFriendId,
        book_id: bookId,
        user_id: userMongoId,
        created_at: new Date().toISOString(),
      };
      const response = await axios.post(`${API_BASE_URL}/notifications`, payload);
      if (response.status === 201) {
        setLoanRequested(true);
        Alert.alert('Sucesso', 'Solicitação de empréstimo enviada com sucesso!');
      } else {
        throw new Error('Resposta inesperada do servidor.');
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      Alert.alert('Erro', 'Não foi possível enviar a solicitação. Tente novamente mais tarde.');
    } finally {
      setIsRequesting(false);
    }
  };

  const statusText = book?.status === 'available' ? 'Disponível' : 'Indisponível';
  const statusStyle = book?.status === 'available' ? styles.badgeSuccess : styles.badgeError;

  const descriptionText = book?.description || 'Sem descrição disponível.';
  const shortDesc =
    descriptionText.length > 160 ? `${descriptionText.slice(0, 160)}...` : descriptionText;

  return (
    <SafeAreaView style={styles.root}>
      {/* AppBar */}
      <View style={styles.appbar}>
        <TouchableOpacity
          onPress={() => {
            if (backFriendId) {
              navigation.navigate('FriendsProfile', { friendId: backFriendId });
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.appbarTitle} numberOfLines={1}>
          {book?.title || 'Detalhes'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Card Capa + título */}
        <View style={styles.card}>
          <Image source={imageSource} style={styles.cover} />
          <Text style={styles.title} numberOfLines={2}>
            {book?.title || 'Título não informado'}
          </Text>
          {!!book?.author && (
            <Text style={styles.subtitle} numberOfLines={1}>
              por {book.author}
            </Text>
          )}

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeNeutral]}>
              <Icon name="category" size={14} color={COLORS.text} />
              <Text style={styles.badgeTxt} numberOfLines={1}>
                {book?.genre || 'Gênero não informado'}
              </Text>
            </View>
            <View style={[styles.badge, statusStyle]}>
              <Icon
                name={book?.status === 'available' ? 'check-circle' : 'block'}
                size={14}
                color="#fff"
              />
              <Text style={[styles.badgeTxt, { color: '#fff' }]} numberOfLines={1}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.desc}>
            {isExpanded ? descriptionText : shortDesc}
          </Text>
          {descriptionText.length > 160 && (
            <Pressable onPress={() => setIsExpanded((v) => !v)}>
              <Text style={styles.readMore}>{isExpanded ? 'Ler menos' : 'Ler mais'}</Text>
            </Pressable>
          )}
        </View>

        {/* Empréstimos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Empréstimos</Text>
          <Text style={styles.infoText}>
            {Number.isFinite(book?.loans)
              ? `${book.loans} empréstimo${book.loans === 1 ? '' : 's'}`
              : 'Nenhum empréstimo registrado.'}
          </Text>
        </View>

        <View style={{ height: 84 }} />
      </ScrollView>

      {/* Barra inferior fixa */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (loanRequested || isRequesting) && styles.primaryBtnDisabled,
          ]}
          onPress={handleLoanRequest}
          disabled={loanRequested || isRequesting}
          activeOpacity={0.9}
        >
          {isRequesting ? (
            <Text style={styles.primaryBtnTxt}>Enviando…</Text>
          ) : loanRequested ? (
            <Text style={styles.primaryBtnTxt}>Solicitação enviada!</Text>
          ) : (
            <Text style={styles.primaryBtnTxt}>Me empresta?</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E68B',
  },
  appbarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: COLORS.text },

  scroll: { padding: 16 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  cover: { width: '60%', height: 280, borderRadius: 10, alignSelf: 'center', resizeMode: 'cover', backgroundColor: '#F1F5F9' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginTop: 10 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },

  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeNeutral: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: COLORS.border },
  badgeSuccess: { backgroundColor: '#28A745' },
  badgeError: { backgroundColor: '#DC3545' },
  badgeTxt: { fontSize: 12, color: COLORS.text, fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  readMore: { marginTop: 6, fontSize: 13, fontWeight: '700', color: COLORS.secondary },

  infoText: { fontSize: 14, color: COLORS.text },

  footerBar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9CC16',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnTxt: { fontWeight: '800', color: '#111827' },
});
