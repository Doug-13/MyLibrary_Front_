// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
// // import { getAllUsers } from '../services/api';

// const SearchUsers = ({ navigation }) => {
//   const [users, setUsers] = useState([]);
//   const [search, setSearch] = useState('');
//   const [filteredUsers, setFilteredUsers] = useState([]);

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const allUsers = await getAllUsers();
//       setUsers(allUsers);
//       setFilteredUsers(allUsers);
//     } catch (error) {
//       console.error('Erro ao buscar usuários:', error);
//     }
//   };

//   const handleSearch = (text) => {
//     setSearch(text);
//     const filtered = users.filter((user) =>
//       user.name.toLowerCase().includes(text.toLowerCase())
//     );
//     setFilteredUsers(filtered);
//   };

//   const renderUser = ({ item }) => (
//     <TouchableOpacity
//       style={styles.userItem}
//       onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
//     >
//       <Text style={styles.userName}>{item.name}</Text>
//       <Text style={styles.userEmail}>{item.email}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Buscar Usuários</Text>
//       <TextInput
//         style={styles.searchInput}
//         placeholder="Digite o nome do usuário"
//         value={search}
//         onChangeText={handleSearch}
//       />
//       <FlatList
//         data={filteredUsers}
//         keyExtractor={(item) => item.id}
//         renderItem={renderUser}
//         ListEmptyComponent={<Text style={styles.emptyText}>Nenhum usuário encontrado</Text>}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   searchInput: {
//     height: 40,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 8,
//     marginBottom: 20,
//     paddingHorizontal: 10,
//   },
//   userItem: {
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   userName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   userEmail: {
//     fontSize: 14,
//     color: '#555',
//   },
//   emptyText: {
//     textAlign: 'center',
//     marginTop: 20,
//     color: '#555',
//   },
// });

// export default SearchUsers;



import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../../context/ThemeContext.js';
import { getAllUsers } from '../services/api'; // ✅ descomentado

const SearchUsers = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => mkStyles(theme), [theme]);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = users.filter((user) =>
      (user.name || '').toLowerCase().includes(text.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      activeOpacity={0.9}
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar Usuários</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Digite o nome do usuário"
        placeholderTextColor={theme.label}
        value={search}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUser}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum usuário encontrado</Text>}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
};

function mkStyles(t) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: t.bg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: t.text,
    },
    searchInput: {
      height: 44,
      borderColor: t.border,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 20,
      paddingHorizontal: 12,
      backgroundColor: t.card,
      color: t.text,
    },
    userItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      backgroundColor: t.card,
      borderRadius: 8,
      marginBottom: 10,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: t.text,
    },
    userEmail: {
      fontSize: 14,
      color: t.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 20,
      color: t.textSecondary,
    },
  });
}

export default SearchUsers;
