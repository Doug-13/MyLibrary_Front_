import React, { useState, useEffect, useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

import { API_BASE_URL } from '../config/api'; 

const FollowButton = ({ userId, currentUserId }) => {
  const [followStatus, setFollowStatus] = useState(null); // Estado para status de seguir
  const [loading, setLoading] = useState(true); // Estado de carregamento inicial
  const { setTimeStamp } = useContext(AuthContext);

  // Buscar status de amizade do usuário
  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/connections/${currentUserId}/follow-status/${userId}`
        );
        const data = await response.json();
        setFollowStatus(data.isFollowing); // Ajuste conforme o retorno da API
      } catch (error) {
        console.error('Error fetching follow status:', error.message);
      } finally {
        setLoading(false); // Finalizar carregamento
      }
    };

    fetchFollowStatus();
  }, [userId, currentUserId]);

  // Função para seguir o usuário
  const handleFollow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: currentUserId, following: userId }),
      });
      setTimeStamp(new Date());
      if (response.ok) {
        setFollowStatus(true);
      } else {
        console.error('Erro ao seguir usuário');
      }
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para deixar de seguir o usuário
  const handleUnfollow = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/connections/${currentUserId}/${userId}`,
        { method: 'DELETE' }
      );
      setTimeStamp(new Date());
      if (response.ok) {
        setFollowStatus(false);
      } else {
        console.error('Erro ao deixar de seguir');
      }
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // Enquanto o status não foi carregado, exibir apenas o indicador de carregamento
    return (
      <TouchableOpacity style={[styles.followButton, { backgroundColor: '#6c757d' }]}>
        <ActivityIndicator size="small" color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.followButton,
        followStatus ? { backgroundColor: '#dc3545' } : { backgroundColor: '#007bff' },
      ]}
      onPress={followStatus ? handleUnfollow : handleFollow}
      disabled={loading}
    >
      <Text style={styles.followButtonText}>
        {followStatus ? 'Seguindo' : 'Seguir'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  followButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FollowButton;
