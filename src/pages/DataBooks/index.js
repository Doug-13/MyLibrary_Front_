import React, { useState, useEffect, useRef, useContext } from 'react';
import { SafeAreaView, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, View, Modal, StatusBar, Platform, Image, ScrollView, errors, TouchableOpacity } from 'react-native';
// import { Camera, CameraView } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { RadioButton } from 'react-native-paper';
import { Switch } from 'react-native-paper';
// import * as ImagePicker from 'expo-image-picker';
import { storage } from '../../firebase/firebase.config.js'; // Firebase storage configuration
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage methods
import colors from '../../../constants/colors.js';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons'; // Importando ícones

import { API_BASE_URL } from '../../config/api.js'; 

const AddBooks = () => {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState(null);
    const [isbn, setIsbn] = useState('');
    
    const [publisher, setPublisher] = useState('');
    const [bookDetails, setBookDetails] = useState(null);
    const [notifyFriends, setNotifyFriends] = useState(false);
    const { control, handleSubmit, getValues, setValue } = useForm({
        defaultValues: {
            genre: '', // Valor padrão
        },
    })
    const [showCamera, setShowCamera] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [isLearn, setIsLearn] = useState(true);
    const [image, setImage] = useState(null);
    const [isImageFromAPI, setIsImageFromAPI] = useState(false); // Novo estado
    const { userId, userMongoId, nome_completo } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [genres, setGenres] = useState([]);
    const [customGenre, setCustomGenre] = useState(''); // Estado para gênero personalizado
    const [isOtherGenre, setIsOtherGenre] = useState(false); // Estado para saber se o usuário escolheu "Outro"
    const [overlayLayout, setOverlayLayout] = useState(null);

    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

            setHasPermission(cameraStatus.status === 'granted' && mediaStatus.status === 'granted');
        })();
    }, []);



    const fetchBookDetails = async (isbn) => {
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${isbn}`);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const bookInfo = data.items[0]?.volumeInfo; // Use optional chaining
                if (bookInfo) {
                    setBookDetails(bookInfo);
                    setValue('title', bookInfo.title || '');
                    setValue('isbn', bookInfo.industryIdentifiers?.[0]?.identifier || '');
                    setValue('author', bookInfo.authors?.join(', ') || '');
                    setValue('publisher', bookInfo.publisher || '');
                    setValue('publishedDate', bookInfo.publishedDate || '');
                    setValue('description', bookInfo.description || '');
                    // setValue('genre', bookInfo.categories?.[0] || ''); // Safe access
                }
            } else {
                Alert.alert('Erro', 'Nenhum livro encontrado.');
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes do livro:', error);
            Alert.alert('Erro', 'Não foi possível buscar os detalhes do livro.');
        }
    };



    const handleImagePicker = async () => {
        Alert.alert(
            "Selecione uma opção",
            "Você quer tirar uma foto ou escolher da galeria?",
            [
                {
                    text: "Tirar Foto",
                    onPress: async () => {
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [3, 5],
                            quality: 1,
                        });

                        if (!result.canceled) {
                            setImage(result.assets[0].uri);
                            setIsImageFromAPI(false);
                        }
                    }
                },
                {
                    text: "Escolher da Galeria",
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [3, 5],
                            quality: 1,
                        });

                        if (!result.canceled) {
                            setImage(result.assets[0].uri);
                            setIsImageFromAPI(false);
                        }
                    }
                },
                { text: "Cancelar", style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    const handleSaveProject = async () => {
        setIsLoading(true);
        try {
            let image_url = '';

            // Upload da imagem se ela não for da API
            if (image && !isImageFromAPI) {
                const response = await fetch(image);
                const blob = await response.blob();
                const imageRef = ref(storage, `images/books/${Date.now()}`);
                const snapshot = await uploadBytes(imageRef, blob);
                image_url = await getDownloadURL(snapshot.ref);
            } else if (isImageFromAPI) {
                image_url = image; // Se a imagem veio da API, usa o link da API diretamente
            }

            // Dados a serem enviados
            const projectData = {
                title: getValues('title'),
                author: getValues('author'),
                isbn: getValues('isbn'),
                publisher: getValues('publisher'),
                publishedDate: getValues('publishedDate'),
                description: getValues('description'),
                image_url,
                visibility: isPublic ? 'public' : 'private',
                isLearned: isLearn,
                owner_id: userMongoId,
                genre: getValues('genre'),

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
                if (notifyFriends) {
                    // Montando os dados da notificação
                    const messageData = {
                        message: `Seu amigo ${nome_completo} adicionou o livro ${projectData.title} à biblioteca`,
                        recipient_id: "allFriends", // Substituir pelo ID do amigo
                        sender_id: userMongoId,
                        title: projectData.title,
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
                            alert('Notificação enviada com sucesso!');
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
                setCustomGenre('');
                setSelectedGenre('');

                navigation.navigate('HomeMainScreen', { newBookAdded: true });
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

    const handleBarCodeScanned = ({ data }) => {
        if (data) {
            setIsbn(data);
            setShowCamera(false);
            fetchBookDetails(data);
        }
    };

    if (hasPermission === null) {
        return <Text>Solicitando permissão da câmera...</Text>;
    }
    if (hasPermission === false) {
        return <Text>Sem acesso à câmera</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Cadastrar Livro</Text>

        


                <View style={styles.imageContainer}>
                    <TouchableOpacity onPress={(handleImagePicker)}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.bookImage} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.placeholderText}>Imagem não disponível</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleImagePicker} style={styles.imagePicker}>
                        <Text style={styles.imageText}>Selecionar Imagem</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Título:</Text>
                    <Controller
                        control={control}
                        name="title"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Digite o título do livro"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <Text style={styles.label}>Autor:</Text>
                    <Controller
                        control={control}
                        name="author"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Digite o autor do livro"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <Text style={styles.label}>Editora:</Text>
                    <Controller
                        control={control}
                        name="publisher"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Digite a editora"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    <Text style={styles.label}>Gênero:</Text>

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
                                    <Picker.Item label="Selecione um gênero" value="" />
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

                    <Text style={styles.label}>Data de Publicação:</Text>
                    <Controller
                        control={control}
                        name="publishedDate"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.input}
                                placeholder="Digite a data de publicação"
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />

                    {/* Campo de descrição */}

                    <Text style={styles.label}>Descrição:</Text>
                    <Controller
                        control={control}
                        name="description"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.textArea}
                                placeholder="Digite uma descrição do livro"
                                value={value}
                                onChangeText={onChange}
                                multiline
                                numberOfLines={4}
                            />
                        )}
                    />

                    <Text style={styles.label}>Opções:</Text>
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Deixar Visível?</Text>
                        <View style={styles.switchItem}>
                            <Switch
                                value={isPublic}
                                onValueChange={() => setIsPublic(!isPublic)}
                            />
                            <Text style={styles.switchLabel}>{isPublic ? "Público" : "Privado"}</Text>
                        </View>

                        <Text style={styles.label}>Notificar amigos?</Text>
                        <View style={styles.switchItem}>
                            <Switch
                                value={notifyFriends}
                                onValueChange={() => setNotifyFriends(!notifyFriends)}
                            />
                            <Text style={styles.switchLabel}>{notifyFriends ? "Sim" : "Não"}</Text>
                        </View>

                        <Text style={styles.label}>Já leu este livro?</Text>
                        <View style={styles.switchItem}>
                            <Switch
                                value={isLearn}
                                onValueChange={() => setIsLearn(!isLearn)}
                            />
                            <Text style={styles.switchLabel}>{isLearn ? "Lido" : "Não lido"}</Text>
                        </View>
                    </View>
                    <View style={styles.buttonSpacing}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : (
                            <Button title="Salvar Livro" onPress={handleSaveProject} />
                        )}
                    </View>


                </View>
                {showCamera && (
                    <Modal animationType="slide" transparent={false} visible={showCamera}>
                        <View style={styles.cameraContainer}>
                            {Platform.OS === "android" ? <StatusBar hidden /> : null}
                            <CameraView
                                style={StyleSheet.absoluteFillObject}
                                facing="back"
                                onBarcodeScanned={handleBarCodeScanned}
                            />
                            <View style={styles.overlay}>
                                <Text style={styles.overlayText}>Leia o código de barras</Text>
                            </View>

                            {/* Botão de Cancelar */}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCamera(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                )}

            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: colors.primary
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        fontSize: 32,
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    bookImage: {
        width: 150,
        height: 220,
        resizeMode: 'cover',
    },

    inputContainer: {
        flexDirection: 'row', // Coloca o ícone e o campo de texto na horizontal
        alignItems: 'center', // Alinha verticalmente o conteúdo
        marginBottom: 20, // Espaçamento inferior
    },
    inputContainerBoxIsbn: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
    },
    inputContainerIsbn: {
        flexDirection: 'row', // Coloca o ícone e o campo de texto na horizontal
        alignItems: 'center', // Alinha verticalmente o conteúdo
        marginBottom: 20, // Espaçamento inferior
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
    },
    input: {
        flex: 3, // Faz o TextInput ocupar 75% da largura
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
    },
    iconButton: {
        flex: 1, // Faz o ícone ocupar 25% da largura
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10, // Espaço entre o campo de texto e o ícone
    },
    // input: {
    //     flex: 3, // Faz o TextInput ocupar 75% da largura
    //     borderWidth: 1,
    //     borderRadius: 8,
    //     padding: 10,
    // },
    // iconButton: {
    //     flex: 1, // Faz o ícone ocupar 25% da largura
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     marginLeft: 10, // Espaço entre o campo de texto e o ícone
    // },

    textArea: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    },
    placeholder: {
        width: 150,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
    },
    placeholderText: {
        color: '#777',
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    overlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
        borderRadius: 10,
    },
    overlayText: {
        color: '#fff',
        textAlign: 'center',
    },
    cancelButton: {
        position: 'absolute',
        bottom: 0, // Posiciona o botão na parte inferior
        left: 0, // Alinha à esquerda
        width: '100%', // Faz o botão ocupar toda a largura
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fundo preto com transparência
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center', // Centraliza o texto
    },
    cancelButtonText: {
        color: '#fff', // Texto branco
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    buttonSpacing: {
        flex: 1,
        marginHorizontal: 5,
    },
    bookDetails: {
        marginTop: 20,
    },
    detailText: {
        fontSize: 16,
        marginVertical: 4,
    },
    inputContainer: {
        padding: 16,
        backgroundColor: '#f9f9f9', // Cor de fundo leve
        borderRadius: 8,
        elevation: 2, // Sombra para Android
        shadowColor: '#000', // Sombra para iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        marginVertical: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333', // Cor do texto
        marginBottom: 8, // Espaço abaixo do texto
    },
    switchContainer: {
        marginVertical: 10,
    },
    switchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Espaçamento entre o switch e o texto
        marginBottom: 16, // Espaço entre os switches
    },
    switchLabel: {
        fontSize: 14,
        color: '#686', // Cor do texto do switch
    },
    picker: {
        height: 50,
        width: '100%',
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
});

export default AddBooks;
