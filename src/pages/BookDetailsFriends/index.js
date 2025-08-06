import React, { useState, useContext, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext.js';
import { useNavigation } from '@react-navigation/native';

import { API_BASE_URL } from '../../config/api.js'; 

export default function BookDetailsFriends({ route }) {
  const navigation = useNavigation();
  const { book } = route.params;
  const { userMongoId, timeStamp } = useContext(AuthContext);
  // Estados
  const [loanRequested, setLoanRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const bookId = book._id || book.id;

  // Dados simulados (substituir pelos valores reais do contexto do app)
  const friendId = book.friendId || book.ownerId; // Substituir pelo ID do dono do livro

  const imageSource =
    book.coverUrl && book.coverUrl.trim() !== ""
      ? { uri: book.coverUrl }
      : require('../../../assets/noImageAvailable.jpg');

  // Resetar o estado sempre que o livro mudar
  useEffect(() => {
    setLoanRequested(false); // Resetando a solicitação quando um novo livro é mostrado
  }, [book]); // A dependência é o livro, ou seja, sempre que o livro mudar, o estado será resetado

  const handleLoanRequest = async () => {
    console.log("friendId:", friendId);
    console.log("userMongoId:", userMongoId);
    console.log('ID do livro recebido:', bookId);
    console.log("book:", bookId);

    if (!friendId || !userMongoId || loanRequested) {
      Alert.alert('Aviso', 'Não é possível enviar a solicitação neste momento.');
      return;
    }

    setIsRequesting(true);

    try {
      const messageData = {
        messageType: 'loanRequest',
        recipient_id: friendId,
        book_id: bookId,
        user_id: userMongoId,
        created_at: new Date().toISOString(),
      };

      const response = await axios.post(`${API_BASE_URL}/notifications`, messageData);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={imageSource} style={styles.bookCover} />
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>Por: {book.author}</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Pressable onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.description}>
              {isExpanded ? book.description || "Sem descrição disponível." : `${(book.description || "Sem descrição disponível.").slice(0, 100)}...`}
            </Text>
            <Text style={styles.readMore}>{isExpanded ? 'Ler menos' : 'Ler mais'}</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Gênero</Text>
          <Text style={styles.genre}>{book.genre || "Gênero não informado."}</Text>

          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.status}>
            {book.status === "available" ? "Disponível" : "Indisponível"}
          </Text>

          <Text style={styles.sectionTitle}>Empréstimos</Text>
          <Text style={styles.loans}>
            {book.loans ? `${book.loans} empréstimos` : "Nenhum empréstimo registrado."}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.loanRequestButton, loanRequested && styles.disabledButton]}
        onPress={handleLoanRequest}
        disabled={loanRequested || isRequesting}
      >
        <Text style={styles.loanRequestButtonText}>
          {loanRequested ? 'Solicitação Enviada!' : isRequesting ? 'Enviando...' : 'Me Empresta?'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}  // Vai voltar para a tela anterior
      >
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  bookCover: {
    width: 150,
    height: 220,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
    textAlign: 'center',
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  readMore: {
    color: '#6200ee',
    fontSize: 14,
    marginTop: 4,
  },
  genre: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 8,
  },
  loans: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
  },
  loanRequestButton: {
    backgroundColor: '#f9a825',
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loanRequestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  backButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
