import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import 'react-native-reanimated';

const SearchBooks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [isbn, setIsbn] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setSearchQuery('');
      setIsbn('');
      setBooks([]);
    });

    return unsubscribe;
  }, [navigation]);

  const fetchBooks = async (query = '') => {
    try {
      const searchValue = query || (isbn ? isbn : searchQuery.trim());
      if (!searchValue) {
        Alert.alert('Erro', 'Por favor, insira um ISBN ou texto para buscar.');
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchValue)}&maxResults=15`
      );
      const data = await response.json();

      if (data.items) {
        setBooks(data.items);
      } else {
        Alert.alert('Nenhum livro encontrado.');
        setBooks([]);
      }
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
      Alert.alert('Erro', 'Não foi possível buscar os livros.');
    }
  };

  const renderRatingStars = (rating) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <View style={styles.ratingContainer}>
        {[...Array(fullStars)].map((_, index) => (
          <Icon key={`full-${index}`} name="star" size={16} color="#FFD700" />
        ))}
        {halfStar && <Icon key="half" name="star-half" size={16} color="#FFD700" />}
        {[...Array(emptyStars)].map((_, index) => (
          <Icon key={`empty-${index}`} name="star-outline" size={16} color="#FFD700" />
        ))}
      </View>
    );
  };

  const handleBookSelect = (book) => {
    navigation.navigate('AddBooks', { book });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Buscar Livros</Text>

      <View style={styles.inputContainerBoxIsbn}>
        <View style={styles.inputContainerIsbn}>
          <TextInput
            style={styles.input}
            placeholder="Digite o ISBN ou nome do livro"
            value={isbn || searchQuery}
            onChangeText={(text) => {
              setIsbn('');
              setSearchQuery(text);
            }}
          />
        </View>
        <TouchableOpacity
          style={[styles.buttonBase, styles.searchButton]}
          onPress={() => fetchBooks()}
        >
          <Text style={[styles.buttonTextBase, styles.searchButtonText]}>Buscar Livro</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.booksContainer}>
        {books.map((book, index) => (
          <TouchableOpacity
            key={book.id}
            style={[styles.bookItem, index % 3 === 0 && { marginLeft: 0 }]}
            onPress={() => handleBookSelect(book)}
          >
            <Image
              source={book.volumeInfo.imageLinks?.thumbnail
                ? { uri: book.volumeInfo.imageLinks.thumbnail }
                : require('../../../assets/noImageAvailable.jpg')}
              style={styles.bookImage}
            />
            <Text style={styles.bookTitle}>
              {book.volumeInfo.title?.length > 10
                ? `${book.volumeInfo.title.substring(0, 10)}...`
                : book.volumeInfo.title || 'Título não disponível'}
            </Text>

            <Text style={styles.bookAuthors}>
              {book.volumeInfo.authors?.[0]?.length > 10
                ? `${book.volumeInfo.authors[0].substring(0, 10)}...`
                : book.volumeInfo.authors?.[0] || 'Autor não disponível'}
            </Text>
            {renderRatingStars(book.volumeInfo.averageRating)}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {books.length > 0 && (
        <TouchableOpacity
          style={[styles.buttonBase, styles.addBookButton]}
          onPress={() => navigation.navigate('EditBooks')}
        >
          <Text style={[styles.buttonTextBase, styles.addBookButtonText]}>Adicionar Livro Manualmente</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputContainerBoxIsbn: {
        marginBottom: 20,
    },
    inputContainerIsbn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    iconButton: {
        padding: 5,
    },
    booksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    bookItem: {
        width: '30%',
        marginBottom: 16,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    bookImage: {
        width: 80,
        height: 120,
        marginBottom: 10,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    bookAuthors: {
        fontSize: 12,
        color: '#555',
        textAlign: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 5,
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    overlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
        borderRadius: 10,
    },
    overlayText: {
        color: '#fff',
        textAlign: 'center',
    },
    cancelButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonBase: {
        backgroundColor: '#007BFF', // Azul como padrão
        padding: 5,
        borderRadius: 8,
        margin: 10,
        alignItems: 'center',
    },
    buttonTextBase: {
        color: '#fff', // Texto branco
        fontSize: 16,
        fontWeight: 'bold',
    },
    codeList: {
        position: "absolute",
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 10,
        borderRadius: 8,
    },
    codeText: {
        color: "#fff",
        fontSize: 16,
    },
});

export default SearchBooks;
