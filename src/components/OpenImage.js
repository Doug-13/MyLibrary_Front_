import React, { useState, useContext } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Image, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

export default function     () {
  const navigation = useNavigation();
  const { userProfilePicture, nome_completo } = useContext(AuthContext);

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const openImageModal = () => setIsImageModalVisible(true);
  const closeImageModal = () => setIsImageModalVisible(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerIcons}>
        <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.openDrawer()}>
          <MaterialIcons name="menu" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.menuText}>Olá {nome_completo}</Text>
        <TouchableOpacity onPress={openImageModal}>
          <Image
            source={
              userProfilePicture
                ? { uri: userProfilePicture }
                : require('../../../assets/noImageAvailable.jpg')
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Modal para exibir a imagem do perfil */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeImageModal}>
            <Image
              source={
                userProfilePicture
                  ? { uri: userProfilePicture }
                  : require('../../../assets/noImageAvailable.jpg')
              }
              style={styles.modalImage}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  containerIcons: {
    backgroundColor: '#f3d00f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
    width: '100%',
  },
  menuText: {
    fontSize: 20,
  },
  menuIcon: {
    padding: 5,
    zIndex: 9999,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderColor: '#fff',
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
