import React, { useState, useContext, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, RadioButton, Checkbox, Switch } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { storage } from '../../firebase/firebase.config'; // Firebase storage configuration
import { getStorage, ref, deleteObject, uploadBytes, getDownloadURL } from "firebase/storage";
// import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import colors from '../../../constants/colors';
import { AuthContext } from '../../../context/AuthContext.js';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../../config/api.js';  

const ProfileEditScreen = () => {
  const navigation = useNavigation(); 
  const { control, handleSubmit, setValue } = useForm();
  const { userId, setUser, user, updateUser, setTimeStamp } = useContext(AuthContext);
  const [foto_perfil, setfoto_perfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [aboutMe, setAboutMe] = useState('');
  const [preferredGenres, setPreferredGenres] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isWriter, setIsWriter] = useState(false);
  const [isReader, setIsReader] = useState(true);
  const [visibility, setVisibility] = useState('public');  // Estado para controlar a visibilidade
  const [isSaving, setIsSaving] = useState(false);

  const genres = ['Ficção', 'Não-ficção', 'Aventura', 'Romance', 'Mistério', 'Fantasia'];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        const userData = response.data;

        setValue('name', userData.nome_completo || '');
        setValue('phone', userData.telefone || '');
        setAboutMe(userData.sobremim || '');
        setPreferredGenres(userData.generos_favoritos || []);
        setDateOfBirth(new Date(userData.data_nascimento || Date.now()));
        setfoto_perfil(userData.foto_perfil || null);

        // Ajusta a visibilidade da biblioteca
        setVisibility(userData.visibilidade_biblioteca || 'public');
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };
    fetchUserData();
    setLoading(false);
  }, [userId, setValue]);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correção aqui
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (!result.canceled) {
        setfoto_perfil(result.assets[0].uri);
        console.log('Imagem selecionada:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
    }
  };

  const toggleGenre = (genre) => {
    setPreferredGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const onSubmit = async (data) => {
    setIsSaving(true); // Indica que o processo de salvamento começou
    let image_url = '';

    try {
      console.log('Iniciando o envio dos dados...');

      // Verifica se o usuário está definido antes de acessar suas propriedades
      if (user && user.foto_perfil) {
        // Excluir imagem antiga se necessário
        const oldImageRef = ref(storage, user.foto_perfil);
        try {
          await deleteObject(oldImageRef);
          console.log('Imagem antiga excluída com sucesso');
        } catch (error) {
          console.error('Erro ao excluir a imagem antiga:', error);
        }
      }

      // Upload da nova imagem para o Firebase Storage
      if (foto_perfil) {
        console.log('Imagem de perfil encontrada, iniciando upload...');
        const response = await fetch(foto_perfil);
        const blob = await response.blob();
        const imageRef = ref(storage, `images/users/${Date.now()}`); // Cria uma referência única para a nova imagem
        const snapshot = await uploadBytes(imageRef, blob); // Faz o upload da imagem
        image_url = await getDownloadURL(snapshot.ref); // Obtém a URL da nova imagem
        console.log('Upload concluído, URL da nova imagem:', image_url);
      }

      // Dados do usuário a serem atualizados
      const userData = {
        nome_completo: data.name.trim(),
        telefone: data.phone.trim(),
        foto_perfil: image_url || (user ? user.foto_perfil : null), // Usa a nova URL ou mantém a antiga
        data_nascimento: dateOfBirth.toISOString(),
        sobremim: aboutMe.trim(),
        generos_favoritos: preferredGenres,
        role: { isReader, isWriter },
        visibilidade_biblioteca: visibility,
      };

      // Atualiza os dados do usuário no servidor
      const response = await axios.patch(`${API_BASE_URL}/users/${userId}`, userData);

      // Atualiza o contexto com os novos dados do usuário
      updateUser(userData);
      setTimeStamp(new Date())
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error.response ? error.response.data : error.message);
      Alert.alert('Erro', 'Houve um problema ao atualizar seus dados.');
    } finally {
      setIsSaving(false); // Indica que o processo de salvamento foi concluído
    }
  };

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../../assets/animation2.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.loadingText}>Carregando seu perfil, aguarde...</Text>
        </View>
      );
    }


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
        <Image source={foto_perfil ? { uri: foto_perfil } : require('../../../assets/perfilLendo.png')} style={styles.foto_perfil} />
        <Text style={styles.changePhotoText}>Alterar Foto</Text>
      </TouchableOpacity>

      <Controller control={control} name="name" defaultValue="" render={({ field: { onChange, value } }) => (
        <TextInput label="Nome Completo" mode="outlined" style={styles.input} value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="phone" defaultValue="" render={({ field: { onChange, value } }) => (
        <TextInput label="Telefone" mode="outlined" style={styles.input} value={value} onChangeText={onChange} keyboardType="phone-pad" />
      )} />

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
        <Text style={styles.dateLabel}>Data de Nascimento</Text>
        <Text style={styles.dateValue}>{dateOfBirth.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker value={dateOfBirth} mode="date" display="default" onChange={(event, selectedDate) => {
          setShowDatePicker(false);
          if (selectedDate) setDateOfBirth(selectedDate);
        }} />
      )}

      <Text style={styles.label}>Gêneros de Preferência:</Text>
      <View style={styles.genreContainer}>
        {genres.map((genre) => (
          <View key={genre} style={styles.genreItem}>
            <Checkbox status={preferredGenres.includes(genre) ? 'checked' : 'unchecked'} onPress={() => toggleGenre(genre)} />
            <Text>{genre}</Text>
          </View>
        ))}
      </View>

      <TextInput label="Sobre Mim" value={aboutMe} onChangeText={setAboutMe} style={styles.input} multiline numberOfLines={4} mode="outlined" />

      <Text style={styles.label}>Tipo de Perfil:</Text>
      <View style={styles.switchContainer}>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Leitor</Text>
          <Switch value={isReader} onValueChange={setIsReader} />
        </View>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>Escritor</Text>
          <Switch value={isWriter} onValueChange={setIsWriter} />
        </View>

        <Text style={styles.label}>Visibilidade da Biblioteca:</Text>
        <RadioButton.Group value={visibility} onValueChange={setVisibility}>
          <View style={styles.radioButtonContainer}>
            <RadioButton value="public" />
            <Text>Biblioteca Pública</Text>
          </View>
          <View style={styles.radioButtonContainer}>
            <RadioButton value="private" />
            <Text>Biblioteca Privada</Text>
          </View>
          <View style={styles.radioButtonContainer}>
            <RadioButton value="friends" />
            <Text>Somente Amigos</Text>
          </View>
        </RadioButton.Group>
      </View>

      <Button mode="contained" style={styles.saveButton} onPress={handleSubmit(onSubmit)} loading={isSaving} disabled={isSaving}>
        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.white,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  foto_perfil: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.gray,
  },
  changePhotoText: {
    textAlign: 'center',
    color: colors.blue,
    marginTop: 10,
  },
  input: {
    marginVertical: 10,
  },
  datePicker: {
    marginVertical: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateValue: {
    color: colors.text,
    fontSize: 16,
  },
  label: {
    marginVertical: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  genreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  switchContainer: {
    marginVertical: 20,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 10,
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
});

export default ProfileEditScreen;