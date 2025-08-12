import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  FlatList,
  Dimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { Card } from 'react-native-paper';
import { AuthContext } from '../../../context/AuthContext.js';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  success: '#28A745',
};

const RADIUS = 12;
const ELEV = 2;

const Statiscs = () => {
  const { userMongoId } = useContext(AuthContext);
  const navigation = useNavigation();

  const screenWidth = Dimensions.get('window').width;
  const [showAllBooksList, setShowAllBooksList] = useState(false);
  const [showLoanedBooksList, setShowLoanedBooksList] = useState(false); // (mantido para compatibilidade)
  const [allBooks, setAllBooks] = useState([]);
  const [loanedBooks, setLoanedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookStats, setBookStats] = useState({
    totalBooks: 0,
    readBooks: 0,
    inProgressBooks: 0,
    unreadBooks: 0,
    loanedBooks: 0,
    genres: {},
  });

  // Paleta rotativa para o gráfico de pizza (mais estável que random puro)
  const genreColors = ['#4E8CFF', '#28A745', '#FF9800', '#9C27B0', '#00BFA6', '#FF5252', '#795548', '#607D8B'];
  const colorForIndex = (i) => genreColors[i % genreColors.length];

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books/${userMongoId}/with-loans`);
      const data = await response.json();

      let totalBooks = 0,
        readBooks = 0,
        inProgressBooks = 0,
        unreadBooks = 0,
        loanedBooksCount = 0;

      const genres = {};
      const loanedBooksList = [];

      (Array.isArray(data) ? data : []).forEach((book) => {
        totalBooks++;
        if (book.status === 'Lido') readBooks++;
        if (book.status === 'em progresso') inProgressBooks++;
        if (book.status === 'não lido') unreadBooks++;

        if (book.loans) {
          const allLoans = book.loans;
          const activeLoans = allLoans.filter((loan) => loan.status !== 'Devolvido');
          const returnedLoans = allLoans.filter((loan) => loan.status === 'Devolvido');

          loanedBooksCount += activeLoans.length;

          if (activeLoans.length > 0 || returnedLoans.length > 0) {
            loanedBooksList.push({ ...book, activeLoans, returnedLoans });
          }
        }

        const g = book.genre || 'Sem gênero';
        genres[g] = (genres[g] || 0) + 1;
      });

      setBookStats({
        totalBooks,
        readBooks,
        inProgressBooks,
        unreadBooks,
        loanedBooks: loanedBooksCount,
        genres,
      });

      setAllBooks(Array.isArray(data) ? data : []);
      setLoanedBooks(loanedBooksList);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setAllBooks([]);
      setLoanedBooks([]);
      setBookStats({
        totalBooks: 0,
        readBooks: 0,
        inProgressBooks: 0,
        unreadBooks: 0,
        loanedBooks: 0,
        genres: {},
      });
    } finally {
      setLoading(false);
    }
  }, [userMongoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animation2.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Carregando estatísticas, aguarde...</Text>
      </View>
    );
  }

  const barChartData = {
    labels: ['Lidos', 'Em Progresso', 'Não Lidos'],
    datasets: [{ data: [bookStats.readBooks, bookStats.inProgressBooks, bookStats.unreadBooks] }],
  };

  const pieChartData = Object.keys(bookStats.genres).map((genre, idx) => ({
    name: genre,
    books: bookStats.genres[genre],
    color: colorForIndex(idx),
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 13,
  }));

  const handleLoanPress = (userMongoId) => {
    navigation.navigate('LoanBooksList', { userMongoId });
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      ListHeaderComponent={
        <>
          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <Icon
                name="arrow-back"
                size={26}
                color={COLORS.text}
                onPress={() => navigation.goBack()}
              />
              <Text style={styles.heroTitle}>Estatísticas de Livros</Text>
              <View style={{ width: 26 }} />
            </View>
            <Text style={styles.heroSubtitle}>
              Visão geral do seu acervo, progresso e empréstimos.
            </Text>
          </View>

          {/* Total de livros */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Total de Livros</Text>
            <Text style={styles.info}>
              Você possui um total de <Text style={styles.infoStrong}>{bookStats.totalBooks}</Text> livros cadastrados.
            </Text>

            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => setShowAllBooksList((s) => !s)}
            >
              <Text style={styles.actionButtonText}>
                {showAllBooksList ? 'Ocultar Lista de Livros' : 'Mostrar Lista de Livros'}
              </Text>
            </Pressable>
          </Card>

          {/* Livros emprestados */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Livros Emprestados</Text>
            <Text style={styles.info}>
              Total de livros emprestados: <Text style={styles.infoStrong}>{bookStats.loanedBooks}</Text>
            </Text>

            <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={() => handleLoanPress(userMongoId)}>
              <Text style={styles.actionButtonText}>Lista de Livros Emprestados</Text>
            </Pressable>
          </Card>
        </>
      }
      data={showAllBooksList ? allBooks : showLoanedBooksList ? loanedBooks : []}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookDetails} numberOfLines={1}>Autor: {item.author}</Text>
          <Text style={styles.bookDetails}>Status: {item.status}</Text>

          {!!item.activeLoans?.length && (
            <>
              <Text style={[styles.sectionLabel, styles.pendingLabel]}>Empréstimos Pendentes</Text>
              {item.activeLoans.map((loan, index) => (
                <View key={index} style={styles.loanItem}>
                  <Text style={styles.bookDetails}>Emprestado para {loan.borrowerName}</Text>
                  <Text style={styles.bookDetails}>Data de Empréstimo: {loan.loan_date}</Text>
                </View>
              ))}
            </>
          )}

          {!!item.returnedLoans?.length && (
            <>
              <Text style={[styles.sectionLabel, styles.historyLabel]}>Histórico de Empréstimos</Text>
              {item.returnedLoans.map((loan, index) => (
                <View key={index} style={styles.loanItem}>
                  <Text style={styles.bookDetails}>Emprestado para {loan.borrowerName}</Text>
                  <Text style={styles.bookDetails}>Data de Empréstimo: {loan.loan_date}</Text>
                  <Text style={styles.bookDetails}>Data de Devolução: {loan.return_date}</Text>
                </View>
              ))}
            </>
          )}
        </Card>
      )}
      ListFooterComponent={
        <>
          {/* Status dos livros */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Status dos Livros</Text>
            <BarChart
              data={barChartData}
              width={screenWidth - 32}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              withInnerLines={false}
              chartConfig={{
                backgroundColor: COLORS.card,
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(78, 140, 255, ${opacity})`, // secundária
                labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                barPercentage: 0.6,
              }}
              style={styles.chart}
            />
          </Card>

          {/* Gêneros */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Gêneros de Livros</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 32}
              height={240}
              chartConfig={{
                color: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
              }}
              accessor={'books'}
              backgroundColor={'transparent'}
              paddingLeft={'8'}
              absolute
            />
          </Card>

          <View style={{ height: 24 }} />
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  // Layout / hero
  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E68B',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Cards base (MD3)
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  infoStrong: {
    color: COLORS.text,
    fontWeight: '800',
  },

  // Botões
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: '#E9CC16',
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: '#3B79E6',
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.text, // contraste melhor no primário
    fontWeight: '800',
  },

  // Itens de livro
  bookTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  bookDetails: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  sectionLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '800',
  },
  pendingLabel: {
    color: COLORS.error,
  },
  historyLabel: {
    color: COLORS.text,
  },
  loanItem: {
    marginTop: 6,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.secondary,
  },

  // Gráficos
  chart: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default Statiscs;
