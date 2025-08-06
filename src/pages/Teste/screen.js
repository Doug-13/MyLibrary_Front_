import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';

const books = [
  { id: '1', title: 'Dom Casmurro', author: 'Machado de Assis' },
  { id: '2', title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien' },
  { id: '3', title: '1984', author: 'George Orwell' },
  { id: '4', title: 'A Revolução dos Bichos', author: 'George Orwell' },
];

export default function LibraryScreen() {
  const renderBook = ({ item }) => (
    <View style={styles.bookItem}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.author}>por {item.author}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Minha Biblioteca</Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#029759',
  },
  list: {
    paddingBottom: 20,
  },
  bookItem: {
    backgroundColor: '#e6f2e9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#034d23',
  },
  author: {
    fontSize: 14,
    color: '#05693c',
    marginTop: 4,
  },
});
