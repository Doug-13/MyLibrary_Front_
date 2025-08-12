import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Card } from 'react-native-paper';
import { AuthContext } from '../../../context/AuthContext.js';
import { useNavigation } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import FollowButton from '../../components/FolowButton.js';
import { KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js';
import { SafeAreaView } from 'react-native-safe-area-context';


const FriendsView = () => {
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]); // Estado para amigos filtrados
  const [filteredFollowers, setFilteredFollowers] = useState([]); // Estado para seguidores filtrados
  const [filteredFollowing, setFilteredFollowing] = useState([]); // Estado para seguindo filtrados
  const [databaseResults, setDatabaseResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [index, setIndex] = useState(0);
  const { userMongoId, timeStamp } = useContext(AuthContext);
  const navigation = useNavigation();

  const [routes, setRoutes] = useState([
    { key: 'friends', title: `Amigos (0)` },
    { key: 'followers', title: `Seguidores (0)` },
    { key: 'following', title: `Seguindo (0)` },
  ]);

  // Função utilitária para buscar dados
  const fetchData = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`);
      return response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      return [];
    }
  };
  useEffect(() => {
    console.log('Iniciando fetchAllData');
    const fetchAllData = async () => {
      try {
        const userResponse = await fetchData(`users/${userMongoId}/friends`);
        console.log('userResponse:', userResponse);
        setUserData(userResponse.user);

        const followersData = await fetchData(`connections/${userMongoId}/followers`);
        console.log('followersData:', followersData);

        const followingData = await fetchData(`connections/${userMongoId}/following`);
        console.log('followingData:', followingData);

        setFollowers(followersData);
        setFollowing(followingData);

        const friendsData = followersData.filter((follower) =>
          followingData.some((following) => following.following._id === follower.follower._id)
        );
        console.log('friendsData:', friendsData);
        setFriends(friendsData);

        setRoutes([
          { key: 'friends', title: `Amigos (${friendsData.length})` },
          { key: 'followers', title: `Seguidores (${followersData.length})` },
          { key: 'following', title: `Seguindo (${followingData.length})` },
        ]);
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchAllData();
  }, [timeStamp, userMongoId]);

  useEffect(() => {
    searchDatabase(searchText); // Sempre buscar dados ao alterar o texto
  }, [searchText]);


  // Filtrar dados com base no texto de busca
  useEffect(() => {
    if (searchText.length > 3) {
      searchDatabase(searchText); // Buscar no banco de dados com o texto de pesquisa
    } else {
      setDatabaseResults([]); // Limpar resultados se a pesquisa for menor que 4 caracteres
    }

    // Filtragem dos dados locais (amigos, seguidores, seguidos) com base no texto de pesquisa
    const searchLower = searchText.toLowerCase();

    // Filtra amigos
    setFilteredFriends(
      friends.filter((friend) =>
        friend?.follower?.nome_completo?.toLowerCase().includes(searchLower)
      )
    );

    // Filtra seguidores
    setFilteredFollowers(
      followers.filter((follower) =>
        follower?.follower?.nome_completo?.toLowerCase().includes(searchLower)
      )
    );

    // Filtra seguidos
    setFilteredFollowing(
      following.filter((followed) =>
        followed?.following?.nome_completo?.toLowerCase().includes(searchLower)
      )
    );
  }, [searchText, friends, followers, following]);

  // Busca no banco de dados e aplica a filtragem diretamente nos resultados
  const searchDatabase = async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userMongoId}/first30-with-follow-status?query=${query}`);
      const data = await response.json();

      // Filtrando os dados recebidos do banco com base na pesquisa
      const filteredData = data.filter((user) =>
        user.nome_completo.toLowerCase().includes(query.toLowerCase())
      );

      setDatabaseResults(filteredData); // Atualiza o estado com os dados filtrados do banco
    } catch (error) {
      console.error('Erro ao buscar usuários no banco:', error.message);
    }
  };

  const removeDuplicatesById = (arr, keyPath) => {
    const seen = new Set();
    return arr.filter(item => {
      const id = keyPath.split('.').reduce((obj, key) => obj?.[key], item);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };
  // Exibição dos resultados da pesquisa
  // Exibição dos resultados da pesquisa
  const renderDatabaseResults = () => (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {databaseResults.length > 0 ? (
          databaseResults.map((user) => (
            <TouchableOpacity
              key={`db-${user._id}`}
              onPress={() => navigation.navigate('FriendsProfile', { friendId: user._id })}
            >
              <Card style={styles.friendCard}>
                <View style={styles.friendInfo}>
                  <Image source={{ uri: user.foto_perfil }} style={styles.friendImage} />
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{user.nome_completo}</Text>
                    <Text style={styles.friendEmail}>{user.email}</Text>
                    <Text
                      style={[
                        styles.friendVisibility,
                        user.visibilidade_biblioteca === 'public'
                          ? styles.publicLibrary
                          : user.visibilidade_biblioteca === 'private'
                            ? styles.privateLibrary
                            : styles.friendsLibrary,
                      ]}
                    >
                      {
                        user.visibilidade_biblioteca === 'public'
                          ? 'Aberto ao Público'
                          : user.visibilidade_biblioteca === 'private'
                            ? 'Esta biblioteca é privada.'
                            : 'Visível para amigos'
                      }
                    </Text>
                  </View>
                  <View>
                    <FollowButton
                      userId={user._id}
                      currentUserId={userMongoId} // ID do usuário logado
                    />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noDataText}>Nenhum usuário encontrado.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );


  const handleAddBook = () => navigation.navigate('SearchFriends');

  const renderList = (data, type) => {
    const uniqueData = removeDuplicatesById(data, type === 'friends' ? 'follower._id' : `${type}._id`);

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {uniqueData.length > 0 ? (
            uniqueData.map((item) => {
              const userData = type === 'friends' ? item?.follower : item?.[type];
              if (!userData) return null;

              return (
                <TouchableOpacity
                  key={`${type}-${userData._id}`} // continua usando chave composta
                  onPress={() => {
                    if (userData.visibilidade_biblioteca === 'private') {
                      alert("Esta biblioteca é privada, não é possível acessar seus livros.");
                    } else {
                      navigation.navigate('FriendsProfile', { friendId: userData._id });
                    }
                  }}
                >
                  <Card style={styles.friendCard}>
                    <View style={styles.friendInfo}>
                      <Image source={{ uri: userData.foto_perfil }} style={styles.friendImage} />
                      <View style={styles.friendDetails}>
                        <Text style={styles.friendName}>{userData.nome_completo}</Text>
                        <Text style={styles.friendEmail}>{userData.email}</Text>
                        <Text style={[
                          styles.friendVisibility,
                          userData.visibilidade_biblioteca === 'public' ? styles.publicLibrary :
                            userData.visibilidade_biblioteca === 'private' ? styles.privateLibrary :
                              styles.friendsLibrary
                        ]}>
                          {
                            userData.visibilidade_biblioteca === 'public'
                              ? 'Aberto ao Público'
                              : userData.visibilidade_biblioteca === 'private'
                                ? 'Esta biblioteca é privada.'
                                : 'Visível para amigos'
                          }
                        </Text>
                      </View>
                      <View>
                        <FollowButton
                          userId={userData._id}
                          currentUserId={userMongoId}
                        />
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noDataText}>
              {type === 'friends'
                ? 'Você ainda não tem amigos.'
                : type === 'followers'
                  ? 'Você ainda não tem seguidores.'
                  : 'Você ainda não está seguindo ninguém.'}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  };


  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'friends':
        return renderList(filteredFriends, 'friends');
      case 'followers':
        return renderList(filteredFollowers, 'follower');
      case 'following':
        return renderList(filteredFollowing, 'following');
      default:
        return null;
    }
  };

  const renderTabBar = (props) => (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      renderTabBar={renderTabBar}
    />
  );

  // if (loading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <LottieView
  //         source={require('../../../assets/animation3.json')}
  //         autoPlay
  //         loop
  //         style={{ width: 200, height: 200 }}
  //       />
  //       <Text style={styles.loadingText}>Carregando sua biblioteca, aguarde...</Text>
  //     </View>
  //   );
  // }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animation3.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text>Carregando dados do usuário...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquise pelo nome..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddBook}>
            <Text style={styles.addButtonText}>🔍</Text>
          </TouchableOpacity>
          <TabView
            navigationState={{ index, routes }}
            renderScene={SceneMap({
              friends: () => renderList(filteredFriends, 'friends'),
              followers: () => renderList(filteredFollowers, 'follower'),
              following: () => renderList(filteredFollowing, 'following'),
            })}
            onIndexChange={setIndex}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                style={styles.tabBar}
                indicatorStyle={styles.indicator}
                labelStyle={styles.tabLabel}
                activeColor="#000"
                inactiveColor="#000"
              />
            )}
          />
          {searchText.length > 3 && (
            <>
              <Text style={styles.suggestionsTitle}>Sugestões para você</Text>
              {renderDatabaseResults()}
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 15
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userBio: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  friendCard: {
    marginBottom: 10,
    padding: 10,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 80,
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
  buttonContainer: {
    marginTop: 10,
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabView: {
    marginTop: 20,
  },
  tabBar: {
    backgroundColor: '#f3d00f', // Cor amarela para a barra
  },
  tabLabel: {
    fontWeight: 'bold', // Para garantir destaque na fonte
  },
  indicator: {
    backgroundColor: '#000', // Cor preta para o indicador
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  navigationButton: {
    margin: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f3d00f', // Cor amarela
    borderRadius: 5,
    alignItems: 'center',
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000', // Cor preta para o texto
  },
  friendVisibility: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  publicLibrary: {
    color: '#4CAF50', // Verde para público
    fontStyle: 'italic',
  },
  privateLibrary: {
    color: '#F44336', // Vermelho para privado
    fontStyle: 'italic',
  },
  friendsLibrary: {
    color: '#FF9800', // Laranja para amigos
    fontStyle: 'italic',
  },
  suggestionsTitle: {
    fontSize: 18, // Tamanho da fonte para o título
    fontWeight: 'bold', // Deixar o título em negrito
    color: '#333', // Cor do texto (preto suave)
    marginBottom: 10, // Espaçamento abaixo do título
    textAlign: 'center', // Centralizar o título
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


export default FriendsView;
