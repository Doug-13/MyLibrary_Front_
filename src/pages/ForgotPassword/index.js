import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image } from 'react-native';
// import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config.js'
import { useNavigation } from '@react-navigation/native';
import colors from '../../../constants/colors.js';


export default function ForgotPassword() {
    const [userMail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(false); // Estado de carregamento
    // const router = useRouter();
    const navigation = useNavigation();

    function replacePass() {
        if (userMail !== '') {
            setLoading(true); // Ativa o estado de carregamento
            sendPasswordResetEmail(auth, userMail)
                .then(() => {
                    alert("Foi enviado um e-mail para este endereço. Verifique sua caixa de e-mail.");
                    navigation.goBack();
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    alert("Ops, alguma coisa não deu certo. " + errorMessage + ". Tente novamente!!");
                    return;
                })
                .finally(() => setLoading(false)); // Desativa o estado de carregamento
        } else {
            alert("É preciso informar um e-mail válido para efetuar a redefinição de senha");
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.containerHeader}>
                    <Text style={styles.welcome}>Redefinir Senha</Text>
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

                    <Text style={styles.title}>Email</Text>
                    <TextInput
                        placeholder="Digite seu E-mail..."
                        style={styles.input}
                        value={userMail}
                        onChangeText={setUserEmail}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={replacePass}
                        disabled={loading}
                    >
                        {loading ? (
                            <Text style={styles.buttonText}>Enviando...</Text>
                        ) : (
                            <Text style={styles.buttonText}>Enviar Instruções</Text>
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
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingStart: '5%',
        paddingEnd: '5%',
    },
    title: {
        fontSize: 20,
        marginTop: 28,
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
        paddingVertical: 12,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 19,
        color: '#ffff',
        fontWeight: 'bold',
    },
});
