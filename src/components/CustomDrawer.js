// components/CustomDrawerContent.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Bibliotech from '../pages/Bibliotech/index';

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const { logout, user } = useContext(AuthContext);
  const [userName, setUserName] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'Confirmação',
      'Deseja realmente sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: () => logout(() => navigation.navigate('./Login')),
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (user && user.data && user.data.nome) {
      setUserName(user.data.nome);
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={user && user.data && user.data.foto_url ? { uri: user.data.foto_url } : require('../../assets/logo_Preto.png')}
          style={styles.profileImage}
        />
        <Text style={styles.headerText}>{userName}</Text>
      </View>

      <DrawerContentScrollView {...props}>
        <View style={styles.drawerItems}>
          <DrawerItem
            label="Início"
            icon={({ color, size }) => <Icon name="home" color="#808080" size={28} />}
            labelStyle={{ fontSize: 16, color: '#667' }}
            onPress={() => props.navigation.navigate('HomeTabs')}
          />
          <DrawerItem
            label="Bibliotech"
            icon={({ color, size }) => <Icon name="library-books" color="#808080" size={28} />}
            labelStyle={{ fontSize: 16, color: '#667' }}
            onPress={() => props.navigation.navigate('Bibliotech')}
          />
          <DrawerItem
            label="Estatísticas"
            icon={({ color, size }) => <Icon name="bar-chart" color="#808080" size={28} />}
            labelStyle={{ fontSize: 16, color: '#667' }}
            onPress={() => props.navigation.navigate('Estatisticas')}
          />

        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#000" />
          <Text style={styles.footerText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão 2025.00.01</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f3d00f',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 50,
  },
  headerText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerItems: {
    flex: 1,
    paddingHorizontal: 10,
    marginVertical: 5, // Adiciona espaçamento entre os itens
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 10,
    fontSize: 16,
  },
  versionText: {
  marginTop: 10,
  fontSize: 12,
  color: '#888',
},
});

export default CustomDrawerContent;
