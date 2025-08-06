import React, { useState } from 'react';
import { View, Image, Modal, Pressable, Text, StyleSheet, ScrollView } from 'react-native';

const ModalBook = ({ modalVisible, closeModal, selectedBook, onEdit, onDelete, onLoan }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Estado para controlar a exibição da descrição

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {selectedBook && (
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              <Image
                source={{ uri: selectedBook.coverUrl }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedBook.title}</Text>
              <Text style={styles.modalAuthor}>{selectedBook.author}</Text>
              <Text style={styles.modalDescription}>
                {isExpanded
                  ? selectedBook.description
                  : `${selectedBook.description.substring(0, 300)}...`}
              </Text>

              {/* Botão para expandir ou colapsar a descrição */}
              <Pressable onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={styles.readMore}>
                  {isExpanded ? 'Ler menos' : 'Ler mais'}
                </Text>
              </Pressable>

              {/* Botões de Ação */}
              <View style={styles.actionButtonsContainer}>
                <Pressable style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
                  <Text style={styles.actionButtonText}>Editar</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
                  <Text style={styles.actionButtonText}>Deletar</Text>
                </Pressable>
              </View>

              {/* Botão Realizar Empréstimo */}
              <Pressable style={[styles.actionButton, styles.loanButton]} onPress={onLoan}>
                <Text style={styles.actionButtonText}>Realizar Empréstimo</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* Botão Fechar */}
          <Pressable style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semi-transparente
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    maxHeight: '80%', // Limite de altura para ativar o scroll
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scrollViewContent: {
    paddingBottom: 20, // Espaço extra no final do scroll
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
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  readMore: {
    color: '#6200ee', // Cor do botão "Ler mais" ou "Ler menos"
    marginBottom: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0288d1',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  loanButton: {
    backgroundColor: '#388e3c',
    marginBottom: 20, // Espaço extra para o botão de fechar
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#6200ee',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ModalBook;
