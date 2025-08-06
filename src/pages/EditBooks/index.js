import React, { useState, useEffect, useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, Text, TextInput, StyleSheet, Button, Alert, View, Image, ScrollView, TouchableOpacity, ActivityIndicator, } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { RadioButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { storage } from '../../firebase/firebase.config.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthContext } from '../../../context/AuthContext.js';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from 'react-native-vector-icons/MaterialIcons';
// import * as ImagePicker from 'expo-image-picker';
import { deleteObject } from 'firebase/storage';

import { API_BASE_URL } from '../../config/api.js'; 

const EditBooks = ({ route, navigation }) => {
    const { bookId } = route.params || {}; // bookId pode ser indefinido
    const { userId, userMongoId } = useContext(AuthContext);
    const { control, handleSubmit, setValue, reset } = useForm();
    const [isPublic, setIsPublic] = useState(true);
    const [isLearn, setIsLearn] = useState(true);
    const [image, setImage] = useState(null);
    const [isImageFromAPI, setIsImageFromAPI] = useState(false);
    const [bookDetails, setBookDetails] = useState(null);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [customGenre, setCustomGenre] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState('');
    const [isOtherGenre, setIsOtherGenre] = useState(false);
    const [rating, setRating] = useState(0);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const initializeForm = () => {
        reset();
        setImage(null);
        setSelectedGenre('');
        setCustomGenre('');
        setCurrentPage('');
        setRating(0);
        setIsOtherGenre(false);
        setIsPublic(true);
        setIsLearn(true);
        setBookDetails(null);
    };

    const handleRatingChange = (newRating) => {
        console.log('Nova Avaliação:', newRating);
        setRating(newRating);
    };
    // Obtenha o ID do livro a partir dos parâmetros da rota
    const clearStates = () => {
        reset(); // Limpa os campos do formulário
        setImage(null);
        setSelectedGenre('');
        setCustomGenre('');
        setCurrentPage('');
        setRating(0);
        setIsOtherGenre(false);
        setIsPublic(true);
        setIsLearn(true);
        setBookDetails(null);
        // setGenres([]);
    };

    useEffect(() => {
        if (bookDetails?.currentPage) {
            setCurrentPage(String(bookDetails.currentPage));
        }
    }, [bookDetails]);
    // Limpeza ao sair da tela
    useFocusEffect(
        React.useCallback(() => {
            const fetchDataOnFocus = async () => {
                if (bookId) {
                    setIsLoading(true);
                    try {
                        const response = await fetch(`${API_BASE_URL}/books/${bookId}/book`);
                        const data = await response.json();

                        if (response.ok) {
                            setBookDetails(data);
                            setValue('title', data.title);
                            setValue('author', data.author);
                            setValue('publisher', data.publisher);
                            setValue('publishedDate', data.publishedDate);
                            setValue('description', data.description);
                            setValue('genre', data.genre);
                            setValue('visibility', data.visibility);
                            setValue('rating', data.rating);
                            setValue('status', data.status);
                            setValue('currentPage', data.currentPage);
                            setImage(data.image_url);
                            setIsImageFromAPI(!!data.image_url);
                            setSelectedGenre(data.genre);

                            setIsPublic(data.visibility === 'public');
                            setIsLearn(data.status);

                            // Define o rating inicial
                            setRating(data.rating || 0);
                        } else {
                            Alert.alert('Erro', 'Não foi possível obter os detalhes do livro.');
                        }
                    } catch (error) {
                        console.error('Erro ao buscar detalhes do livro:', error);
                        Alert.alert('Erro', 'Erro ao buscar detalhes do livro.');
                    } finally {
                        setIsLoading(false);
                    }
                }
            };

            fetchDataOnFocus();

            // Retorna uma função para limpar o estado somente se necessário
            return () => {
                setBookDetails(null);
            };
        }, [bookId])
    );

    const handleDeleteBook = async () => {
        Alert.alert(
            "Confirmação",
            "Tem certeza de que deseja deletar este livro?",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Deletar",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
    
                            // Verifica se há uma imagem associada ao livro
                            if (image) {
                                const imageRef = ref(storage, decodeURIComponent(image.split('/').slice(-1)[0]));
                                try {
                                    await deleteObject(imageRef);
                                    console.log("Imagem deletada com sucesso!");
                                } catch (error) {
                                    console.error("Erro ao deletar a imagem do Firebase:", error);
                                }
                            }
    
                            // Deleta o livro na API
                            const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
                                method: 'DELETE',
                            });
    
                            if (response.ok) {
                                Alert.alert("Sucesso", "Livro deletado com sucesso!");
                                navigation.goBack(); // Volta para a tela anterior
                            } else {
                                Alert.alert("Erro", "Não foi possível deletar o livro.");
                            }
                        } catch (error) {
                            console.error("Erro ao deletar o livro:", error);
                            Alert.alert("Erro", "Erro ao deletar o livro.");
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };


    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        // Formata a data para exibição no campo
        const formattedDate = formatarData(date);
        setValue('publishedDate', formattedDate); // Atualiza o valor no formulário
        hideDatePicker();
    };


    useEffect(() => {
        if (bookId) {
            const fetchBookDetails = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/books/${bookId}/book`);
                    const data = await response.json();

                    if (response.ok) {
                        setBookDetails(data);
                        setValue('title', data.title);
                        setValue('author', data.author);
                        setValue('publisher', data.publisher);
                        setValue('publishedDate', data.publishedDate);
                        setValue('description', data.description);
                        setValue('page_count', data.page_count);
                        setValue('genre', data.genre);
                        setValue('visibility', data.visibility);
                        setValue('rating', data.rating);
                        setValue('status', data.status);
                        setValue('currentPage', data.currentPage);
                        setImage(data.image_url);
                        setIsImageFromAPI(!!data.image_url);
                        setSelectedGenre(data.genre);
                        setIsPublic(data.visibility === 'public');
                        setIsLearn(data.status);
                        setRating(data.rating || 0);
                    } else {
                        Alert.alert('Erro', 'Não foi possível obter os detalhes do livro.');
                    }
                } catch (error) {
                    console.error('Erro ao buscar detalhes do livro:', error);
                    Alert.alert('Erro', 'Erro ao buscar detalhes do livro.');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchBookDetails();
            setIsLoading(false);
        } else {
            initializeForm();
        }
    }, [bookId]);

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
        setIsLoading(false);
    }, [userId]);

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
                            setImage(result.assets[0].uri);  // Use o URI da imagem corretamente
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
                            setImage(result.assets[0].uri);  // Use o URI da imagem corretamente
                            setIsImageFromAPI(false);
                        }
                    }
                },
                { text: "Cancelar", style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    // Verifique se o valor de rating está mudando corretamente
    useEffect(() => {
        console.log('Estado Atualizado:', rating); // Verifica o estado atualizado
    }, [rating]);

    const handleSaveChanges = async (data) => {
        setIsLoading(true);
        try {
            let image_url = '';

            if (image && !isImageFromAPI) {
                const response = await fetch(image);
                const blob = await response.blob();
                const imageRef = ref(storage, `images/books/${Date.now()}`);
                const snapshot = await uploadBytes(imageRef, blob);
                image_url = await getDownloadURL(snapshot.ref);
            } else if (isImageFromAPI) {
                image_url = image;
            }

            const updatedData = {
                title: data.title,
                author: data.author,
                publisher: data.publisher,
                publishedDate: data.publishedDate,
                description: data.description,
                page_count: data.page_count,
                visibility: isPublic ? 'public' : 'private',
                image_url,
                owner_id: userMongoId,
                genre: isOtherGenre ? customGenre : data.genre,
                status: isLearn,
                rating,
            };

            if (!bookId) {
                // Create a new book
                const response = await fetch(`${API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });

                if (response.ok) {
                    Alert.alert('Sucesso', 'Livro criado com sucesso!');
                } else {
                    Alert.alert('Erro', 'Não foi possível criar o livro.');
                }
            } else {
                // Update existing book
                const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });

                if (response.ok) {
                    Alert.alert('Sucesso', 'Livro atualizado com sucesso!');
                } else {
                    Alert.alert('Erro', 'Não foi possível atualizar o livro.');
                }
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            Alert.alert('Erro', 'Erro ao salvar os dados.');
        } finally {
            setIsLoading(false);
        }
    };


    const formatarData = (data) => {
        const dia = data.getDate().toString().padStart(2, '0'); // Garante que o dia tem 2 dígitos
        const mes = (data.getMonth() + 1).toString().padStart(2, '0'); // Garante que o mês tem 2 dígitos
        const ano = data.getFullYear();

        return `${dia}/${mes}/${ano}`;
    };

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

    if (isLoading) {
        return <ActivityIndicator size="large" color="#6200ea" />;
    }

    // if (!bookDetails) {
    //     return <Text>Carregando...</Text>;
    // }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Editar Livro</Text>

                <View style={styles.imageContainer}>
                    <TouchableOpacity onPress={handleImagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.bookImage} />
                        ) : (
                            <View style={styles.placeholder}>
                                <Text style={styles.placeholderText}>Imagem não disponível</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleImagePicker} style={styles.imagePicker}>
                        <Icon name="camera" size={24} color="#333" />
                        <Text style={styles.imageText}> Nova Capa</Text>
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
                    <Text style={styles.label}>Número de Páginas:</Text>
                    <Controller
                        control={control}
                        name="page_count"
                        render={({ field: { onChange, value } }) => {
                            console.log("Valor de page_count:", typeof value); // Verifique o valor
                            return (
                                <TextInput
                                    style={styles.input}
                                    placeholder="Quantidade de Páginas"
                                    value={value ? String(value) : ''} // Garanta que o valor esteja no formato correto
                                    onChangeText={onChange}
                                />
                            );
                        }}
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
                                        setIsOtherGenre(itemValue === 'Outro'); // Verifica se "Outro" foi selecionado
                                        if (itemValue !== 'Outro') {
                                            setCustomGenre(''); // Limpa o valor de customGenre
                                        }
                                        onChange(itemValue); // Atualiza o formulário
                                    }}
                                >
                                    {genres.map((genre) => (
                                        <Picker.Item key={genre} label={genre} value={genre} />
                                    ))}
                                    <Picker.Item label="Outro" value="Outro" />
                                </Picker>

                                {isOtherGenre && (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Especifique o gênero"
                                        value={customGenre}
                                        onChangeText={setCustomGenre}
                                    />
                                )}
                            </View>
                        )}
                    />
                    <Text style={styles.label}>Data de publicação:</Text>
                    <Controller
                        control={control}
                        name="publishedDate"
                        render={({ field: { value } }) => (
                            <TouchableOpacity onPress={showDatePicker}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Data de publicação"
                                    value={value}
                                    editable={false} // Desativa a edição direta no campo
                                />
                            </TouchableOpacity>
                        )}
                    />

                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                    />
                    <Text style={styles.label}>Descrição:</Text>
                    <Controller
                        control={control}
                        name="description"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={styles.textArea}
                                placeholder="Descrição"
                                value={value}
                                onChangeText={onChange}
                                multiline
                                numberOfLines={8}
                            />
                        )}
                    />

                    {/* <Text style={styles.label}>Opções:</Text> */}
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

                        <View style={styles.switchContainer}>
                            <Text style={styles.label}>Já leu este livro?</Text>
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
                                        <RadioButton value="lido" />
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
                        </View>
                        {/* Avaliação */}
                        <View>
                            {renderRating()}
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Salvar Alterações"
                        onPress={handleSubmit(handleSaveChanges)}
                        color="#6200ea"
                    />
                    {bookId && (
                        <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: '#ff5252' }]}
                            onPress={handleDeleteBook}
                        >
                            <Text style={styles.deleteButtonText}>Deletar Livro</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
            {isLoading && <ActivityIndicator size="large" color="#6200ea" />}
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    imageContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    bookImage: {
        width: 120,
        height: 180,
        marginBottom: 10,
    },
    placeholder: {
        width: 100,
        height: 100,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    placeholderText: {
        color: '#888',
    },
    imagePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3d00f', // Cor do botão
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    imageText: {
        color: '#333', // Cor do texto
        marginLeft: 5, // Espaçamento entre o ícone e o texto
    },
    inputContainer: {
        marginBottom: 20,

    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        textAlignVertical: 'top',
    },
    picker: {
        height: 50,
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
    },
    switchContainer: {
        marginVertical: 20,
        paddingHorizontal: 16,
    },
    pageInputContainer: {
        marginTop: 10,
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
    },
    buttonText: {
        color: '#333', // Cor do texto
        fontSize: 16, // Tamano da fonte
        fontWeight: 'bold', // Negrito
        textAlign: 'center', // Centraliza o texto
    },
    ratingContainer: {
        marginVertical: 20,
    },
    stars: {
        flexDirection: "row",
    },
    deleteButton: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditBooks;
