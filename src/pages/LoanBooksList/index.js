// import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
// import { StyleSheet, View, Text, FlatList, TextInput } from 'react-native';
// import { Card } from 'react-native-paper';
// import { useNavigation } from '@react-navigation/native';
// import { AuthContext } from '../../../context/AuthContext.js';
// import LottieView from 'lottie-react-native';
// import { API_BASE_URL } from '../../config/api.js';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// const COLORS = {
//   primary: '#F3D00F',
//   secondary: '#4E8CFF',
//   bg: '#F8F9FA',
//   card: '#FFFFFF',
//   text: '#2D3436',
//   textSecondary: '#636E72',
//   label: '#B2BEC3',
//   border: '#E0E0E0',
//   error: '#DC3545',
//   success: '#28A745',
// };

// const RADIUS = 12;
// const ELEV = 2;

// const LoanBooksList = () => {
//   const { userMongoId } = useContext(AuthContext);
//   const navigation = useNavigation();

//   const [loanedBooks, setLoanedBooks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [bookStats, setBookStats] = useState({
//     totalBooks: 0,
//     readBooks: 0,
//     inProgressBooks: 0,
//     unreadBooks: 0,
//     activeLoans: 0,
//     returnedLoans: 0,
//     genres: {},
//   });

//   const fetchData = useCallback(async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/books/${userMongoId}/with-loans`);
//       const data = await response.json();

//       let totalBooks = 0;
//       let readBooks = 0;
//       let inProgressBooks = 0;
//       let unreadBooks = 0;
//       let activeLoansTotal = 0;
//       let returnedLoansTotal = 0;

//       const genres = {};
//       const loanedBooksList = [];

//       (Array.isArray(data) ? data : []).forEach((book) => {
//         totalBooks++;
//         if (book.status === 'Lido') readBooks++;
//         if (book.status === 'em progresso') inProgressBooks++;
//         if (book.status === 'não lido') unreadBooks++;

//         const g = book.genre || 'Sem gênero';
//         genres[g] = (genres[g] || 0) + 1;

//         if (book.loans) {
//           const allLoans = book.loans;
//           const activeLoans = allLoans.filter((loan) => loan.status !== 'Devolvido');
//           const returnedLoans = allLoans.filter((loan) => loan.status === 'Devolvido');

//           activeLoansTotal += activeLoans.length;
//           returnedLoansTotal += returnedLoans.length;

//           if (activeLoans.length > 0 || returnedLoans.length > 0) {
//             loanedBooksList.push({ ...book, activeLoans, returnedLoans });
//           }
//         }
//       });

//       setBookStats({
//         totalBooks,
//         readBooks,
//         inProgressBooks,
//         unreadBooks,
//         activeLoans: activeLoansTotal,
//         returnedLoans: returnedLoansTotal,
//         genres,
//       });

//       setLoanedBooks(loanedBooksList);
//     } catch (error) {
//       console.error('Erro ao buscar dados:', error);
//       setLoanedBooks([]);
//       setBookStats((s) => ({ ...s, activeLoans: 0, returnedLoans: 0 }));
//     } finally {
//       setLoading(false);
//     }
//   }, [userMongoId]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   // ---- helpers (não-hooks) ----
//   const fmt = (d) => {
//     const v = d ? new Date(d) : null;
//     return v && !isNaN(v) ? v.toLocaleDateString('pt-BR') : '—';
//   };

//   const getReturnDateStyle = (returnDate) => {
//     const today = new Date();
//     const dt = returnDate ? new Date(returnDate) : null;
//     if (!dt || isNaN(dt)) return { color: COLORS.textSecondary };
//     return dt > today ? { color: COLORS.success } : { color: COLORS.error };
//   };

//   // Filtro de pesquisa — declarado ANTES de qualquer retorno condicional
//   const filteredBooks = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return loanedBooks;

//     const contains = (v) => (v || '').toString().toLowerCase().includes(q);

//     return loanedBooks.filter((item) => {
//       if (contains(item.title) || contains(item.author) || contains(item.genre)) return true;

//       const inActive = (item.activeLoans || []).some(
//         (l) => contains(l.borrowerName) || contains(l.borrower_name)
//       );
//       const inReturned = (item.returnedLoans || []).some(
//         (l) => contains(l.borrowerName) || contains(l.borrower_name)
//       );
//       return inActive || inReturned;
//     });
//   }, [loanedBooks, search]);

//   // loading
//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LottieView
//           source={require('../../../assets/animation2.json')}
//           autoPlay
//           loop
//           style={{ width: 200, height: 200 }}
//         />
//         <Text style={styles.loadingText}>Carregando dados, aguarde...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.root}>
//       {/* Hero */}
//       <View style={styles.hero}>
//         <View style={styles.heroRow}>
//           <Icon
//             name="arrow-back"
//             size={26}
//             color={COLORS.text}
//             onPress={() => navigation.goBack()}
//           />
//           <Text style={styles.heroTitle}>Livros Emprestados</Text>
//           <View style={{ width: 26 }} />
//         </View>
//         <Text style={styles.heroSubtitle}>
//           Acompanhe empréstimos ativos e históricos.
//         </Text>
//       </View>

//       {/* Resumo (chips) — Ativos & Devolvidos */}
//       <View style={styles.summaryRow}>
//         <View style={styles.summaryChip}>
//           <Text style={styles.summaryChipLabel}>Ativos</Text>
//           <Text style={styles.summaryChipValue}>{bookStats.activeLoans}</Text>
//         </View>
//         <View style={styles.summaryChip}>
//           <Text style={styles.summaryChipLabel}>Devolvidos</Text>
//           <Text style={styles.summaryChipValue}>{bookStats.returnedLoans}</Text>
//         </View>
//       </View>

//       {/* Barra de pesquisa */}
//       <View style={styles.searchBar}>
//         <Icon name="search" size={20} color={COLORS.textSecondary} />
//         <TextInput
//           value={search}
//           onChangeText={setSearch}
//           placeholder="Buscar por título, autor ou pessoa..."
//           placeholderTextColor={COLORS.label}
//           style={styles.searchInput}
//           returnKeyType="search"
//         />
//         {!!search && (
//           <Icon name="close" size={20} color={COLORS.textSecondary} onPress={() => setSearch('')} />
//         )}
//       </View>

//       {/* Lista */}
//       <FlatList
//         data={filteredBooks}
//         keyExtractor={(item, index) =>
//           String(item.book_id ?? item._id ?? `${item.title}-${index}`)
//         }
//         contentContainerStyle={{ paddingBottom: 16 }}
//         ListEmptyComponent={
//           <View style={styles.emptyWrap}>
//             <LottieView
//               source={require('../../../assets/animation2.json')}
//               autoPlay
//               loop
//               style={{ width: 140, height: 140 }}
//             />
//             <Text style={styles.emptyText}>Nenhum empréstimo encontrado.</Text>
//           </View>
//         }
//         renderItem={({ item }) => (
//           <Card style={styles.card}>
//             <Text style={styles.bookTitle} numberOfLines={1}>
//               {item.title}
//             </Text>
//             {!!item.author && (
//               <Text style={styles.bookDetails} numberOfLines={1}>
//                 Autor: {item.author}
//               </Text>
//             )}
//             {!!item.genre && (
//               <Text style={styles.bookDetails} numberOfLines={1}>
//                 Gênero: {item.genre}
//               </Text>
//             )}
//             {!!item.status && <Text style={styles.bookDetails}>Status: {item.status}</Text>}

//             {/* Empréstimos ativos */}
//             {!!item.activeLoans?.length && (
//               <View>
//                 <Text style={[styles.sectionLabel, styles.activeLabel]}>Empréstimos Ativos</Text>
//                 {item.activeLoans.map((loan, index) => (
//                   <View key={`a-${index}`} style={styles.loanItemActive}>
//                     <Text style={styles.loanDetails} numberOfLines={1}>
//                       Emprestado para: {loan.borrowerName || loan.borrower_name || '—'}
//                     </Text>
//                     <Text style={styles.loanDetails}>
//                       Data do Empréstimo: {fmt(loan.loanDate ?? loan.loan_date)}
//                     </Text>
//                     <Text
//                       style={[
//                         styles.loanDetails,
//                         getReturnDateStyle(loan.returnDate ?? loan.return_date),
//                       ]}
//                     >
//                       Data da Devolução: {fmt(loan.returnDate ?? loan.return_date)}
//                     </Text>
//                   </View>
//                 ))}
//               </View>
//             )}

//             {/* Empréstimos devolvidos */}
//             {!!item.returnedLoans?.length && (
//               <View>
//                 <Text style={[styles.sectionLabel, styles.returnedLabel]}>
//                   Empréstimos Devolvidos
//                 </Text>
//                 {item.returnedLoans.map((loan, index) => (
//                   <View key={`r-${index}`} style={styles.loanItemReturned}>
//                     <Text style={styles.loanDetails} numberOfLines={1}>
//                       Emprestado para: {loan.borrowerName || loan.borrower_name || '—'}
//                     </Text>
//                     <Text style={styles.loanDetails}>
//                       Data do Empréstimo: {fmt(loan.loanDate ?? loan.loan_date)}
//                     </Text>
//                     <Text style={styles.loanDetails}>
//                       Data da Devolução: {fmt(loan.returnDate ?? loan.return_date)}
//                     </Text>
//                   </View>
//                 ))}
//               </View>
//             )}
//           </Card>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//   },

//   // Hero
//   hero: {
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F6E68B',
//   },
//   heroTitle: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: COLORS.text,
//     textAlign: 'center',
//   },
//   heroSubtitle: {
//     marginTop: 4,
//     fontSize: 12,
//     color: COLORS.text,
//     textAlign: 'center',
//     opacity: 0.9,
//   },
//   heroRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },

//   // Resumo (chips)
//   summaryRow: {
//     flexDirection: 'row',
//     gap: 10,
//     paddingHorizontal: 16,
//     paddingTop: 12,
//   },
//   summaryChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     elevation: ELEV,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   summaryChipLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
//   summaryChipValue: { color: COLORS.text, fontSize: 12, fontWeight: '800' },

//   // Barra de pesquisa
//   searchBar: {
//     marginTop: 10,
//     marginHorizontal: 16,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     elevation: ELEV,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   searchInput: {
//     flex: 1,
//     color: COLORS.text,
//     fontSize: 14,
//     paddingVertical: 0,
//   },

//   // Card base (MD3)
//   card: {
//     marginHorizontal: 16,
//     marginTop: 12,
//     padding: 14,
//     backgroundColor: COLORS.card,
//     borderRadius: RADIUS,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     elevation: ELEV,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//   },

//   // Tipografia
//   bookTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
//   bookDetails: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

//   sectionLabel: { marginTop: 10, fontSize: 12, fontWeight: '800' },
//   activeLabel: { color: COLORS.secondary },
//   returnedLabel: { color: COLORS.text },

//   // Itens de empréstimo
//   loanItemActive: {
//     marginTop: 8,
//     padding: 10,
//     borderRadius: 10,
//     backgroundColor: '#EAF2FF',
//     borderWidth: 1,
//     borderColor: '#D6E4FF',
//   },
//   loanItemReturned: {
//     marginTop: 8,
//     padding: 10,
//     borderRadius: 10,
//     backgroundColor: '#FFF7CC',
//     borderWidth: 1,
//     borderColor: '#FDE68A',
//   },
//   loanDetails: { fontSize: 13, color: COLORS.text },

//   // Empty / Loading
//   emptyWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 24 },
//   emptyText: { marginTop: 8, color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//   },
//   loadingText: {
//     marginTop: 8,
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     textAlign: 'center',
//     fontWeight: '600',
//   },
// });

// export default LoanBooksList;


import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, SafeAreaView } from 'react-native';
import { Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AuthContext } from '../../../context/AuthContext.js';
import { ThemeContext } from '../../../context/ThemeContext.js';
import { API_BASE_URL } from '../../config/api.js';

const RADIUS = 12;
const ELEV = 2;

const LoanBooksList = () => {
  const { userMongoId } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const navigation = useNavigation();

  const [loanedBooks, setLoanedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookStats, setBookStats] = useState({
    totalBooks: 0,
    readBooks: 0,
    inProgressBooks: 0,
    unreadBooks: 0,
    activeLoans: 0,
    returnedLoans: 0,
    genres: {},
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books/${userMongoId}/with-loans`);
      const data = await response.json();

      let totalBooks = 0;
      let readBooks = 0;
      let inProgressBooks = 0;
      let unreadBooks = 0;
      let activeLoansTotal = 0;
      let returnedLoansTotal = 0;

      const genres = {};
      const loanedBooksList = [];

      (Array.isArray(data) ? data : []).forEach((book) => {
        totalBooks++;
        if (book.status === 'Lido') readBooks++;
        if (book.status === 'em progresso') inProgressBooks++;
        if (book.status === 'não lido') unreadBooks++;

        const g = book.genre || 'Sem gênero';
        genres[g] = (genres[g] || 0) + 1;

        if (book.loans) {
          const allLoans = book.loans;
          const activeLoans = allLoans.filter((loan) => loan.status !== 'Devolvido');
          const returnedLoans = allLoans.filter((loan) => loan.status === 'Devolvido');

          activeLoansTotal += activeLoans.length;
          returnedLoansTotal += returnedLoans.length;

          if (activeLoans.length > 0 || returnedLoans.length > 0) {
            loanedBooksList.push({ ...book, activeLoans, returnedLoans });
          }
        }
      });

      setBookStats({
        totalBooks,
        readBooks,
        inProgressBooks,
        unreadBooks,
        activeLoans: activeLoansTotal,
        returnedLoans: returnedLoansTotal,
        genres,
      });

      setLoanedBooks(loanedBooksList);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLoanedBooks([]);
      setBookStats((s) => ({ ...s, activeLoans: 0, returnedLoans: 0 }));
    } finally {
      setLoading(false);
    }
  }, [userMongoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- helpers (não-hooks) ----
  const fmt = (d) => {
    const v = d ? new Date(d) : null;
    return v && !isNaN(v) ? v.toLocaleDateString('pt-BR') : '—';
  };

  const getReturnDateStyle = (returnDate) => {
    const today = new Date();
    const dt = returnDate ? new Date(returnDate) : null;
    if (!dt || isNaN(dt)) return { color: theme.textSecondary };
    return dt > today ? { color: theme.success ?? '#28A745' } : { color: theme.error ?? '#DC3545' };
  };

  // Filtro de pesquisa
  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return loanedBooks;

    const contains = (v) => (v || '').toString().toLowerCase().includes(q);

    return loanedBooks.filter((item) => {
      if (contains(item.title) || contains(item.author) || contains(item.genre)) return true;

      const inActive = (item.activeLoans || []).some(
        (l) => contains(l.borrowerName) || contains(l.borrower_name)
      );
      const inReturned = (item.returnedLoans || []).some(
        (l) => contains(l.borrowerName) || contains(l.borrower_name)
      );
      return inActive || inReturned;
    });
  }, [loanedBooks, search]);

  // loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../../assets/animation2.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Carregando dados, aguarde...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Icon name="arrow-back" size={26} color={theme.text} onPress={() => navigation.goBack()} />
          <Text style={styles.heroTitle}>Livros Emprestados</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.heroSubtitle}>Acompanhe empréstimos ativos e históricos.</Text>
      </View>

      {/* Resumo (chips) — Ativos & Devolvidos */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>Ativos</Text>
          <Text style={styles.summaryChipValue}>{bookStats.activeLoans}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>Devolvidos</Text>
          <Text style={styles.summaryChipValue}>{bookStats.returnedLoans}</Text>
        </View>
      </View>

      {/* Barra de pesquisa */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color={theme.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título, autor ou pessoa..."
          placeholderTextColor={theme.label}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {!!search && (
          <Icon name="close" size={20} color={theme.textSecondary} onPress={() => setSearch('')} />
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item, index) => String(item.book_id ?? item._id ?? `${item.title}-${index}`)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <LottieView
              source={require('../../../assets/animation2.json')}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
            <Text style={styles.emptyText}>Nenhum empréstimo encontrado.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>

            {!!item.author && (
              <Text style={styles.bookDetails} numberOfLines={1}>
                Autor: {item.author}
              </Text>
            )}
            {!!item.genre && (
              <Text style={styles.bookDetails} numberOfLines={1}>
                Gênero: {item.genre}
              </Text>
            )}
            {!!item.status && <Text style={styles.bookDetails}>Status: {item.status}</Text>}

            {/* Empréstimos ativos */}
            {!!item.activeLoans?.length && (
              <View>
                <Text style={[styles.sectionLabel, styles.activeLabel]}>Empréstimos Ativos</Text>
                {item.activeLoans.map((loan, index) => (
                  <View key={`a-${index}`} style={styles.loanItemActive}>
                    <Text style={styles.loanDetails} numberOfLines={1}>
                      Emprestado para: {loan.borrowerName || loan.borrower_name || '—'}
                    </Text>
                    <Text style={styles.loanDetails}>
                      Data do Empréstimo: {fmt(loan.loanDate ?? loan.loan_date)}
                    </Text>
                    <Text
                      style={[
                        styles.loanDetails,
                        getReturnDateStyle(loan.returnDate ?? loan.return_date),
                      ]}
                    >
                      Data da Devolução: {fmt(loan.returnDate ?? loan.return_date)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Empréstimos devolvidos */}
            {!!item.returnedLoans?.length && (
              <View>
                <Text style={[styles.sectionLabel, styles.returnedLabel]}>Empréstimos Devolvidos</Text>
                {item.returnedLoans.map((loan, index) => (
                  <View key={`r-${index}`} style={styles.loanItemReturned}>
                    <Text style={styles.loanDetails} numberOfLines={1}>
                      Emprestado para: {loan.borrowerName || loan.borrower_name || '—'}
                    </Text>
                    <Text style={styles.loanDetails}>
                      Data do Empréstimo: {fmt(loan.loanDate ?? loan.loan_date)}
                    </Text>
                    <Text style={styles.loanDetails}>
                      Data da Devolução: {fmt(loan.returnDate ?? loan.return_date)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

/* ========================= STYLES (deixe no fim) ========================= */
const createStyles = (theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },

    // Hero
    hero: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F6E68B',
    },
    heroTitle: { fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center' },
    heroSubtitle: { marginTop: 4, fontSize: 12, color: theme.text, textAlign: 'center', opacity: 0.9 },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    // Resumo (chips)
    summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
    summaryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    summaryChipLabel: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
    summaryChipValue: { color: theme.text, fontSize: 12, fontWeight: '800' },

    // Barra de pesquisa
    searchBar: {
      marginTop: 10,
      marginHorizontal: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    searchInput: { flex: 1, color: theme.text, fontSize: 14, paddingVertical: 0 },

    // Card base (MD3)
    card: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 14,
      backgroundColor: theme.card,
      borderRadius: RADIUS,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: ELEV,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },

    // Tipografia
    bookTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    bookDetails: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },

    sectionLabel: { marginTop: 10, fontSize: 12, fontWeight: '800' },
    activeLabel: { color: theme.secondary },
    returnedLabel: { color: theme.text },

    // Itens de empréstimo
    loanItemActive: {
      marginTop: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: '#EAF2FF', // dica visual para "ativo"
      borderWidth: 1,
      borderColor: '#D6E4FF',
    },
    loanItemReturned: {
      marginTop: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: '#FFF7CC', // dica visual para "histórico"
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    loanDetails: { fontSize: 13, color: theme.text },

    // Empty / Loading
    emptyWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 24 },
    emptyText: { marginTop: 8, color: theme.textSecondary, fontSize: 14, textAlign: 'center' },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.bg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      fontWeight: '600',
    },
  });

export default LoanBooksList;
