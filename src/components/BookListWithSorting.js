import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';

const BookListWithSorting = ({ books }) => {
  const [sortedBooks, setSortedBooks] = useState(books);
  const [sortOption, setSortOption] = useState(null);

  const sortBooks = (option) => {
    let sorted = [...books];
    if (option === 'nameAsc') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (option === 'nameDesc') {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else if (option === 'authorAsc') {
      sorted.sort((a, b) => a.author.localeCompare(b.author));
    } else if (option === 'authorDesc') {
      sorted.sort((a, b) => b.author.localeCompare(a.author));
    }
    setSortedBooks(sorted);
    setSortOption(option);
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.bookAuthor}>{item.author}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sorting Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortOption === 'nameAsc' && styles.activeSortButton]}
          onPress={() => sortBooks('nameAsc')}
        >
          <Text style={styles.sortButtonText}>Nome A - Z</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortOption === 'nameDesc' && styles.activeSortButton]}
          onPress={() => sortBooks('nameDesc')}
        >
          <Text style={styles.sortButtonText}>Nome Z - A</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortOption === 'authorAsc' && styles.activeSortButton]}
          onPress={() => sortBooks('authorAsc')}
        >
          <Text style={styles.sortButtonText}>Autor A - Z</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortOption === 'authorDesc' && styles.activeSortButton]}
          onPress={() => sortBooks('authorDesc')}
        >
          <Text style={styles.sortButtonText}>Autor Z - A</Text>
        </TouchableOpacity>
      </View>

      {/* Books List */}
      <FlatList
        data={sortedBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.bookId}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  sortButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  activeSortButton: {
    backgroundColor: '#6200ee',
  },
  sortButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    alignItems: 'center',
    marginBottom: 10,
  },
  coverImage: {
    width: 100,
    height: 150,
    marginBottom: 5,
    borderRadius: 5,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});

export default BookListWithSorting;
