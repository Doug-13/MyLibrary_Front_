import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, FlatList, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import ModalBook from '../../components/Modal/index.js';
import { useIsFocused } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js';  

export default function FriendsProfile({ route }) {
  const navigation = useNavigation();
  const { userMongoId, setTimeStamp } = useContext(AuthContext);
  const [friendData, setFriendData] = useState(null);
  const [originalSections, setOriginalSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isGridView, setIsGridView] = useState(true);
  const [sections, setSections] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const isFocused = useIsFocused();
  const [isFollowedBack, setIsFollowedBack] = useState(false);

  const { friendId } = route.params;

  const fetchFriendData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${friendId}/friends`);
      const data = await response.json();
      setFriendData(data.user);


      // Fetch follow status
      const followStatusResponse = await fetch(`${API_BASE_URL}/connections/${userMongoId}/follow-status/${friendId}`);
      const followStatusData = await followStatusResponse.json();

      if (followStatusData) {
        setIsFollowing(followStatusData.isFollowing);
        setIsFollowedBack(followStatusData.isFollowedBack);

        // Verifica se ambos são amigos (seguindo de volta)
        if (followStatusData.isFollowing && followStatusData.isFollowedBack) {
          console.log('Os usuários são amigos!');
        } else {
          console.log('Os usuários não são amigos.');
        }
      } else {
        console.log('Dados de followStatus não encontrados.');
      }

      // Categorizes books by genre
      const formattedSections = categorizeBooksByGenre(data.books);
      setSections(formattedSections);
      setTimeStamp(new Date())
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar informações.');
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    setTimeStamp(new Date())
    if (isFollowing) {
      // Deixar de seguir
      await handleDeixarDeSeguir(userMongoId, friendId);

      setIsFollowing(false);
    } else {
      // Seguir
      await handleAdicionarAmizade(userMongoId, friendId);
      setIsFollowing(true);
    }
  };

  const handleAdicionarAmizade = async (followerId, followingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: followerId, following: followingId }),
      });

      if (response.ok) {
        console.log('Agora você está seguindo este amigo.');
        fetchFriendData(); // Atualiza os dados do amigo
      } else {
        alert('Erro ao seguir usuário');
      }
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    }
  };

  const handleDeixarDeSeguir = async (followerId, followingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${followerId}/${followingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Você deixou de seguir este amigo.');
        fetchFriendData(); // Atualiza os dados do amigo
      } else {
        alert('Erro ao deixar de seguir');
      }
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
    }
  };


  const categorizeBooksByGenre = (data) => {
    const categories = {};

    // Filtra apenas os livros com visibilidade pública
    const publicBooks = data.filter(book => book.visibility === "public");

    publicBooks.forEach((book) => {
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
        loans: book.loans,
      });
    });

    return Object.values(categories);
  };
  const handleBookPress = (book) => {
    console.log('id:', friendId);
    navigation.navigate('BookDetailsFriends', { book: { ...book, friendId } });
  };


  useEffect(() => {
    if (isFocused) {
      fetchFriendData();
    }
  }, [isFocused]);

  const renderBookItem = ({ item }) => {
    // Apenas renderiza o livro se a visibilidade for 'public'
    if (item.visibility !== 'public') {
      return null;
    }

    const imageSource = item.coverUrl && item.coverUrl.trim() !== ""
      ? { uri: item.coverUrl }
      : require('../../../assets/noImageAvailable.jpg');

    return isGridView ? (

      <TouchableOpacity style={styles.card} onPress={() => handleBookPress(item)}>
        <Image source={imageSource} style={styles.coverImage} />
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.bookListItem} onPress={() => handleBookPress(item)}>
        <Image source={imageSource} style={styles.bookCover} />
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
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
        keyExtractor={(book) => book.id}
        horizontal={isGridView}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
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
        <Text style={styles.loadingText}>Carregando estatísticas, aguarde...</Text>
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
  if (!friendData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="24" color="#f3d00f" />
        <Text>Carregando dados do usuário...</Text>
      </View>
    );
  }


  return (

    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        <Image
          source={friendData?.photos
            ? { uri: friendData.photos }
            : require('../../../assets/perfilLendo.png')}
          style={styles.profileImageLarge}
        />
        <Text style={styles.userName}>{friendData?.name || 'Amigo'}</Text>
        <Text style={styles.userBio}>{friendData?.bio || 'Sem informações.'}</Text>
        <TouchableOpacity
          style={[styles.followButton, isFollowing ? styles.unfollowButton : styles.followButton]}
          onPress={toggleFollow}
        >
          <Text style={styles.followButtonText}>
            {isFollowing
              ? 'Seguindo'
              : (!isFollowing && !isFollowedBack ? 'Seguir' : 'Seguir de volta')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lógica de visibilidade */}
      {friendData?.visibility === 'public' && (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(section) => section.title}
          contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      {friendData?.visibility === 'private' && (
        <View style={styles.privateProfileMessage}>
          <Text style={styles.privateProfileText}>Este perfil é privado. Não é possível visualizar os livros.</Text>
        </View>
      )}

      {friendData?.visibility === 'friends' && isFollowing && isFollowedBack && (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(section) => section.title}
          contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      {friendData?.visibility === 'friends' && (!isFollowing || !isFollowedBack) && (
        <View style={styles.privateProfileMessage}>
          <Text style={styles.privateProfileText}>
            Ele não é seu amigo, então para de estalquear. Não é possível visualizar os livros.
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  profileContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userBio: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    margin: 10
  },
  followButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  unfollowButton: {
    backgroundColor: '#f44336',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: 130,
    alignItems: 'center',
  },
  coverImage: {
    width: 100,
    height: 150,
    resizeMode: 'cover',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
  },
  privateProfileMessage: {
    padding: 16,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    margin: 16,
  },
  privateProfileText: {
    fontSize: 16,
    color: '#721c24',
    textAlign: 'center',
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
