import React, { useContext, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, Text, StyleSheet, FlatList, View, Image, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../../context/AuthContext.js';
import ModalBook from '../../components/Modal/index.js';
import { useIsFocused } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config/api.js';

export default function MainScreen() {
  // const { sendNotification } = useNotification();
  const navigation = useNavigation();
  const { user, nome_completo, primeiro_nome, userId, userProfilePicture, userMongoId, timeStamp, setTimeStamp } = useContext(AuthContext);
  const [originalSections, setOriginalSections] = useState([]); // Para manter todos os dados carregados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isGridView, setIsGridView] = useState(true);
  const [allSections, setAllSections] = useState([]); // Armazena todos os dados
  const [sections, setSections] = useState([]); // Armazena dados filtrados
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState([]);
  const [showPrivateBooks, setShowPrivateBooks] = useState(false);
  const [showLoanedBooks, setShowLoanedBooks] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(true);
  const [hasPrivateBooks, setHasPrivateBooks] = useState(false);
  const [hasLoanedBooks, setHasLoanedBooks] = useState(false);
  // ##########################################################################

  useFocusEffect(
    React.useCallback(() => {
      // Reaplica os filtros sempre que a tela for reexibida
      if (originalSections.length) {
        const updatedSections = applyFilters(originalSections);
        setSections(updatedSections);
        if (updatedSections.length === 0) {
          setError('Nenhum livro encontrado com os filtros aplicados.');
        } else {
          setError(null); // Remove a mensagem de erro se os filtros encontrgit statisarem resultados
        }
      }
    }, [originalSections, showPrivateBooks, showLoanedBooks, showAllBooks])
  );

   const fetchBooks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books/${userMongoId}/with-loans`);
      const data = await response.json();

      console.log('Dados recebidos:', data);
      const formattedSections = categorizeBooksByGenre(data);
      setOriginalSections(formattedSections); // Salva os dados originais
      setSections(formattedSections); // Exibe inicialmente todos os dados

      // Atualiza os estados para determinar quais botões mostrar
      const privateBooksExist = data.some(book => book.visibility === 'private');
      const loanedBooksExist = data.some(book =>
        book.loans && book.loans.some(loan => loan.status === 'Pendente')
      );


      setHasPrivateBooks(privateBooksExist);
      setHasLoanedBooks(loanedBooksExist);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books');
      setLoading(false);
    }
  };
  const toggleViewMode = () => {
    setIsGridView((prevMode) => !prevMode);
  };

  const openProfileModal = () => {
    navigation.navigate('Profile');
    // simulateNotifications();
    //setNotificationModalVisible(true); // Corrige para usar o estado correto
  };

  const closeModal = () => {
    setNotificationModalVisible(false); // Corrige para fechar o modal
  };

  useEffect(() => {
    if (isFocused) {
      fetchBooks();
    }
  }, [isFocused]);



  const categorizeBooksByGenre = (data) => {
    const readingBooks = data.filter(book => book.status === 'lendo');

    const readingSection = {
      title: 'Lendo',
      books: readingBooks.map(book => ({
        id: book._id,
        title: book.title,
        author: book.author,
        coverUrl: book.image_url,
        description: book.description,
        visibility: book.visibility,
        status: book.status,
        rating: book.rating,
        currentPage: book.currentPage, // Adicionado
        page_count: book.page_count,     // Adicionado
        loans: book.loans,
      })),
    };

    const categories = {};
    data.forEach((book) => {
      if (book.status !== 'lendo') {
        const genre = book.genre || 'Outros';
        if (!categories[genre]) {
          categories[genre] = { title: genre, books: [] };
        }
        categories[genre].books.push({
          id: book._id,
          title: book.title,
          author: book.author,
          coverUrl: book.image_url,
          description: book.description,
          visibility: book.visibility,
          status: book.status,
          rating: book.rating,
          currentPage: book.currentPage, // Adicionado
          page_count: book.page_count,     // Adicionado
          loans: book.loans,
        });
      }
    });

    const sortedSections = Object.values(categories).sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    return readingBooks.length > 0 ? [readingSection, ...sortedSections] : sortedSections;
  };

  useEffect(() => {
    // console.log('ModalBook Visible:', modalVisible);
  }, [modalVisible]);

  const handleBookPress = (book) => {
    // console.log('ID do livro selecionado:', book.id);
    if (book) {
      navigation.navigate('BooksView', { bookId: book.id });
    } else {
      console.error('Livro não encontrado');
    }
  };

  const renderRatingStars = (rating) => {
    if (!rating) return null; // Se não houver rating, não renderiza nada
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <View style={styles.ratingContainer}>
        {[...Array(fullStars)].map((_, index) => (
          <Icon key={`full-${index}`} name="star" size={16} color="#FFD700" />
        ))}
        {halfStar && <Icon key="half" name="star-half" size={16} color="#BDC3C7" />}
        {[...Array(emptyStars)].map((_, index) => (
          <Icon key={`empty-${index}`} name="star-outline" size={16} color="#FFD700" />
        ))}
      </View>
    );
  };

  const truncateTitle = (title, limit) => {
    return title.length > limit ? `${title.substring(0, limit)}...` : title;
  };

  const renderProgressBar = (currentPage, pageCount) => {
    if (!currentPage || !pageCount) return null;

    const progress = Math.min(currentPage / pageCount, 1); // Garante que não exceda 100%

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    );
  };

  const renderBookItem = ({ item }) => {
    const imageSource = item.coverUrl && item.coverUrl.trim() !== ""
      ? { uri: item.coverUrl }
      : require('../../../assets/noImageAvailable.jpg');

    // Calcula o percentual de leitura
    const percentageRead = item.currentPage && item.page_count
      ? Math.round((item.currentPage / item.page_count) * 100)
      : 0;

    // console.log("Livro", item.title, "Página Lendo", item.currentPage, "Página qtd", item.page_count, '- Percentage Read:', percentageRead);

    return isGridView ? (
      <TouchableOpacity style={styles.card} onPress={() => handleBookPress(item)}>
        <Image source={imageSource} style={styles.coverImage} />
        <Text style={styles.bookTitle}>{truncateTitle(item.title, 20)}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        {renderRatingStars(item.rating)}
        {/* Barra de progresso chamada aqui */}
        {item.status === 'lendo' && renderProgressBar(item.currentPage, item.page_count)}
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.bookListItem} onPress={() => handleBookPress(item)}>
        <Image source={imageSource} style={styles.bookCover} />
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{truncateTitle(item.title, 20)}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
          {renderRatingStars(item.rating)}
          {/* Barra de progresso chamada aqui */}
          {item.status === 'lendo' && renderProgressBar(item.currentPage, item.page_count)}
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
        keyExtractor={(book) => book.id} // Aqui você já está usando o key correto
        horizontal={isGridView}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  // const handleAddBook = () => {
  //   navigation.navigate('SearchBooks');
  // };

  // ##########################################################################
  const applyFilters = (data) => {
    return data
      .map((section) => {
        const filteredBooks = section.books.filter((book) => {
          if (showAllBooks) return true; // Exibir todos os livros

          if (showPrivateBooks && book.visibility === 'private') return true; // Livros privados

          if (showLoanedBooks && book.loans && book.loans.length > 0) {
            const lastLoan = book.loans[book.loans.length - 1];
            return lastLoan.status === 'Pendente'; // Apenas empréstimos pendentes
          }

          return false; // Exclui livros que não se enquadram nos filtros
        });

        return { ...section, books: filteredBooks };
      })
      .filter((section) => section.books.length > 0) // Remove seções vazias
      .sort((a, b) => {
        // Ordena colocando "Lendo" primeiro
        if (a.title === 'Lendo') return -1;
        if (b.title === 'Lendo') return 1;
        return a.title.localeCompare(b.title);
      });
  };


  useEffect(() => {
    // Reaplica os filtros quando a tela for reexibida
    const updatedSections = applyFilters(originalSections);
    setSections(updatedSections);
  }, [isFocused]);


  useEffect(() => {
    if (!hasLoanedBooks) {
      setShowAllBooks(true);
      setShowPrivateBooks(false);
      setShowLoanedBooks(false);
    }
  }, [hasLoanedBooks]);

  useEffect(() => {
    if (!hasPrivateBooks) {
      setShowAllBooks(true);
      setShowPrivateBooks(false);
      setShowLoanedBooks(false);
    }
  }, [hasPrivateBooks]);

  // Efeitos para atualizar a exibição com base nos filtros
  useEffect(() => {
    if (originalSections.length) {
      const updatedSections = applyFilters(originalSections);
      setSections(updatedSections);
      // Modificação: Não definir erro se não houver livros
      if (updatedSections.length === 0) {
        setError(null); // Não exibir mensagem de erro
      } else {
        setError(null); // Remove a mensagem de erro se os filtros encontrarem resultados
      }
    }
  }, [originalSections, showPrivateBooks, showLoanedBooks, showAllBooks]);

  // Carrega os livros ao focar na tela
  useEffect(() => {
    if (isFocused) {
      fetchBooks();
    }
  }, [isFocused]);

  // ##########################################################################
  const handlePrivateBooksFilter = () => {
    setShowAllBooks(false);
    setShowPrivateBooks(true);
    setShowLoanedBooks(false);
  };

  const handleAllBooksFilter = () => {
    setShowAllBooks(true);
    setShowPrivateBooks(false);
    setShowLoanedBooks(false);
  };

  const handleShowLoanedBooks = () => {
    setShowLoanedBooks(true);
    setShowPrivateBooks(false);
    setShowAllBooks(false);
  };
  useEffect(() => {
    // console.log('ModalBook Visible:', bookModalVisible);
  }, [bookModalVisible]);

  const handleEdit = (book) => {
    navigation.navigate('EditBooks', { selectedBook: book });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animation3.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Carregando sua biblioteca, aguarde...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerIcons}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <MaterialIcons name="menu" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.menuText}>Olá {primeiro_nome}</Text>
        <TouchableOpacity onPress={openProfileModal}>
          <Image
            source={
              userProfilePicture && userProfilePicture.trim() !== ""
                ? { uri: userProfilePicture }
                : require('../../../assets/perfilLendo.png')
            }
            style={styles.profileImage}
          />

        </TouchableOpacity>
        <Modal
          transparent={true}
          visible={notificationModalVisible}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Notificações</Text>
              <FlatList
                data={notifications}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <Text style={styles.header}>Minha Biblioteca</Text>
      {/* <TouchableOpacity style={styles.addButton} onPress={handleAddBook}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity> */}

      {/* Botões de filtro */}
      <View style={styles.filterContainer}>
        {/* O botão "Todos" sempre será exibido */}
        {sections.length > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, showAllBooks && styles.filterButtonActive]}
            onPress={handleAllBooksFilter}
          >
            <Text style={styles.filterText}>Todos</Text>
          </TouchableOpacity>
        )}
        {/* O botão "Privados" só aparece se houver livros privados */}
        {hasPrivateBooks && (
          <TouchableOpacity
            style={[styles.filterButton, showPrivateBooks && styles.filterButtonActive]}
            onPress={handlePrivateBooksFilter}
          >
            <Text style={styles.filterText}>Privados</Text>
          </TouchableOpacity>
        )}

        {/* O botão "Emprestados" só aparece se houver livros emprestados */}
        {hasLoanedBooks && (
          <TouchableOpacity
            style={[styles.filterButton, showLoanedBooks && styles.filterButtonActive]}
            onPress={handleShowLoanedBooks}
          >
            <Text style={styles.filterText}>Emprestados</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* ########################################################################## */}
      {sections.length === 0 && (
        <View style={styles.emptyLibraryContainer}>
          <Image
            source={require('../../../assets/emptyLibrary.jpg')}
            style={styles.emptyImage}
            resizeMode="contain"
          />

          <Text style={styles.welcomeText}>👋 Olá, {nome_completo}!</Text>

          <Text style={styles.emptyTitle}>
            📚 Sua biblioteca está vazia
          </Text>

          <Text style={styles.emptyMessage}>
            Mas isso é só o começo da sua jornada literária!
          </Text>

          <Text style={styles.emptyMessage}>
            ➕ Toque no botão "+" para adicionar seus primeiros livros e montar sua estante dos sonhos.
          </Text>

          <Text style={styles.emptyMessage}>
            🤝 Conecte-se com seus amigos, veja o que estão lendo e descubra novas histórias juntos! 🌟
          </Text>
        </View>
      )}




      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(section) => section.title}
        contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
        scrollIndicatorInsets={{ right: 1 }}
      />

      {/* Modal para exibir detalhes do livro */}
      <ModalBook
        modalVisible={bookModalVisible} // This prop is already correctly named
        closeModal={() => setBookModalVisible(false)}
        selectedBook={selectedBook}
        onEdit={(handleEdit)}
        onDelete={() => {
          // console.log('Livro deletado');
          fetchBooks(); // Refresh books after deletion
        }}
      />
    </SafeAreaView>


  );
}

const styles = StyleSheet.create({
  // Fundo escurecido do modal
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  // Contêiner do modal
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Título do modal
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
  },
  // Estilo para cada item de notificação
  notificationItem: {
    marginVertical: 8,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Título de cada notificação
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  // Mensagem de cada notificação
  notificationMessage: {
    fontSize: 14,
    color: '#666',
  },
  // Botão de fechar
  closeButton: {
    marginTop: 20,
    backgroundColor: '#f3d00f',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  // Texto do botão de fechar
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  // Outros estilos do aplicativo
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 32,
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  containerIcons: {
    backgroundColor: '#f3d00f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
    width: '100%',
  },
  menuText: {
    fontSize: 20,
  },
  menuIcon: {
    padding: 5,
    zIndex: 9999,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderColor: '#fff',
    borderWidth: 1,
  },
  addButton: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: '#f3d00f',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  addButtonText: {
    color: '#333',
    fontSize: 24,
  },
  sectionContainer: {
    marginBottom: 24,
    width: '100%',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  list: {
    paddingBottom: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    width: 130,
    alignItems: 'center',
  },
  coverImage: {
    width: 100,
    height: 150,
    borderRadius: 4,
    marginBottom: 8,
  },
  bookTitleStyle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  bookAuthorStyle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 3,
  },
  bookCover: {
    width: 50,
    height: 75,
    marginRight: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    width: '100%',
    paddingHorizontal: 16,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#6200ee',
    borderRadius: 5,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#f3d00f',
    borderColor: '#f3d00f',
  },
  filterText: {
    color: '#333',
    fontWeight: 'bold',
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  bookDetails: {
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 19,
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#76c7c0',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#333',
    position: 'absolute',
    left: '40%',
    top: -18,
  },
  emptyLibraryContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#effafc',
    borderRadius: 30,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
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
