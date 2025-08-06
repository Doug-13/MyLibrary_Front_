import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Pressable, Text, FlatList, Dimensions, Button } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { Card } from 'react-native-paper';
import { AuthContext } from '../../../context/AuthContext.js';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js'; 


const Statiscs = () => {
  const { userMongoId } = useContext(AuthContext);
  const navigation = useNavigation();

  const screenWidth = Dimensions.get("window").width;
  const [showAllBooksList, setShowAllBooksList] = useState(false);
  const [showLoanedBooksList, setShowLoanedBooksList] = useState(false);
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

  const generateRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/books/${userMongoId}/with-loans`
        );
        const data = await response.json();
        let totalBooks = 0, readBooks = 0, inProgressBooks = 0, unreadBooks = 0, loanedBooksCount = 0;
        const genres = {};
        const loanedBooksList = [];

        data.forEach((book) => {
          totalBooks++;
          if (book.status === "Lido") readBooks++;
          if (book.status === "em progresso") inProgressBooks++;
          if (book.status === "não lido") unreadBooks++;

          if (book.loans) {
            const allLoans = book.loans;
            const activeLoans = allLoans.filter((loan) => loan.status !== "Devolvido");
            const returnedLoans = allLoans.filter((loan) => loan.status === "Devolvido");

            loanedBooksCount += activeLoans.length;

            if (activeLoans.length > 0 || returnedLoans.length > 0) {
              loanedBooksList.push({ ...book, activeLoans, returnedLoans });
            }
          }

          genres[book.genre] = (genres[book.genre] || 0) + 1;
        });

        setBookStats({
          totalBooks,
          readBooks,
          inProgressBooks,
          unreadBooks,
          loanedBooks: loanedBooksCount,
          genres,
        });

        setAllBooks(data);
        setLoanedBooks(loanedBooksList);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, [userMongoId]);

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
    labels: ["Lidos", "Em Progresso", "Não Lidos"],
    datasets: [
      {
        data: [bookStats.readBooks, bookStats.inProgressBooks, bookStats.unreadBooks],
      },
    ],
  };

  const pieChartData = Object.keys(bookStats.genres).map((genre) => ({
    name: genre,
    books: bookStats.genres[genre],
    color: generateRandomColor(),
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  }));

  const handleLoanPress = (userMongoId) => {
    console.log('userMongoId:', userMongoId);
    navigation.navigate('LoanBooksList', { userMongoId });
  };

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Estatísticas de Livros</Text>

          {/* Card Total de Livros */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Total de Livros</Text>
            <Text style={styles.info}>
              Você possui um total de {bookStats.totalBooks} livros cadastrados.
            </Text>
            <Pressable
              style={[styles.actionButton, styles.toggleButton]}
              onPress={() => setShowAllBooksList(!showAllBooksList)}
            >
              <Text style={styles.actionButtonText}>
                {showAllBooksList ? "Ocultar Lista de Livros" : "Mostrar Lista de Livros"}
              </Text>
            </Pressable>
          </Card>

          {/* Card Livros Emprestados */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Livros Emprestados</Text>
            <Text style={styles.info}>
              Total de livros emprestados: {bookStats.loanedBooks}
            </Text>
            <Pressable
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleLoanPress(userMongoId)}
            >
              <Text style={styles.actionButtonText}>Lista de Livros Emprestados</Text>
            </Pressable>
          </Card>
        </>
      }
      data={
        showAllBooksList
          ? allBooks
          : showLoanedBooksList
            ? loanedBooks
            : []
      }
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookDetails}>Autor: {item.author}</Text>
          <Text style={styles.bookDetails}>Status: {item.status}</Text>

          {item.activeLoans && item.activeLoans.length > 0 && (
            <>
              <Text style={styles.bookDetails}>Empréstimos Pendentes:</Text>
              {item.activeLoans.map((loan, index) => (
                <View key={index} style={styles.loanItem}>
                  <Text style={styles.bookDetails}>Emprestado para {loan.borrowerName}</Text>
                  <Text style={styles.bookDetails}>Data de Empréstimo: {loan.loan_date}</Text>
                </View>
              ))}
            </>
          )}

          {item.returnedLoans && item.returnedLoans.length > 0 && (
            <>
              <Text style={styles.bookDetails}>Histórico de Empréstimos:</Text>
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
          {/* Card Status dos Livros */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Status dos Livros</Text>
            <BarChart
              data={barChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              style={styles.chart}
            />
          </Card>

          {/* Card Gêneros de Livros */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Gêneros de Livros</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
              }}
              accessor={"books"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </Card>
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    color: "#3F51B5",
  },
  card: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  info: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    color: "#333",
  },
  bookItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bookDetails: {
    fontSize: 14,
    color: "#555",
  },
  loanItem: {
    marginVertical: 5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#3F51B5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3F51B5",
    textAlign: "center",
    fontWeight: "500",
  },

  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  toggleButton: {
    backgroundColor: '#3F51B5',  // Amarelo para o botão de alternar
    marginTop: 10,
  },

  editButton: {
    backgroundColor: '#3F51B5',  // Azul para o botão de lista de livros emprestados
    marginTop: 10,
  },

  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3F51B5",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default Statiscs;
