import React, { useState, useContext } from 'react';
import { View, Image, Modal, Pressable, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api'; 

const ModalBook = ({ modalVisible, closeModal, selectedBook, user }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loanRequested, setLoanRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { userMongoId, nome_completo } = useContext(AuthContext);

  if (!selectedBook) return null;

  const { friendId, title, author, description, coverUrl, ownerId } = selectedBook;

  const handleLoanRequest = async () => {
    console.log("handleLoanRequest foi chamado");

    console.log("selectedBook:", selectedBook);
    console.log("friendId:", friendId);

    if (!friendId || !userMongoId || isRequesting) {
      console.log("Condições não atendidas, retornando.");
      return;
    }

    setIsRequesting(true);

    try {
      const messageData = {
        message: `O Usuário ${nome_completo} tem interesse no livro ${title}`,
        recipient_id: friendId, // O dono do livro
        sender_id: userMongoId, // O solicitante
        title: title,
        user_id: userMongoId,
        created_at: new Date().toISOString(),
      };

      console.log("Enviando solicitação:", messageData);
      const response = await axios.post(`${API_BASE_URL}/notifications`, messageData);

      if (response.status === 201) {
        setLoanRequested(true);
        alert('Solicitação enviada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      const errorMessage = error.response?.data?.message || 'Erro desconhecido. Tente novamente.';
      alert(`Erro ao enviar solicitação: ${errorMessage}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Pressable style={styles.closeIcon} onPress={closeModal}>
            <Icon name="close" size={24} color="#000" />
          </Pressable>

          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Image source={{ uri: coverUrl }} style={styles.modalImage} />
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalAuthor}>{author}</Text>
            <Text style={styles.modalDescription}>
              {isExpanded ? description : `${description.substring(0, 200)}...`}
            </Text>
            <Pressable onPress={() => setIsExpanded(!isExpanded)}>
              <Text style={styles.readMore}>{isExpanded ? 'Ler menos' : 'Ler mais'}</Text>
            </Pressable>

            {isRequesting && <ActivityIndicator size="small" color="#0000ff" />}
            <Pressable
              style={[
                styles.actionButton,
                loanRequested ? styles.requestedButton : styles.loanButton,
              ]}
              onPress={!loanRequested && !isRequesting ? handleLoanRequest : null}
            >
              <Text style={styles.actionButtonText}>
                {loanRequested ? 'Solicitação Enviada!' : 'Me Empresta?'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  scrollViewContent: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  modalImage: {
    width: '50%',
    height: 200,
    borderRadius: 5,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalAuthor: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 12,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'justify',
  },
  readMore: {
    color: '#6200ee',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  loanButton: {
    backgroundColor: '#388e3c',
    marginBottom: 20,
  },
  requestedButton: {
    backgroundColor: '#aaa',
    marginBottom: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ModalBook;
