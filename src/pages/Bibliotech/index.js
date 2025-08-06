import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <Image
                    source={require('../../../assets/logo_Preto.png')} // Substitua pelo logo do seu app
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Fundo para os textos */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Bem-vindo ao Bibliotech</Text>

                    <Text style={styles.paragraph}>
                        O Bibliotech é o seu aplicativo pessoal para gerenciar e compartilhar sua biblioteca de livros. Com ele, você pode organizar seus livros, explorar bibliotecas de amigos e muito mais.
                    </Text>

                    <Text style={styles.subTitle}>Principais Funcionalidades:</Text>
                    <Text style={styles.listItem}>📚 Gerencie sua biblioteca pessoal de livros.</Text>
                    <Text style={styles.listItem}>👥 Explore as bibliotecas dos seus amigos.</Text>
                    <Text style={styles.listItem}>📨 Solicite livros emprestados de outros usuários.</Text>
                    <Text style={styles.listItem}>🔄 Registre devoluções e acompanhe empréstimos.</Text>
                    <Text style={styles.listItem}>⭐ Classifique e avalie seus livros favoritos.</Text>

                    <Text style={styles.paragraph}>
                        Estamos empenhados em criar uma comunidade de leitores apaixonados, ajudando você a compartilhar histórias e conectar-se com outras pessoas por meio dos livros.
                    </Text>

                    <Text style={styles.subTitle}>Entre em contato</Text>
                    <Text style={styles.paragraph}>📧 Email: suporte@bibliotech.com</Text>
                    <Text style={styles.paragraph}>📞 Telefone: (11) 12345-6789</Text>
                    <Text style={styles.paragraph}>🌐 Website: www.bibliotech.com</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3d00f',
    },
    scrollView: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    logo: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginBottom: 10,
        borderRadius:150
    },
    textContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginVertical: 10,
        textAlign: 'justify'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginTop:10,
        marginBottom: 5,
         textAlign: 'justify'
    },
    listItem: {
        fontSize: 14,
        marginVertical: 5,
        lineHeight: 22,
    },
});
