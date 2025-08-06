import React, { useEffect, useState, useContext } from 'react';
import { View, Image, Pressable, Text, StyleSheet, TextInput, TouchableOpacity, Button, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { RadioButton } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { AuthContext } from '../../../context/AuthContext.js';

import { API_BASE_URL } from '../../config/api.js'; 

const BooksView = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { timeStamp } = useContext(AuthContext);
    const { bookId } = route.params;
    const [bookDetails, setBookDetails] = useState(null);
    const [loanDetails, setLoanDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(''); // Página atual
    const [isLearn, setIsLearn] = useState(true);
    const [isReading, setIsReading] = useState(false); // Status de leitura
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState(null);

    const [showFullDescription, setShowFullDescription] = useState(false); // Estado para controlar a descrição

    const fetchBookDetails = async () => {
        console.log('Fetching data... Timestamp:', timeStamp);
        try {
            const response = await fetch(`${API_BASE_URL}/books/${bookId}/loans`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setBookDetails(data.book);
            setLoanDetails(data.loans || []);
            setLoading(false);
            console.log(data)
        } catch (err) {
            setError('Failed to load book details');
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchBookDetails();
    }, [timeStamp, bookId]);

    useEffect(() => {
        console.log("Detalhes do livro carregados:", bookDetails);

        if (bookDetails && bookDetails.status) {
            // Ajuste o estado de 'isLearn' com base no status do livro
            setIsLearn(bookDetails.status === 'não lido' ? 'não lido' : bookDetails.status);
            setIsReading(bookDetails.status === 'lendo');

            if (bookDetails.currentPage !== undefined && bookDetails.currentPage !== null) {
                setCurrentPage(String(bookDetails.currentPage));
            }
        }
    }, [bookDetails]);


    const handleUpdateProgress = async () => {
        console.log('Página Atual:', currentPage);

        let parsedPage = parseInt(currentPage, 10);
        if (isLearn === 'lendo' && (isNaN(parsedPage) || parsedPage <= 0)) {
            alert('Por favor, insira um número válido para a página.');
            return;
        }

        // Preparar os valores para envio
        let statusToSave;
        let pageToSave;

        if (isLearn === 'Lido') {
            statusToSave = 'Lido';
            pageToSave = parsedPage > 0 ? parsedPage : 0; // Use a página atual ou 0 se não for aplicável
        } else if (isLearn === 'não lido') {
            statusToSave = 'não lido';
            pageToSave = 0; // Página 0 para "não lido"
        } else if (isLearn === 'lendo') {
            statusToSave = 'lendo';
            pageToSave = parsedPage || 0; // Página atual ou 0
        }

        console.log('Atualizando Status:', statusToSave, 'Página:', pageToSave);

        try {
            const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPage: pageToSave,
                    status: statusToSave,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar progresso');
            }

            const updatedBook = await response.json();
            setBookDetails(updatedBook); // Atualize os detalhes do livro no estado
            alert('Progresso atualizado com sucesso!');
        } catch (err) {
            console.error('Erro ao atualizar progresso:', err);
        }
    };


    // Resetar a descrição para o estado reduzido quando a tela for focada
    useFocusEffect(
        React.useCallback(() => {
            setShowFullDescription(false);
        }, [])
    );

    const isBookLoaned = loanDetails.some((loan) => loan.status === 'Pendente');
    const pendingLoans = loanDetails.filter((loan) => loan.status === 'Pendente');
    const handleLoanOrReturn = () => {
        if (isBookLoaned) {
            console.log('Devolver livro');
        } else {
            console.log('Realizar empréstimo');
            if (bookDetails) {
                navigation.navigate('Loan', {
                    bookId: bookDetails._id,
                    title: bookDetails.title,
                    imageUrl: bookDetails.image_url,
                });
            }
        }
    };

    const handleEditPress = () => {
        if (bookDetails) {
            console.log("Verificação ID:" + bookDetails._id);
            navigation.navigate('EditBooks', { bookId: bookDetails._id });
        } else {
            console.error('Detalhes do livro não disponíveis');
        }
    };

    const handleReturnConfirmation = (loanId) => {
        setSelectedLoanId(loanId);
        setModalVisible(true);
    };

    const handleReturn = async () => {
        if (!selectedLoanId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/loans/${selectedLoanId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Devolvido' }),
            });
            if (!response.ok) {
                throw new Error('Erro ao registrar devolução');
            }
            const updatedLoan = await response.json();
            console.log('Devolução registrada:', updatedLoan);
            setLoanDetails(prevLoans =>
                prevLoans.map(loan =>
                    loan._id === selectedLoanId ? { ...loan, status: 'Devolvido' } : loan
                )
            );
            setModalVisible(false);
        } catch (error) {
            console.error('Erro ao registrar devolução:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../../../assets/animation3.json')}
                    autoPlay
                    loop
                    style={{ width: 200, height: 200 }}
                />
                <Text style={styles.loadingText}>Carregando estatísticas, aguarde...</Text>
            </View>
        );
    }


    if (error) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!bookDetails) {
        return (
            <View style={styles.container}>
                <Text>Livro não encontrado.</Text>
            </View>
        );
    }

    // Função para formatar a descrição, limitando a 200 caracteres
    const descriptionPreview = bookDetails.description
        ? bookDetails.description.length > 300
            ? bookDetails.description.substring(0, 300) + '...'
            : bookDetails.description
        : 'Sem descrição disponível.';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <Image
                    source={bookDetails.image_url && bookDetails.image_url.trim() !== ""
                        ? { uri: bookDetails.image_url }
                        : require('../../../assets/noImageAvailable.jpg')}
                    style={styles.bookImage}
                />
                <Text style={styles.bookTitle}>{bookDetails.title}</Text>
                <Text style={styles.bookAuthor}>{bookDetails.author}</Text>

                {/* Exibe descrição curta ou completa dependendo do estado */}
                <Text style={styles.bookDescription}>
                    {showFullDescription ? bookDetails.description : descriptionPreview}
                </Text>

                {/* Botões de "Ver mais" e "Ver menos" */}
                <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                    <Text style={styles.showMoreButton}>
                        {showFullDescription ? 'Ver menos' : 'Ver mais'}
                    </Text>
                </Pressable>

                <Text style={styles.bookGenre}>Gênero: {bookDetails.genre}</Text>
                <Text style={styles.bookPublisher}>Editora: {bookDetails.publisher}</Text>

                {pendingLoans.length > 0 && (
                    <View style={styles.loanDetailsContainer}>
                        <Text style={styles.loanDetailsTitle}>Detalhes do Empréstimo (Pendente)</Text>
                        {pendingLoans.map((loan) => (
                            <View key={loan._id}>
                                <Text style={styles.loanDetailsText}>Solicitante: {loan.borrowerName}</Text>
                                <Text style={styles.loanDetailsText}>Data do Empréstimo: {new Date(loan.loanDate).toLocaleDateString()}</Text>
                                <Text style={styles.loanDetailsText}>Data de Devolução: {new Date(loan.returnDate).toLocaleDateString()}</Text>
                                <Text style={styles.loanDetailsText}>Status: {loan.status}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.actionButtonsContainer}>
                    <Pressable style={[styles.actionButton, styles.editButton]} onPress={handleEditPress}>
                        <Text style={styles.actionButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, loanDetails.some((loan) => loan.status === 'Pendente') ? styles.returnButton : styles.loanButton]}
                        onPress={handleLoanOrReturn}
                    >
                        {loanDetails.some((loan) => loan.status === 'Pendente') ? (
                            loanDetails.map((loan) => {
                                if (loan.status === 'Pendente') {
                                    return (
                                        <Text
                                            key={loan._id}
                                            style={styles.actionButtonText}
                                            onPress={() => handleReturnConfirmation(loan._id)}
                                        >
                                            Devolução
                                        </Text>
                                    );
                                }
                                return null;
                            })
                        ) : (
                            <Text style={styles.actionButtonText}>Emprestar</Text>
                        )}
                    </Pressable>
                </View>


                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Status de Leitura</Text>
                    <View style={styles.radioGroup}>
                        <RadioButton.Group
                            onValueChange={(newValue) => {
                                setIsLearn(newValue); // Salva o valor real selecionado no estado
                                if (newValue === 'não lido') {
                                    setCurrentPage(''); // Reseta a página se a opção for "Não lido"
                                }
                            }}
                            value={isLearn} // O valor do botão atualmente ativo
                        >
                            <View style={styles.radioItem}>
                                <RadioButton value="Lido" />
                                <Text style={styles.radioLabel}>Lido</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton value="lendo" />
                                <Text style={styles.radioLabel}>Lendo</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton value="não lido" />
                                <Text style={styles.radioLabel}>Não lido</Text>
                            </View>
                        </RadioButton.Group>
                    </View>

                    {isLearn === 'lendo' && (
                        <View style={styles.pageInputContainer}>
                            <TextInput

                                style={styles.input}
                                placeholder="Digite a página atual"
                                keyboardType="numeric"
                                value={currentPage}
                                onChangeText={(text) => {
                                    setCurrentPage(text);
                                    console.log('Página Atual:', text);
                                }}
                            />
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleUpdateProgress}
                    >
                        <Text style={styles.buttonText}>Atualizar</Text>
                    </TouchableOpacity>
                </View>

                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </Pressable>

                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={isModalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>Registrar devolução do livro?</Text>
                            <View style={styles.modalButtons}>
                                <Pressable
                                    style={[styles.modalButton, styles.confirmButton]}
                                    onPress={handleReturn}
                                >
                                    <Text style={styles.modalButtonText}>Sim</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText}>Cancelar</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    bookImage: {
        width: '50%',
        height: 300,
        borderRadius: 5,
        marginBottom: 15,
        alignSelf: 'center',
        resizeMode: 'cover',
    },
    bookTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    bookAuthor: {
        fontSize: 18,
        color: '#555',
        marginBottom: 10,
        textAlign: 'center',
    },
    bookDescription: {
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
        lineHeight: 22,
        textAlign: 'justify', // Justifica o texto
    },
    bookGenre: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    bookPublisher: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    bookVisibility: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    loanDetailsContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
    },
    loanDetailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    loanDetailsText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },
    loanDetailsSeparator: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
        textAlign: 'justify',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionButton: {
        padding: 10,
        borderRadius: 5,
        width: '30%',
        alignItems: 'center',
        marginRight: 10,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
    },
    editButton: {
        backgroundColor: '#6200ee',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    loanButton: {
        backgroundColor: '#03dac6',
    },
    backButton: {
        backgroundColor: '#6200ee',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
    },
    returnButton: {
        backgroundColor: '#ff9800', // Cor diferenciada para o botão de devolver
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0 ,0 ,0 ,0.5)'
    },

    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center'
    },

    modalText: {
        fontSize: 18,
        textAlign: 'center'
    },

    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },

    modalButton: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        alignItems: 'center'
    },

    confirmButton: {
        backgroundColor: '#4CAF50'
    },

    cancelButton: {
        backgroundColor: '#F44336'
    },
    showMoreButton: {
        color: '#6200ee',
        textAlign: 'center',
        marginTop: 5,
    },
    bookDescription: {
        fontSize: 16,
        color: '#333',
        textAlign: 'justify', // Justifica o texto
    },
    readingContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f1f1f1',
        borderRadius: 10
    },
    readingTitle: {
        fontSize: 18,
        ontWeight: 'bold',
        marginBottom: 10
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Para garantir que os botões fiquem alinhados à esquerda
        marginVertical: 10,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20, // Espaço entre os itens de rádio
    },
    radioLabel: {
        fontSize: 14,
        marginLeft: 8,
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
    button: {
        backgroundColor: '#6200ee',
        marginBottom: 30,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    }, button: {
        backgroundColor: '#6200ee',
        marginBottom: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BooksView;
