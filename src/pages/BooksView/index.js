import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RadioButton } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../../context/AuthContext.js';
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

const BooksView = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { timeStamp } = useContext(AuthContext);
  const { bookId } = route.params;

  const [bookDetails, setBookDetails] = useState(null);
  const [loanDetails, setLoanDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState('');
  const [isLearn, setIsLearn] = useState('não lido'); // string coerente com o resto
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const pendingLoans = useMemo(
    () => loanDetails.filter((loan) => loan.status === 'Pendente'),
    [loanDetails]
  );
  const isBookLoaned = pendingLoans.length > 0;

  const fetchBookDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/books/${bookId}/loans`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      setBookDetails(data.book);
      setLoanDetails(data.loans || []);

      const status = data.book?.status || 'não lido';
      setIsLearn(status);
      setCurrentPage(
        data.book?.currentPage !== undefined && data.book?.currentPage !== null
          ? String(data.book.currentPage)
          : ''
      );
    } catch (err) {
      setError('Falha ao carregar os detalhes do livro');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  // Recarrega ao focar e quando timestamp muda (alguém alterou algo em outra tela)
  useFocusEffect(
    React.useCallback(() => {
      fetchBookDetails();
      setShowFullDescription(false);
    }, [fetchBookDetails])
  );
  useEffect(() => {
    fetchBookDetails();
  }, [timeStamp, fetchBookDetails]);

  const handleUpdateProgress = useCallback(async () => {
    let parsedPage = parseInt(currentPage, 10);
    if (isLearn === 'lendo' && (isNaN(parsedPage) || parsedPage <= 0)) {
      alert('Por favor, insira um número válido para a página.');
      return;
    }

    let statusToSave = isLearn;
    let pageToSave = 0;
    if (isLearn === 'Lido') {
      statusToSave = 'Lido';
      pageToSave = parsedPage > 0 ? parsedPage : 0;
    } else if (isLearn === 'lendo') {
      statusToSave = 'lendo';
      pageToSave = parsedPage || 0;
    } else {
      statusToSave = 'não lido';
      pageToSave = 0;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPage: pageToSave, status: statusToSave }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar progresso');

      const updatedBook = await response.json();
      setBookDetails(updatedBook);
      alert('Progresso atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
      alert('Erro ao atualizar progresso.');
    }
  }, [bookId, currentPage, isLearn]);

  const handleLoanOrReturn = useCallback(() => {
    if (!bookDetails) return;
    if (isBookLoaned) {
      // mostrará modal para devolver
      const firstPending = pendingLoans[0];
      if (firstPending) {
        setSelectedLoanId(firstPending._id);
        setModalVisible(true);
      }
    } else {
      navigation.navigate('Loan', {
        bookId: bookDetails._id,
        title: bookDetails.title,
        imageUrl: bookDetails.image_url,
      });
    }
  }, [bookDetails, isBookLoaned, pendingLoans, navigation]);

  const handleReturn = useCallback(async () => {
    if (!selectedLoanId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/loans/${selectedLoanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Devolvido' }),
      });
      if (!response.ok) throw new Error('Erro ao registrar devolução');

      setLoanDetails((prev) =>
        prev.map((loan) =>
          loan._id === selectedLoanId ? { ...loan, status: 'Devolvido' } : loan
        )
      );
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      alert('Erro ao registrar devolução.');
    }
  }, [selectedLoanId]);

  const handleEditPress = useCallback(() => {
    if (!bookDetails) return;
    navigation.navigate('EditBooks', { bookId: bookDetails._id });
  }, [bookDetails, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animation3.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Carregando livro, aguarde…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.error }}>{error}</Text>
        <TouchableOpacity style={[styles.btn, styles.secondaryBtn, { marginTop: 12 }]} onPress={fetchBookDetails}>
          <Text style={styles.btnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!bookDetails) {
    return (
      <SafeAreaView style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text>Nenhum dado do livro.</Text>
      </SafeAreaView>
    );
  }

  const descriptionPreview =
    bookDetails.description
      ? bookDetails.description.length > 300
        ? `${bookDetails.description.substring(0, 300)}…`
        : bookDetails.description
      : 'Sem descrição disponível.';

  return (
    <SafeAreaView style={styles.root}>
      {/* AppBar */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Detalhes do Livro</Text>
          <TouchableOpacity onPress={handleEditPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="edit" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Card: capa + título/autor */}
        <View style={styles.card}>
          <Image
            source={
              bookDetails.image_url && String(bookDetails.image_url).trim()
                ? { uri: bookDetails.image_url }
                : require('../../../assets/noImageAvailable.jpg')
            }
            style={styles.bookImage}
          />
          <Text style={styles.bookTitle} numberOfLines={2}>{bookDetails.title}</Text>
          {!!bookDetails.author && (
            <Text style={styles.bookAuthor} numberOfLines={1}>{bookDetails.author}</Text>
          )}
          <View style={styles.metaRow}>
            {!!bookDetails.genre && (
              <View style={styles.chip}>
                <Icon name="category" size={14} color={COLORS.text} />
                <Text style={styles.chipText} numberOfLines={1}>{bookDetails.genre}</Text>
              </View>
            )}
            {!!bookDetails.publisher && (
              <View style={styles.chip}>
                <Icon name="apartment" size={14} color={COLORS.text} />
                <Text style={styles.chipText} numberOfLines={1}>{bookDetails.publisher}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card: descrição */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.bookDescription}>{showFullDescription ? bookDetails.description : descriptionPreview}</Text>
          {bookDetails.description && bookDetails.description.length > 300 && (
            <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>{showFullDescription ? 'Ver menos' : 'Ver mais'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Card: empréstimos pendentes */}
        {isBookLoaned && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Empréstimo (Pendente)</Text>
            {pendingLoans.map((loan) => (
              <View key={loan._id} style={styles.loanRow}>
                <Icon name="person" size={16} color={COLORS.textSecondary} />
                <Text style={styles.loanText}>Solicitante: {loan.borrowerName}</Text>
                <Text style={styles.loanText}>Empréstimo: {new Date(loan.loanDate).toLocaleDateString()}</Text>
                <Text style={styles.loanText}>Devolução: {new Date(loan.returnDate).toLocaleDateString()}</Text>
                <View style={styles.badgeWarn}>
                  <Text style={styles.badgeWarnTxt}>{loan.status}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.warnBtn, { marginTop: 8 }]}
                  onPress={() => { setSelectedLoanId(loan._id); setModalVisible(true); }}
                >
                  <Text style={styles.btnText}>Registrar devolução</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Card: status de leitura */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status de leitura</Text>
          <View style={styles.radioGroup}>
            {['Lido', 'lendo', 'não lido'].map((opt) => (
              <View key={opt} style={styles.radioItem}>
                <RadioButton
                  value={opt}
                  status={isLearn === opt ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setIsLearn(opt);
                    if (opt === 'não lido') setCurrentPage('');
                  }}
                />
                <Text style={styles.radioLabel}>{opt[0].toUpperCase() + opt.slice(1)}</Text>
              </View>
            ))}
          </View>

          {isLearn === 'lendo' && (
            <View style={{ marginTop: 6 }}>
              <TextInput
                style={styles.input}
                placeholder="Digite a página atual"
                keyboardType="numeric"
                value={currentPage}
                onChangeText={setCurrentPage}
              />
            </View>
          )}

          <TouchableOpacity style={[styles.btn, styles.secondaryBtn, { marginTop: 10 }]} onPress={handleUpdateProgress}>
            <Text style={styles.btnText}>Atualizar progresso</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB de ação primária (emprestar/devolução) */}
      <TouchableOpacity style={styles.fab} onPress={handleLoanOrReturn} activeOpacity={0.9}>
        <Icon name={isBookLoaned ? 'assignment-turned-in' : 'volunteer-activism'} size={22} color={COLORS.text} />
        <Text style={styles.fabText}>{isBookLoaned ? 'Devolução' : 'Emprestar'}</Text>
      </TouchableOpacity>

      {/* Modal Devolução */}
      <Modal
        transparent
        animationType="fade"
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar devolução?</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.btn, styles.secondaryBtn, { flex: 1 }]} onPress={handleReturn}>
                <Text style={styles.btnText}>Sim</Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity style={[styles.btn, styles.neutralBtn, { flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.neutralText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // AppBar
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

  // Capa e textos
  bookImage: {
    width: '60%',
    height: 280,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
    marginBottom: 12,
    resizeMode: 'cover',
  },
  bookTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  bookAuthor: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },

  metaRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 },
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
  chipText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },

  // Descrição
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  bookDescription: { fontSize: 14, color: COLORS.text, lineHeight: 22, textAlign: 'justify' },
  linkBtn: { marginTop: 6, alignSelf: 'center' },
  linkBtnText: { color: COLORS.secondary, fontWeight: '800' },

  // Empréstimo
  loanRow: { marginTop: 4 },
  loanText: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  badgeWarn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1D6',
    borderWidth: 1,
    borderColor: '#F6C87A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeWarnTxt: { color: '#8A5A00', fontWeight: '800', fontSize: 11 },

  // Leitura
  radioGroup: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 4 },
  radioLabel: { fontSize: 13, color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },

  // Botões
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  secondaryBtn: { backgroundColor: COLORS.secondary, borderWidth: 1, borderColor: '#3B79E6' },
  warnBtn: { backgroundColor: '#FF9800', borderWidth: 1, borderColor: '#E58D00' },
  neutralBtn: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  btnText: { color: '#fff', fontWeight: '800' },
  neutralText: { color: COLORS.text, fontWeight: '800' },

  // FAB principal
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: '#E9CC16',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 999,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: COLORS.text, fontWeight: '800' },

  // Loading
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500' },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '84%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 12 },
  modalRow: { flexDirection: 'row', marginTop: 6 },
});

export default BooksView;
