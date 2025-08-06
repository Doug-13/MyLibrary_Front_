import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js'; 

const LoanBooksList = () => {
    const { userMongoId } = useContext(AuthContext);
    const navigation = useNavigation();
    const screenWidth = Dimensions.get("window").width;
    const [loanedBooks, setLoanedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookStats, setBookStats] = useState({
        totalBooks: 0,
        readBooks: 0,
        inProgressBooks: 0,
        unreadBooks: 0,
        loanedBooks: 0,
        genres: {},
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/books/${userMongoId}/with-loans`
                );
                const data = await response.json();
                let totalBooks = 0, readBooks = 0, inProgressBooks = 0, unreadBooks = 0, loanedBooksCount = 0;
                const genres = {};
                const loanedBooksList = [];

                data.forEach((book) => {
                    totalBooks++;
                    if (book.status === "Lido") readBooks++;
                    if (book.status === "em progresso") inProgressBooks++;
                    if (book.status === "não lido") unreadBooks++;

                    if (book.loans) {
                        const allLoans = book.loans;
                        const activeLoans = allLoans.filter((loan) => loan.status !== "Devolvido");
                        const returnedLoans = allLoans.filter((loan) => loan.status === "Devolvido");

                        loanedBooksCount += activeLoans.length;

                        if (activeLoans.length > 0 || returnedLoans.length > 0) {
                            loanedBooksList.push({ ...book, activeLoans, returnedLoans });
                        }
                    }

                    genres[book.genre] = (genres[book.genre] || 0) + 1;
                });

                setBookStats({
                    totalBooks,
                    readBooks,
                    inProgressBooks,
                    unreadBooks,
                    loanedBooks: loanedBooksCount,
                    genres,
                });

                setLoanedBooks(loanedBooksList);
                setLoading(false);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        };

        fetchData();
    }, [userMongoId]);

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

    const getReturnDateStyle = (returnDate) => {
        const today = new Date();
        const returnDateObj = new Date(returnDate);
        if (returnDateObj > today) {
            return { color: 'green' }; // Red for future return date
        } else {
            return { color: 'red' }; // Green for past or current return date
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Livros Emprestados</Text>

            {/* FlatList to handle scrolling */}
            <FlatList
                data={loanedBooks}
                keyExtractor={(item) => item.book_id.toString()}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <Text style={styles.bookTitle}>{item.title}</Text>
                        <Text style={styles.bookDetails}>Autor: {item.author}</Text>
                        <Text style={styles.bookDetails}>Gênero: {item.genre}</Text>
                        <Text style={styles.bookDetails}>Status: {item.status}</Text>

                        {/* Empréstimos ativos */}
                        {item.activeLoans.length > 0 && (
                            <>
                                <Text style={styles.bookDetailsActive}>Empréstimos Ativos:</Text>
                                {item.activeLoans.map((loan, index) => (
                                    <View key={index} style={styles.loanItemActive}>
                                        <Text style={styles.loanDetails}>Emprestado para: {loan.borrowerName}</Text>
                                        <Text style={styles.loanDetails}>Data do Empréstimo: {new Date(loan.loanDate).toLocaleDateString()}</Text>
                                        <Text style={[styles.loanDetails, getReturnDateStyle(loan.returnDate)]}>
                                            Data da Devolução: {new Date(loan.returnDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}

                        {/* Empréstimos devolvidos */}
                        {item.returnedLoans.length > 0 && (
                            <>
                                <Text style={styles.bookDetailsReturned}>Empréstimos Devolvidos:</Text>
                                {item.returnedLoans.map((loan, index) => (
                                    <View key={index} style={styles.loanItemReturned}>
                                        <Text style={styles.loanDetails}>Emprestado para: {loan.borrowerName}</Text>
                                        <Text style={styles.loanDetails}>Data do Empréstimo: {new Date(loan.loanDate).toLocaleDateString()}</Text>
                                        <Text style={styles.loanDetails}>Data da Devolução: {new Date(loan.returnDate).toLocaleDateString()}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </Card>
                )}
            // ListFooterComponent={
            //     <Card style={styles.card}>
            //         <Text style={styles.cardTitle}>Status dos Livros</Text>
            //     </Card>
            // }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f8f8f8",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginVertical: 16,
    },
    card: {
        marginBottom: 16,
        backgroundColor: "#ffffff",
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    bookDetails: {
        fontSize: 16,
        marginBottom: 4,
    },
    loanItemActive: {
        backgroundColor: '#e0f7fa',  // Light blue for active loans
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    loanItemReturned: {
        backgroundColor: '#FFF9C4',  // Light gray for returned loans
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    loanDetails: {
        fontSize: 14,
        marginBottom: 4,
    },
    bookDetailsActive: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00796b',  // Teal color for active loans section
        marginBottom: 8,
    },
    bookDetailsReturned: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#616161',  // Dark gray for returned loans section
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
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

export default LoanBooksList;
