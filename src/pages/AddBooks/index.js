import React, { useState, useEffect, useContext, useCallback } from 'react';
import { SafeAreaView, Text, TextInput, StyleSheet, Button, Alert, Platform, StatusBar, View, TouchableOpacity, Modal, Image, ScrollView, BackHandler } from 'react-native';
// import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';
import { AirbnbRating } from 'react-native-ratings';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../../context/AuthContext.js';
// import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'; // Importa o hook useRoute
import axios from 'axios';

import { API_BASE_URL } from '../../config/api.js';

const AddBooks = () => {
    const navigation = useNavigation();
    const route = useRoute(); // Acessa os parâmetros da rota
    const [isbn, setIsbn] = useState('');
    const [bookDetails, setBookDetails] = useState(null);
    // const [showCamera, setShowCamera] = useState(false);
    // const [hasPermission, setHasPermission] = useState(null);
    const { control, handleSubmit, getValues, setValue } = useForm({
        defaultValues: {
            genre: '', // Valor padrão
        },
    })
    const [isPublic, setIsPublic] = useState(false); // Privado
    const [notifyFriends, setNotifyFriends] = useState(false); // Não
    const [isLearn, setIsLearn] = useState('Não lido');
    const { book } = route.params || {}; // Obtém o livro passado como parâmetro

    const { nome_completo, userMongoId, userId, userProfilePicture } = useContext(AuthContext);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [genres, setGenres] = useState([]);

    const [customGenre, setCustomGenre] = useState('');
    const [rating, setRating] = useState(0);
    const [currentPage, setCurrentPage] = useState('');
    const [page_count, setPageCount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOtherGenre, setIsOtherGenre] = useState(false); // Estado para saber se o usuário escolheu "Outro"
    const [image, setImage] = useState('');


    useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            // Limpar informações quando sair da tela
            setIsbn('');
            setBookDetails(null);
            setImage('');
            setValue('title', '');
            setValue('author', '');
            setValue('isbn', '');
            setValue('publisher', '');
            setValue('publishedDate', '');
            setValue('description', '');
            setValue('genre', '');
            setValue('page_count', '');
            setIsLearn('Não lido');
            setIsPublic(false);
            setNotifyFriends(false);
            setRating(0);
            setCurrentPage('');
        });

        return unsubscribe;
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                Alert.alert(
                    "Voltar",
                    "Deseja salvar as alterações antes de sair?",
                    [
                        {
                            text: "Não",
                            onPress: () => navigation.goBack(), // Voltar sem salvar
                            style: "cancel",
                        },
                        {
                            text: "Sim",
                            onPress: handleSaveChanges, // Salvar e voltar
                        },
                    ],
                    { cancelable: true }
                );
                return true; // Impede o comportamento padrão de voltar
            };

            const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);

            return () => {
                backHandler.remove(); // Correto com a nova API
            };
        }, [navigation])
    );

    // useEffect(() => {
    //     (async () => {
    //         const cameraStatus = await Camera.requestCameraPermissionsAsync();
    //         setHasPermission(cameraStatus.status === 'granted');
    //     })();
    // }, []);

    const handleRatingChange = (newRating) => {
        console.log('Nova Avaliação:', newRating);
        setRating(newRating);
    };

    useEffect(() => {
        if (book) {
            console.log('Livro recebido:', book);
            setBookDetails(book); // Atualiza o estado com os dados do livro
        }
    }, [book]);

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            let image_url = '';
            // Caso a imagem seja de uma URL da API, usamos diretamente
            if (image && (isImageFromAPI || image.startsWith("http"))) {
                image_url = image;
            }
            // Caso contrário, fazemos o upload da imagem para o Firebase Storage
            else if (image) {
                const response = await fetch(image);
                const blob = await response.blob();
                const imageRef = ref(storage, `images/books/${Date.now()}`);
                const snapshot = await uploadBytes(imageRef, blob);
                image_url = await getDownloadURL(snapshot.ref);
            }

            // Dados a serem enviados
            const genreToSave = selectedGenre === 'Outro' ? customGenre : selectedGenre;

            const projectData = {
                title: getValues('title') || bookDetails?.volumeInfo?.title || 'Título Desconhecido',
                author: getValues('author') || bookDetails?.volumeInfo?.authors?.join(', ') || 'Autor Desconhecido',
                isbn: isbn || bookDetails?.volumeInfo?.industryIdentifiers?.[0]?.identifier || 'N/A',
                publisher: getValues('publisher') || bookDetails?.volumeInfo?.publisher || 'Desconhecido',
                page_count: getValues('page_count') || bookDetails?.volumeInfo?.pageCount || '0',
                publishedDate: getValues('publishedDate') || bookDetails?.volumeInfo?.publishedDate || 'N/A',
                description: getValues('description') || bookDetails?.volumeInfo?.description || 'Sem descrição',
                image_url: image_url || bookDetails?.volumeInfo?.imageLinks?.thumbnail || '',
                visibility: isPublic ? 'public' : 'private',
                isLearned: isLearn,
                owner_id: userMongoId,
                genre: genreToSave || 'Outros',
                rating: rating || bookDetails?.volumeInfo?.averageRating || 3,
                currentPage: currentPage || '0',

            };

            console.log(projectData)
            // Enviar dados ao servidor
            const response = await fetch(`${API_BASE_URL}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            });


            if (response.ok) {
                const responseData = await response.json(); // Processa a resposta como JSON

                console.log(responseData); // Verifique a estrutura da resposta

                if (responseData._id) {
                    if (notifyFriends) {
                        // Montando os dados da notificação
                        const messageData = {
                            messageType: 'bookAdded',
                            recipient_id: "allFriends", // Substituir pelo ID do amigo
                            book_id: responseData._id, // ID do livro cadastrado
                            user_id: userMongoId,
                            created_at: new Date().toISOString(),
                        };

                        // Log dos dados da notificação antes do envio
                        console.log('Dados da notificação:', messageData);

                        try {
                            const notificationResponse = await axios.post(
                                `${API_BASE_URL}/notifications`,
                                messageData
                            );

                            // Log após a resposta da API de notificação
                            console.log('Resposta da API de notificação:', notificationResponse.data);

                            if (notificationResponse.status === 201) {
                                // alert('Informamos seus amigos que você adicionou um novo livro!');
                            }
                        } catch (error) {
                            console.error('Erro ao enviar notificação:', error.response?.data || error.message);
                            alert('Erro ao notificar amigos.');
                        }
                    }

                    Alert.alert('Sucesso', 'Livro cadastrado com sucesso!');

                    // Limpar os campos do formulário e estados
                    setIsbn('');
                    setBookDetails(null);
                    setImage(null);
                    setValue('title', '');
                    setValue('author', '');
                    setValue('isbn', '');
                    setValue('publisher', '');
                    setValue('publishedDate', '');
                    setValue('description', '');
                    setValue('genre', '');
                    setValue('isLearn', '');
                    setValue('currentPage', '');
                    setCustomGenre('');
                    setSelectedGenre('');

                    navigation.navigate('HomeTabs', {
                        screen: 'HomeMainScreen',
                        params: { newBookAdded: true },
                    });
                }
            } else {
                throw new Error('Erro ao cadastrar o livro');
            }
        } catch (error) {
            console.error('Erro ao enviar dados ao servidor:', error);
            Alert.alert('Erro', 'Erro ao cadastrar o livro.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/books/${userMongoId}/genres`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        // Filtra e ordena os gêneros recebidos
                        const filteredGenres = data.filter((genre) => genre).sort((a, b) => a.localeCompare(b));
                        setGenres(filteredGenres);
                    } else {
                        // Nenhum gênero encontrado, define lista vazia
                        setGenres([]);
                    }
                } else {
                    // Caso a resposta não seja "ok", define a lista como vazia
                    setGenres([]);
                    Alert.alert('Informação', 'Crie seus próprios gêneros ou seções para personalizar sua biblioteca!');
                }
            } catch {
                // Em caso de erro, define a lista como vazia e mostra uma mensagem genérica
                setGenres([]);
                Alert.alert('Informação', 'Crie seus próprios gêneros ou seções para personalizar sua biblioteca!');
            }
        };

        fetchGenres();
    }, [userId]);

    // const renderAirbnbRating = () => {
    //     return (
    //         <>
    //             <Text style={styles.label}>Avaliação do Livro</Text>
    //             {/* Substituindo defaultRating diretamente no estado */}
    //             <AirbnbRating
    //                 count={5}
    //                 reviews={["Terrível", "Ruim", "Médio", "Bom", "Muito bom"]}
    //                 onFinishRating={handleRatingChange}
    //                 size={30}
    //                 showRating
    //             />
    //             <Text style={styles.ratingText}>Você avaliou: {rating} estrelas</Text>
    //         </>
    //     );
    // };

    const renderRating = () => (
        <View style={styles.ratingContainer}>
            <Text style={styles.label}>Avaliação do Livro</Text>
            <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)} // Define a avaliação clicada
                    >
                        <Icon
                            name={star <= rating ? "star" : "star-border"} // Ícone preenchido ou contornado
                            size={50}
                            defaultRating={bookDetails?.rating || 0} // Define o valor inicial
                            rating={rating}
                            color="#fdd835" // Cor amarela
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
    // if (hasPermission === null) {
    //     return <Text>Solicitando permissão da câmera...</Text>;
    // }
    // if (hasPermission === false) {
    //     return <Text>Sem acesso à câmera</Text>;
    // }

    return (
        <SafeAreaView style={styles.container}>

            <ScrollView contentContainerStyle={styles.bookDetailsContainer}>
                {bookDetails?.volumeInfo?.imageLinks?.thumbnail ? (
                    <Image
                        source={{ uri: bookDetails.volumeInfo.imageLinks.thumbnail }}
                        style={styles.bookImage}
                    />
                ) : (
                    <Text>Imagem não disponível</Text>
                )}
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Título:</Text> {bookDetails?.volumeInfo?.title}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Autor(es):</Text> {bookDetails?.volumeInfo?.authors?.join(', ')}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Editora:</Text> {bookDetails?.volumeInfo?.publisher}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Categoria:</Text> {bookDetails?.volumeInfo?.categories?.join(', ') || 'N/A'}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Data de Publicação:</Text> {bookDetails?.volumeInfo?.publishedDate}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Classificação Média:</Text> {bookDetails?.volumeInfo?.averageRating || 'N/A'}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Número de Páginas:</Text> {bookDetails?.volumeInfo?.pageCount || 0}
                </Text>
                <Text style={styles.bookDetailText}>
                    <Text style={styles.boldText}>Descrição:</Text> {bookDetails?.volumeInfo?.description || 'N/A'}
                </Text>

                <TouchableOpacity onPress={() =>
                    Alert.alert(
                        "O que é a Prateleira?",
                        "A prateleira permite organizar seus livros da forma que preferir. Você pode criar seções como favoritos, por autor, gênero ou qualquer outro critério que facilite o acesso e a organização dos seus livros."
                    )
                }
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, }}
                >
                    <Text style={{ fontSize: 16, marginRight: 5, justifyContent: 'center' }}>Prateleira</Text>
                    <Icon name="help-outline" size={24} color="gray" />

                </TouchableOpacity>

                <Controller
                    control={control}
                    name="genre"
                    render={({ field: { onChange, value } }) => (
                        <View>
                            <Picker
                                selectedValue={selectedGenre}
                                style={styles.picker}
                                onValueChange={(itemValue) => {
                                    setSelectedGenre(itemValue);
                                    onChange(itemValue);
                                    if (itemValue === 'Outro') {
                                        setIsOtherGenre(true);
                                        setCustomGenre(''); // Limpa o campo customGenre quando "Outro" for selecionado
                                    } else {
                                        setIsOtherGenre(false);
                                        setCustomGenre(''); // Limpa o campo customGenre quando qualquer outro gênero for selecionado
                                    }
                                }}
                            >
                                <Picker.Item label="Selecione ou crie uma prateleira" value="" />
                                {genres.map((genre, index) => (  // Supondo que genre é uma string
                                    <Picker.Item key={index} label={genre} value={genre} />  // Usa o gênero diretamente
                                ))}
                                <Picker.Item label="Outro" value="Outro" />
                            </Picker>

                            {isOtherGenre && ( // Mostra o campo de texto se "Outro" for selecionado
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite o gênero"
                                    value={customGenre}
                                    onChangeText={(text) => {
                                        setCustomGenre(text);
                                        onChange(text); // Atualiza o valor do formulário
                                    }}
                                />
                            )}
                        </View>
                    )}
                />
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Deixar Visível?</Text>
                    <View style={styles.radioGroup}>
                        <RadioButton.Group
                            onValueChange={newValue => setIsPublic(newValue === 'public')}
                            value={isPublic ? 'public' : 'private'}
                        >
                            <View style={styles.radioItem}>
                                <RadioButton value="public" />
                                <Text style={styles.radioLabel}>Público</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton value="private" />
                                <Text style={styles.radioLabel}>Privado</Text>
                            </View>
                        </RadioButton.Group>
                    </View>

                    <Text style={styles.label}>Notificar Amigos?</Text>
                    <View style={styles.radioGroup}>
                        <RadioButton.Group
                            onValueChange={newValue => setNotifyFriends(newValue === 'yes')}
                            value={notifyFriends ? 'yes' : 'no'}
                        >
                            <View style={styles.radioItem}>
                                <RadioButton value="yes" />
                                <Text style={styles.radioLabel}>Sim</Text>
                            </View>
                            <View style={styles.radioItem}>
                                <RadioButton value="no" />
                                <Text style={styles.radioLabel}>Não</Text>
                            </View>
                        </RadioButton.Group>
                    </View>

                    <View>
                        <Text style={styles.label}>Já leu este livro?</Text>
                        <View style={styles.radioGroup}>
                            <RadioButton.Group
                                onValueChange={(newValue) => {
                                    setIsLearn(newValue); // Salva o valor real selecionado no estado
                                    if (newValue === 'Não lido') {
                                        setCurrentPage(''); // Reseta a página quando selecionado "Não lido"
                                    }
                                }}
                                value={isLearn} // O valor do botão atualmente ativo
                            >
                                <View style={styles.radioItem}>
                                    <RadioButton value="Lido" />
                                    <Text style={styles.radioLabel}>Lido</Text>
                                </View>
                                <View style={styles.radioItem}>
                                    <RadioButton value="Lendo" />
                                    <Text style={styles.radioLabel}>Lendo</Text>
                                </View>
                                <View style={styles.radioItem}>
                                    <RadioButton value="Não lido" />
                                    <Text style={styles.radioLabel}>Não lido</Text>
                                </View>
                            </RadioButton.Group>
                        </View>
                    </View>

                    {/* Renderizar o componente de avaliação se estiver em "Lido" 
                   // {isLearn === 'Lido' && renderAirbnbRating()}*/}

                    {/* Renderizar o campo para página atual se estiver em "Lendo" */}
                    {isLearn === 'Lendo' && (
                        <View style={styles.pageInputContainer}>
                            <TextInput
                                style={styles.pageInput}
                                placeholder="Digite a página atual"
                                keyboardType="numeric"
                                value={currentPage}
                                onChangeText={setCurrentPage}
                            />
                        </View>
                    )}
                </View>

                <View>
                    {renderRating()}
                </View>
                <TouchableOpacity style={styles.button} onPress={handleSubmit(handleSaveChanges)}>
                    <Text style={styles.buttonText}>Adicionar Livro</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 32,
        color: '#000',
        marginBottom: 16,
        textAlign: 'center',
    },

    input: {
        flex: 3,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
    },
    bookDetailsContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    bookImage: {
        width: 150,
        height: 200,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 16,
    },
    bookDetailText: {
        fontSize: 16,
        marginBottom: 8,
    },
    boldText: {
        fontWeight: 'bold',
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
    ratingText: {
        fontSize: 16,
        marginTop: 20,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: '#f3d00f', // Cor de fundo do botão
        paddingVertical: 16, // Espaçamento vertical
        paddingHorizontal: 20, // Espaçamento horizontal
        borderRadius: 6, // Cantos arredondados
        alignItems: 'center', // Centraliza o texto
        marginTop: 20, // Margem superior
        marginBottom: 30
    },
    buttonText: {
        color: '#333', // Cor do texto
        fontSize: 16, // Tamano da fonte
        fontWeight: 'bold', // Negrito
        textAlign: 'center', // Centraliza o texto
    },
    pageInputContainer: {
        marginTop: 10,
    },
    pageInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333', // Cor do texto
        marginBottom: 8, // Espaço abaixo do texto
    },
    picker: {
        height: 60,
        width: '100%',
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    switchContainer: {
        backgroundColor: '#fff',
    }, ratingContainer: {
        marginVertical: 20,
    },
    stars: {
        flexDirection: "row",
    },
});

export default AddBooks;
