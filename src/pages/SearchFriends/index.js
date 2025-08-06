import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.js';

// Criar instância axios com a URL correta
const api = axios.create({ baseURL: API_BASE_URL });

const SearchFriends = ({ navigation }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [textoBusca, setTextoBusca] = useState('');
  const { userMongoId, setTimeStamp } = useContext(AuthContext);

  const atualizarUsuarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userMongoId}/first30-with-follow-status`);
      const data = await response.json();
      setUsuarios(data);

      const usuariosSemLogado = data.filter((usuario) => usuario._id !== userMongoId);

      const usuariosComStatus = await Promise.all(
        usuariosSemLogado.map(async (usuario) => {
          const followStatusResponse = await fetch(`${API_BASE_URL}/connections/${userMongoId}/follow-status/${usuario._id}`);
          const followStatusData = await followStatusResponse.json();
          return { ...usuario, ...followStatusData };
        })
      );
      setTimeStamp(new Date());
      setUsuariosFiltrados(
        usuariosComStatus.filter((usuario) =>
          (usuario.nome_completo || '').toLowerCase().includes(textoBusca.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar usuários:', error);
    }
  };

  useEffect(() => {
    atualizarUsuarios();
  }, [userMongoId]);

  const handleBusca = (texto) => {
    setTextoBusca(texto);
    setUsuariosFiltrados(
      usuarios.filter((usuario) =>
        (usuario.nome_completo || '').toLowerCase().includes(texto.toLowerCase()) && usuario._id !== userMongoId
      )
    );
  };

  const handleAdicionarAmizade = async (followerId, followingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: followerId, following: followingId }),
      });

      if (response.ok) {
        atualizarUsuarios();

        // Criar notificação de novo seguidor
        const messageData = {
          recipient_id: followingId,
          user_id: followerId,
          messageType: 'newFollower',
          created_at: new Date().toISOString()
        };
        try {
          const notificationResponse = await api.post('/notifications', messageData);
          if (notificationResponse.status !== 201) {
            console.error('Erro ao salvar notificação de novo seguidor');
          }
        } catch (error) {
          console.error('Erro ao criar notificação de novo seguidor:', error);
        }
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
        atualizarUsuarios();

        // Deletar notificação associada ao deixar de seguir
        try {
          const deleteNotificationResponse = await api.delete(`/notifications/${followerId}/${followingId}`);
          if (deleteNotificationResponse.status !== 200) {
            console.error('Erro ao deletar notificação de deixar de seguir');
          }
        } catch (error) {
          console.error('Erro ao deletar notificação de deixar de seguir:', error);
        }
      } else {
        alert('Erro ao deixar de seguir');
      }
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
    }
  };

  const renderUsuario = ({ item }) => (
    <TouchableOpacity
      style={styles.usuarioItem}
      onPress={() => navigation.navigate('FriendsProfile', { friendId: item._id })}
    >
      <Image
        source={{ uri: item.foto_perfil || 'https://via.placeholder.com/150' }}
        style={styles.fotoUsuario}
      />
      <View style={styles.infoUsuario}>
        <Text style={styles.nomeUsuario}>{item.nome_completo}</Text>
        <TouchableOpacity
          style={[
            styles.botaoAdicionar,
            item.isFollowing && { backgroundColor: '#ff6347' },
          ]}
          onPress={() =>
            item.isFollowing
              ? handleDeixarDeSeguir(userMongoId, item._id)
              : handleAdicionarAmizade(userMongoId, item._id)
          }
        >
          <Text style={styles.textoBotao}>
            {item.isFollowing ? 'Seguindo' : item.isFollowedBack ? 'Seguir de volta' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Procurar Novos Amigos</Text>
      <TextInput
        style={styles.input}
        placeholder="🔍 Pesquise pelo nome..."
        value={textoBusca}
        onChangeText={handleBusca}
        placeholderTextColor="#888"
      />
      <FlatList
        data={usuariosFiltrados}
        renderItem={renderUsuario}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.lista}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  lista: {
    paddingBottom: 20,
  },
  usuarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  fotoUsuario: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  infoUsuario: {
    flex: 1,
  },
  nomeUsuario: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  botaoAdicionar: {
    backgroundColor: '#6C63FF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 10
  },
  textoBotao: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default SearchFriends;
