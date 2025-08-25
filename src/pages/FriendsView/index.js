import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import { AuthContext } from '../../../context/AuthContext.js';
import { ThemeContext } from '../../../context/ThemeContext.js';
import { useNavigation } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import FollowButton from '../../components/FolowButton.js';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RADIUS = 12;
const ELEV = 2;

const FriendsView = () => {
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [filteredFriends, setFilteredFriends] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [index, setIndex] = useState(0);

  const [counts, setCounts] = useState({ friends: 0, followers: 0, following: 0 });

  const { userMongoId, timeStamp } = useContext(AuthContext);
  const { theme, navTheme } = useContext(ThemeContext);
  const barStyle = navTheme.dark ? 'light-content' : 'dark-content';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();

  // Rotas fixas
  const [routes] = useState([
    { key: 'friends', title: 'Amigos' },
    { key: 'followers', title: 'Seguidores' },
    { key: 'following', title: 'Seguindo' },
  ]);

  const handleAddBook = () => navigation.navigate('SearchFriends');

  // Helpers
  const removeDuplicatesById = useCallback((arr, keyPath) => {
    const seen = new Set();
    return arr.filter((item) => {
      const id = keyPath.split('.').reduce((obj, key) => obj?.[key], item);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, []);

  // Fetch
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/connections/${userMongoId}/followers-with-status`
      );
      const data = await response.json();

      const followersData = data.filter((item) => item.user?.isFollowedByMe);
      const followingData = data.filter((item) => item.user?.isFollowing);
      const friendsData = data.filter(
        (item) => item.user?.isFollowedByMe && item.user?.isFollowing
      );

      setFollowers(followersData);
      setFollowing(followingData);
      setFriends(friendsData);

      setCounts({
        friends: friendsData.length,
        followers: followersData.length,
        following: followingData.length,
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error?.message);
    }
  }, [userMongoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, timeStamp]);

  // Search filter
  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    const norm = (s) => (s || '').toLowerCase();

    setFilteredFollowers(
      followers.filter((f) => norm(f.user?.nome_completo).includes(q))
    );
    setFilteredFollowing(
      following.filter((f) => norm(f.user?.nome_completo).includes(q))
    );
    setFilteredFriends(
      friends.filter((f) => norm(f.user?.nome_completo).includes(q))
    );
  }, [searchText, followers, following, friends]);

  // Render item
  const renderUserCard = useCallback(
    ({ item, type }) => {
      const u = item?.user;
      if (!u) return null;

      const canOpen = u.visibilidade_biblioteca !== 'private';

      const onPress = () => {
        if (!canOpen) {
          alert('Esta biblioteca é privada, não é possível acessar seus livros.');
          return;
        }
        navigation.navigate('FriendsProfile', { friendId: u._id });
      };

      const visibilityStyle =
        u.visibilidade_biblioteca === 'public'
          ? styles.publicLibrary
          : u.visibilidade_biblioteca === 'private'
          ? styles.privateLibrary
          : styles.friendsLibrary;

      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Card style={styles.friendCard}>
            <View style={styles.friendInfo}>
              <View style={styles.avatarWrap}>
                <Image
                  source={
                    u.foto_perfil
                      ? { uri: u.foto_perfil }
                      : require('../../../assets/logo_Preto.png')
                  }
                  style={styles.friendImage}
                />
              </View>

              <View style={styles.friendDetails}>
                <Text style={styles.friendName} numberOfLines={1}>
                  {u.nome_completo || 'Usuário'}
                </Text>
                {!!u.email && (
                  <Text style={styles.friendEmail} numberOfLines={1}>
                    {u.email}
                  </Text>
                )}
                <Text style={[styles.friendVisibility, visibilityStyle]} numberOfLines={1}>
                  {u.visibilidade_biblioteca === 'public'
                    ? 'Aberto ao Público'
                    : u.visibilidade_biblioteca === 'private'
                    ? 'Esta biblioteca é privada.'
                    : 'Visível para amigos'}
                </Text>
              </View>

              <FollowButton userId={u._id} currentUserId={userMongoId} />
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [navigation, userMongoId, styles]
  );

  // Lista
  const renderList = useCallback(
    (data, type) => {
      const uniqueData = removeDuplicatesById(data, 'user._id');

      if (uniqueData.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <LottieView
              source={require('../../../assets/animation2.json')}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
            <Text style={styles.emptyText}>
              {type === 'friends'
                ? 'Você ainda não tem amigos.'
                : type === 'followers'
                ? 'Você ainda não tem seguidores.'
                : 'Você ainda não está seguindo ninguém.'}
            </Text>
          </View>
        );
      }

      return (
        <SafeAreaView style={{ flex: 1 }}>
          <FlatList
            data={uniqueData}
            keyExtractor={(it) => `${type}-${it?.user?._id}`}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 12, paddingTop: 8 }}
            renderItem={({ item }) => renderUserCard({ item, type })}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      );
    },
    [removeDuplicatesById, renderUserCard, styles]
  );

  const renderScene = useCallback(
    ({ route }) => {
      switch (route.key) {
        case 'friends':
          return renderList(filteredFriends, 'friends');
        case 'followers':
          return renderList(filteredFollowers, 'followers');
        case 'following':
          return renderList(filteredFollowing, 'following');
        default:
          return null;
      }
    },
    [filteredFriends, filteredFollowers, filteredFollowing, renderList]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={barStyle} backgroundColor={theme.primary} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View style={styles.searchWrap}>
            <Icon name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquise pelo nome..."
              placeholderTextColor={theme.label}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {!!searchText && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* FAB */}
          <TouchableOpacity style={styles.fab} onPress={handleAddBook} activeOpacity={0.9}>
            <Icon name="person-add-alt-1" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Tabs */}
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                scrollEnabled={false}
                style={styles.tabBar}
                indicatorStyle={styles.indicator}
                tabStyle={styles.tabStyle}
                inactiveColor={theme.textSecondary}
                activeColor={theme.text}
                pressColor="transparent"
                renderLabel={({ route, focused }) => (
                  <View style={styles.tabLabelWrap}>
                    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                      {route.title}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{counts[route.key] ?? 0}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const AVATAR = 50;

const createStyles = (theme) =>
  StyleSheet.create({
    // Search
    searchWrap: {
      marginHorizontal: 12,
      marginTop: 10,
      marginBottom: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.card,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      paddingVertical: 0,
      fontSize: 14,
    },

    // TabBar
    tabBar: {
      backgroundColor: theme.primary,
      borderBottomWidth: 1,
      borderBottomColor: '#F6E68B',
      elevation: 0,
    },
    tabStyle: { flex: 1 },
    tabLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tabLabel: {
      fontWeight: '800',
      textTransform: 'none',
      fontSize: 13,
      letterSpacing: 0.2,
      color: theme.text,
    },
    tabLabelActive: { color: theme.text },
    indicator: {
      backgroundColor: theme.text,
      height: 3,
      borderRadius: 3,
      marginHorizontal: 16,
    },
    badge: {
      minWidth: 26,
      height: 18,
      paddingHorizontal: 6,
      borderRadius: 9,
      backgroundColor: theme.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: theme.bg,
      fontSize: 11,
      fontWeight: '800',
    },

    // Cards de usuário
    friendCard: {
      backgroundColor: theme.card,
      borderRadius: RADIUS,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    friendInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarWrap: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: '#F1F5F9',
      overflow: 'hidden',
    },
    friendImage: { width: '100%', height: '100%' },
    friendDetails: { flex: 1 },
    friendName: { fontSize: 16, fontWeight: '800', color: theme.text },
    friendEmail: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

    friendVisibility: { fontSize: 12, marginTop: 6 },
    publicLibrary: { color: theme.success ?? '#28A745', fontStyle: 'italic' },
    privateLibrary: { color: theme.error, fontStyle: 'italic' },
    friendsLibrary: { color: '#FF9800', fontStyle: 'italic' },

    // Empty
    emptyWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 24 },
    emptyText: { marginTop: 8, color: theme.textSecondary, fontSize: 14, textAlign: 'center' },

    // FAB
    fab: {
      position: 'absolute',
      bottom: 70,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E9CC16',
      zIndex: 10,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
  });

export default FriendsView;
