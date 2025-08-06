import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Image, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

import { API_BASE_URL } from '../../config/api.js'; 

const ChatScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [Data, setData] = useState(null);
    // const [followStatus, setFollowStatus] = useState({ isFollowing: false, isFollowedBack: false });
    const [checkedSenders, setCheckedSenders] = useState([]);  // Armazenar remetentes verificados
    const { userMongoId, setTimeStamp, userProfilePicture, nome_completo } = useContext(AuthContext);
    const [followStatus, setFollowStatus] = useState({});
    const navigation = useNavigation();
    const [loadingStatus, setLoadingStatus] = useState({});


    // Função para buscar notificações do backend
    const fetchNotifications = async () => {
        try {
            console.log('Buscando notificações...');
            console.log('userMongoId:', userMongoId);

            const response = await fetch(
                `${API_BASE_URL}/notifications/${userMongoId}/all-friends-notifications`
            );

            const data = await response.json();
            console.log('Dados recebidos:', data);

            // Calculando a data de 7 dias atrás
            const daysAgo = 7;
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - daysAgo);  // Subtrai 7 dias da data atual

            // Filtra as notificações para pegar apenas as dos últimos 7 dias
            const filteredNotifications = data.filter((item) => {
                const notificationDate = new Date(item.created_at);
                return notificationDate >= dateLimit;  // Verifica se a data da notificação é maior ou igual a data limite
            });

            console.log('Notificações filtradas:', filteredNotifications);

            // Ordena as notificações da mais recente para a mais antiga
            const sortedNotifications = filteredNotifications.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            console.log('Notificações ordenadas:', sortedNotifications);

            setNotifications(sortedNotifications);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        }
    };

    // const fetchNotifications = async () => {
    //     try {
    //         console.log('Buscando notificações...');
    //         console.log('userMongoId:', userMongoId);

    //         const response = await fetch(
    //             `${API_BASE_URL}/notifications/${userMongoId}/all-friends-notifications`
    //         );

    //         const data = await response.json();
    //         console.log('Dados recebidos:', data);

    //         // Sem filtro de data ou ordenação
    //         setNotifications(data);
    //     } catch (error) {
    //         console.error('Erro ao buscar notificações:', error);
    //     }
    // };

    // Função para verificar o status de amizade (seguir/seguindo)
    const fetchFollowStatus = async (user_id) => {
        try {
            console.log(`Buscando status de seguir para usuário: ${user_id}`);
            const response = await fetch(
                `${API_BASE_URL}connections/${userMongoId}/follow-status/${user_id}`
            );
            const data = await response.json();
            console.log(`Status recebido para usuário ${user_id}:`, data);
    
            setFollowStatus((prev) => ({
                ...prev,
                [user_id]: data, // Armazena o status de amizade para o remetente específico
            }));
        } catch (error) {
            console.error('Erro ao verificar status de amizade:', error);
        }
    };

    // Função para marcar notificações como lidas
    const markAsRead = async (id) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/notifications/${id}/mark-as-read`,
                {
                    method: 'PATCH',
                }
            );

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((notification) =>
                        notification._id === id ? { ...notification, status: 'read' } : notification
                    )
                );
            } else {
                console.error('Erro ao marcar como lida');
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    // Use useEffect para verificar o status de amizade após a renderização
    useEffect(() => {
        notifications.forEach((item) => {
            if (item.messageType === 'newFollower' && !checkedSenders.includes(item.user_id)) {
                console.log(`Chamando fetchFollowStatus para usuário: ${item.user_id}`);
                fetchFollowStatus(item.user_id); // Verifica o status de amizade
                setCheckedSenders((prev) => [...prev, item.user_id]); // Adiciona o remetente ao array de verificados
            }
        });
    }, [notifications]);

    useEffect(() => {
        fetchNotifications();
    }, []);


    const renderNotification = ({ item }) => {
        console.log(`Renderizando notificação para ${item.nome_completo} (${item.user_id}):`);
        console.log('Estado atual de followStatus:', followStatus[item.user_id]);
    
        const handleProfileNavigation = () => {
            navigation.navigate('FriendsProfile', { friendId: item.user_id });
        };
    
        return (
            <TouchableOpacity
                onPress={handleProfileNavigation}
                style={styles.notification}
                activeOpacity={0.8}
            >
                <View style={styles.notificationContent}>
                    {/* Coluna 1: Foto do remetente */}
                    <Image
                        source={item.foto_perfil ? { uri: item.foto_perfil } : require('../../../assets/perfilLendo.png')}
                        style={styles.senderImage}
                    />
    
                    {/* Coluna 2: Informações da notificação */}
                    <View style={styles.messageContainer}>
                        <Text style={[styles.title, item.status === 'unread' && styles.unreadText]}>
                            {item.messageType === 'newFollower'
                                ? `${item.nome_completo} começou a te seguir!`
                                : `${item.nome_completo} adicionou um novo livro!`}
                        </Text>
                        {item.titleBook && (
                            <Text style={styles.message}>
                                Livro: {item.titleBook}
                            </Text>
                        )}
                        <Text style={styles.time}>
                            Criado em: {new Date(item.created_at).toLocaleString()}
                        </Text>
                    </View>
    
                    {/* Coluna 3: Imagem do Livro ou Botão */}
                    <View style={styles.bookImageContainer}>
                        {item.messageType === 'bookAdded' || item.messageType === 'loanRequest' && item.imageBook && (
                            <Image
                                source={{ uri: item.imageBook }}
                                style={styles.bookImage}
                            />
                        )}
    
                        {item.messageType === 'newFollower' && (
                            <TouchableOpacity
                                style={[
                                    styles.followButton,
                                    followStatus[item.user_id]?.isFollowing
                                        ? { backgroundColor: '#dc3545' }
                                        : { backgroundColor: '#007bff' },
                                ]}
                                onPress={(event) => {
                                    event.stopPropagation();
                                    if (followStatus[item.user_id]?.isFollowing) {
                                        handleDeixarDeSeguir(userMongoId, item.user_id);
                                    } else {
                                        handleAdicionarAmizade(userMongoId, item.user_id);
                                    }
                                }}
                            >
                                <Text style={styles.followButtonText}>
                                    {followStatus[item.user_id]?.isFollowing ? 'Seguindo' : 'Seguir'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const handleAdicionarAmizade = async (followerId, followingId) => {
        console.log(`Tentando seguir usuário: ${followingId}`);
        try {
            const response = await fetch(`${API_BASE_URL}/connections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ follower: followerId, following: followingId }),
            });
    
            if (response.ok) {
                console.log(`Seguindo usuário ${followingId} com sucesso`);
                setFollowStatus((prev) => ({
                    ...prev,
                    [followingId]: { ...prev[followingId], isFollowing: true },
                }));
            } else {
                console.error(`Erro ao seguir usuário ${followingId}`);
            }
        } catch (error) {
            console.error('Erro ao seguir usuário:', error);
        }
    };
    
    const handleDeixarDeSeguir = async (followerId, followingId) => {
        console.log(`Tentando deixar de seguir usuário: ${followingId}`);
        try {
            const response = await fetch(
                `${API_BASE_URL}/connections/${followerId}/${followingId}`,
                { method: 'DELETE' }
            );
    
            if (response.ok) {
                console.log(`Deixou de seguir usuário ${followingId} com sucesso`);
                setFollowStatus((prev) => ({
                    ...prev,
                    [followingId]: { ...prev[followingId], isFollowing: false },
                }));
            } else {
                console.error(`Erro ao deixar de seguir usuário ${followingId}`);
            }
        } catch (error) {
            console.error('Erro ao deixar de seguir:', error);
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Mensagens Recentes</Text>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={renderNotification}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3d00f',
        padding: 10,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    notification: {
        padding: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 4,
    },
    notificationContent: {
        flexDirection: 'row', // Organiza em três colunas
        alignItems: 'center',
        justifyContent: 'space-between', // Espaçamento entre as colunas
    },
    senderImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 2, // Espaço entre a foto e o texto
    },
    messageContainer: {
        flex: 2, // A mensagem ocupa o maior espaço
        marginHorizontal: 5,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        // color: '#333',
    },
    message: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#000',
    },
    time: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    bookImage: {
        width: 60,
        height: 90,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    bookImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    wideFollowButton: {
        width: 100, // Largura maior para "Novo Seguidor"
        height: 40, // Altura ajustada
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        borderRadius: 5,
    },
    followButton: {
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default ChatScreen;
