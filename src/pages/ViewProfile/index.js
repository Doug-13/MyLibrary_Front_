import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../config/api.js'; 

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const { userMongoId, userId, timeStamp } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };
    fetchUserData();
  }, [timeStamp, userMongoId]);

  const translateVisibility = (visibility) => {
    switch (visibility) {
      case 'public':
        return 'Público';
      case 'private':
        return 'Privado';
      case 'friends':
        return 'Amigos';
      default:
        return visibility;
    }
  };

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="24" color="#f3d00f" />
        <Text>Carregando dados do usuário...</Text>
      </View>
    );
  }

  const handleEditProfile = () => {
    navigation.navigate('Profile'); // Redireciona para a tela de edição (substitua pela rota correta)
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Image source={{ uri: userData.foto_perfil }} style={styles.profileImage} />
        <Text style={styles.userName}>{userData.nome_completo}</Text>
        <Text style={styles.userBio}>"{userData.sobremim || 'Nenhuma descrição disponível.'}"</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsTitle}>Detalhes:</Text>
        <View style={styles.detailCard}>
          <Text style={[styles.detailItem, styles.spacedItem]}>
            <Text style={styles.detailLabel}>
              <Icon name="phone" size={18} color="#555" /> Telefone:
            </Text> {userData.telefone || 'Não informado'}
          </Text>
          <Text style={[styles.detailItem, styles.spacedItem]}>
            <Text style={styles.detailLabel}>
              <Icon name="calendar-today" size={18} color="#555" /> Data de Nascimento:
            </Text>
            {userData.data_nascimento
              ? ` ${new Date(userData.data_nascimento).toLocaleDateString()}`
              : ' Não informado'}
          </Text>
          <Text style={[styles.detailItem, styles.spacedItem]}>
            <Text style={styles.detailLabel}>
              <Icon name="favorite" size={18} color="#555" /> Gêneros Favoritos:
            </Text>
            {userData.generos_favoritos?.length
              ? ` ${userData.generos_favoritos.join(', ')}`
              : ' Não informado'}
          </Text>
          <Text style={[styles.detailItem, styles.spacedItem]}>
            <Text style={styles.detailLabel}>
              <Icon name="visibility" size={18} color="#555" /> Visibilidade da Biblioteca:
            </Text>
            {translateVisibility(userData.visibilidade_biblioteca || 'Não informado')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userBio: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 10,
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3d00f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailsSection: {
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  detailItem: {
    fontSize: 16,
    color: '#333',
  },
  spacedItem: {
    marginBottom: 15,
  },
  detailLabel: {
    fontWeight: 'bold',
  },
});

export default ProfilePage;
