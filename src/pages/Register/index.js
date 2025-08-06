import React, { useState, useContext } from 'react';
import { StatusBar, ActivityIndicator, KeyboardAvoidingView, View, Text, TouchableOpacity, TextInput, Image, StyleSheet, Platform, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import Feather from 'react-native-vector-icons/Feather';

import { auth } from '../../firebase/firebase.config.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
// import { baseURL } from '../../../constants/url.js';
import colors from '../../../constants/colors.js';
import { API_BASE_URL } from '../../config/api.js'; 

const api = axios.create({
    baseURL: API_BASE_URL, 
});

export default function Register() {
    const navigation = useNavigation();
    const [userName, setUserName] = useState('');
    const [userMail, setUserMail] = useState('');
    const [userPass, setUserPass] = useState('');
    const [userRePass, setUserRePass] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false); // Estado para controlar o estado de atualização
    const { register } = useContext(AuthContext);

    // Função para alternar a visibilidade da senha
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const newUser = async () => {
        if (userMail === '' || userPass === '' || userRePass === '') {
            alert('Todos os campos devem ser preenchidos');
            return;
        }
        if (userPass !== userRePass) {
            alert('A senha e confirmação devem ser iguais');
            return;
        }
        if (userPass.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        setLoading(true); // Inicia o indicador de carregamento

        try {
            // Cria o usuário no Firebase
            const UserCredential = await createUserWithEmailAndPassword(auth, userMail, userPass);
            const user = UserCredential.user;

            console.log('Usuário criado com sucesso:', user);
            console.log('ID do usuário Firebase:', user.uid);

            const userData = {
                idFirebase: user.uid,
                nome_completo: userName,
                email: userMail,
            };

            // console.log('Dados do usuário a serem enviados para o MySQL:', userData);
            // console.log(baseURL + `user/profile`)
            const response = await api.post(`${API_BASE_URL}/users`, userData);
            // console.log(response)

            // Verifica se a resposta contém sucesso, baseando-se na resposta do servidor
            if (response.status === 201) {
                alert('Usuário adicionado com sucesso');
                console.log('Resposta da API ao salvar usuário:', response.data);
                navigation.goBack();
            } else {
                alert('Erro ao salvar usuário no banco de dados');
                console.error('Erro ao salvar usuário no banco de dados:', response.data);
            }
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('Este e-mail já está em uso. Por favor, use outro e-mail.');
            } else {
                alert('Erro ao criar usuário: ' + error.message);
            }
        } finally {
            setLoading(false); // Para o carregamento
        }
    };



    const onRefresh = () => {
        setRefreshing(true);
        // Limpar os campos de e-mail e senha
        setUserMail('');
        setUserPass('');
        setUserRePass('');
        setRefreshing(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View style={styles.containerHeader}>
                    <Text style={styles.welcome}>Cadastre-se</Text>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../../../assets/logo_Preto.png')}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View style={styles.containerForm}>
                    <StatusBar style="auto" />

                    <Text style={styles.title}>Nome</Text>
                    <TextInput
                        placeholder="Digite seu nome..."
                        style={styles.input}
                        value={userName}
                        onChangeText={setUserName}
                    />
                    <Text style={styles.title}>Email</Text>
                    <TextInput
                        placeholder="Digite seu E-mail..."
                        style={styles.input}
                        value={userMail}
                        onChangeText={setUserMail}
                    />

                    <Text style={styles.title}>Senha</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            secureTextEntry={!showPassword}
                            placeholder="Digite sua senha..."
                            style={[styles.input, styles.passwordInput]}
                            value={userPass}
                            onChangeText={setUserPass}
                        />
                        <TouchableOpacity onPress={toggleShowPassword} style={styles.togglePasswordButton}>
                            <Feather name={showPassword ? 'eye' : 'eye-off'} size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>Confirmação de senha</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            secureTextEntry={!showPassword}
                            placeholder="Repita sua senha..."
                            style={[styles.input, styles.passwordInput]}
                            value={userRePass}
                            onChangeText={setUserRePass}
                        />
                        <TouchableOpacity onPress={toggleShowPassword} style={styles.togglePasswordButton}>
                            <Feather name={showPassword ? 'eye' : 'eye-off'} size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={newUser}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Cadastrar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3d00f',
    },
    containerHeader: {
        marginTop: '14%',
        marginBottom: "8%",
        paddingStart: '5%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000000',
        marginVertical: 8,
    },
    imageContainer: {
        alignItems: 'center',
    },
    image: {
        width: 300,
        height: 180,
        borderRadius: 20,
    },
    containerForm: {
        backgroundColor: '#fff',
        flex: 1,
        marginRight: 5,
        marginLeft: 5,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingStart: '5%',
        paddingEnd: '5%',
        position: 'relative', // Para posicionar o ícone de olho
    },
    title: {
        fontSize: 20,
        marginTop: 28
    },
    input: {
        borderBottomWidth: 1,
        height: 40,
        marginBottom: 10,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#000000',
        width: '100%',
        borderRadius: 6,
        paddingVertical: 8,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonText: {
        fontSize: 19,
        color: '#ffff',
        fontWeight: 'bold'
    },
    buttonRegister: {
        marginTop: 3,
        alignSelf: 'center'
    },
    registerText: {
        color: '#000000',
        marginTop: 20,
        fontSize: 15,
    },
    togglePasswordButton: {
        paddingEnd: 10,
        position: 'absolute', // Posiciona o ícone absolutamente
        right: 0, // Posiciona o ícone no canto direito do contêiner pai
        top: 0, // Posiciona o ícone no topo do contêiner pai
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',

    },
    passwordInput: {
        flex: 1,
    },
});
