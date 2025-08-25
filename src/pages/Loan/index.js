// import React, { useContext, useEffect, useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { useFocusEffect } from '@react-navigation/native';
// import { AuthContext } from '../../../context/AuthContext.js';
// import axios from 'axios';
// import { API_BASE_URL } from '../../config/api.js'; 

// const formatDate = (date) => {
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// };

// const calculateReturnDate = (loanDate) => {
//   const returnDate = new Date(loanDate);
//   returnDate.setDate(returnDate.getDate() + 30);
//   return returnDate;
// };

// const InputField = ({ label, value, onChangeText, placeholder, editable = true }) => (
//   <View style={styles.fieldContainer}>
//     <Text style={styles.label}>{label}:</Text>
//     <TextInput
//       style={styles.input}
//       value={value}
//       onChangeText={onChangeText}
//       placeholder={placeholder}
//       editable={editable}
//     />
//   </View>
// );

// const DatePickerField = ({ label, date, setDate }) => {
//   const [showPicker, setShowPicker] = useState(false);

//   const onChange = (event, selectedDate) => {
//     setShowPicker(false);
//     if (selectedDate) {
//       setDate(selectedDate);
//     }
//   };

//   return (
//     <View style={styles.fieldContainer}>
//       <Text style={styles.label}>{label}:</Text>
//       <TouchableOpacity
//         onPress={() => setShowPicker(true)}
//         style={styles.input}
//       >
//         <Text>{formatDate(date)}</Text>
//       </TouchableOpacity>
//       {showPicker && (
//         <DateTimePicker
//           value={date}
//           mode="date"
//           display="default"
//           onChange={onChange}
//         />
//       )}
//     </View>
//   );
// };

// const LoanForm = ({ navigation, route }) => {
//   const { bookId, title, imageUrl } = route.params;
//   const { userMongoId, setTimeStamp  } = useContext(AuthContext);

//   const [formData, setFormData] = useState({
//     idBook: bookId || '',
//     borrowerName: '',
//     loanDate: new Date(),
//     returnDate: calculateReturnDate(new Date()),
//     status: 'Pendente',
//   });

//   const [bookDetails, setBookDetails] = useState({
//     name: title || '',
//     imageUrl: imageUrl || '',
//   });

//   useEffect(() => {
//     if (bookId) {
//       setBookDetails({
//         name: title,
//         imageUrl: imageUrl,
//       });

//       setFormData((prev) => ({
//         ...prev,
//         idBook: bookId,
//       }));
//     }
//   }, [bookId]);

//   useFocusEffect(
//     React.useCallback(() => {
//       return () => {
//         setBookDetails({ name: '', imageUrl: '' });
//         setFormData({
//           idBook: '',
//           borrowerName: '',
//           loanDate: new Date(),
//           returnDate: calculateReturnDate(new Date()),
//           status: 'Pendente',
//         });
//       };
//     }, [])
//   );

//   const handleInputChange = (field, value) => {
//     setFormData((prev) => {
//       if (field === 'loanDate') {
//         return {
//           ...prev,
//           loanDate: value,
//           returnDate: calculateReturnDate(value),
//         };
//       }
//       return { ...prev, [field]: value };
//     });
//   };

//   const handleSubmit = async () => {
//     const { idBook, borrowerName } = formData;
    
  
//     if (!idBook || !borrowerName) {
//       Alert.alert('Campo não Preenchido', 'Preencha o campo "Nome do Solicitante"!');
//       return;
//     }
  
//     const loanData = {
//       ...formData,
//       loanDate: formData.loanDate.toISOString().split('T')[0],
//       returnDate: formData.returnDate.toISOString().split('T')[0],
//       userMongoId ,
//     };
  
//     try {
//       // Registra o empréstimo
//       const response = await fetch(`${API_BASE_URL}/loans`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(loanData),
//       });
  
//       if (!response.ok) {
//         throw new Error('Erro ao registrar o empréstimo');
//       }
  
//       const data = await response.json();
//       console.log('Empréstimo Criado:', data);
//       setTimeStamp(new Date())
  
//       // Busca os livros atualizados
//       // console.log(`${API_BASE_URL}/books/${userMongoId }/with-loans`)
//       const fetchResponse = await fetch(`${API_BASE_URL}/books/${userMongoId }/with-loans`);
//       const updatedBooks = await fetchResponse.json();
  
//       // Atualiza o estado da aplicação com os dados mais recentes
//       console.log('Livros Atualizados:', updatedBooks);
  
//       // Exibe mensagem de sucesso
//       Alert.alert('Sucesso', 'Empréstimo registrado com sucesso!');
  
//       // Redireciona para a tela MainScreen com os dados atualizados
//       navigation.goBack();

//     } catch (error) {
//       console.error('Erro ao registrar empréstimo ou atualizar livros:', error);
//       Alert.alert('Erro', 'Houve um problema ao registrar o empréstimo ou buscar os dados atualizados.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {bookDetails.imageUrl && (
//         <Image source={{ uri: bookDetails.imageUrl }} style={styles.bookImage} />
//       )}

//       <InputField
//         label="Livro"
//         value={bookDetails.name}
//         placeholder="Nome do livro"
//         editable={false}
//       />

//       <InputField
//         label="Nome do Solicitante"
//         value={formData.borrowerName}
//         placeholder="Digite o nome do solicitante"
//         onChangeText={(value) => handleInputChange('borrowerName', value)}
//       />

//       <DatePickerField
//         label="Data do Empréstimo"
//         date={formData.loanDate}
//         setDate={(date) => handleInputChange('loanDate', date)}
//       />

//       <DatePickerField
//         label="Data de Entrega"
//         date={formData.returnDate}
//         setDate={(date) => handleInputChange('returnDate', date)}
//       />

//       <TouchableOpacity style={styles.button} onPress={handleSubmit}>
//         <Text style={styles.buttonText}>Registrar Empréstimo</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f9f9f9',
//   },
//   fieldContainer: {
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//     color: '#333',
//   },
//   input: {
//     height: 40,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     fontSize: 16,
//     backgroundColor: '#fff',
//     justifyContent: 'center', 
//   },
//   inputText: {
//     fontSize: 16,
//     color: '#555', 
//     fontWeight: 'normal', 
//   },
//   button: {
//     backgroundColor: '#f3d00f',
//     padding: 15,
//     borderRadius: 5,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   buttonText: {
//     color: '#000',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   bookImage: {
//     width: 150,
//     height: 250,
//     borderRadius: 10,
//     marginBottom: 20,
//     alignSelf: 'center',
//   },
// });

// export default LoanForm;


import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import { ThemeContext } from '../../../context/ThemeContext.js';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_BASE_URL } from '../../config/api.js';

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculateReturnDate = (loanDate) => {
  const returnDate = new Date(loanDate);
  returnDate.setDate(returnDate.getDate() + 30);
  return returnDate;
};

const LoanForm = ({ navigation, route }) => {
  const { theme, navTheme } = useContext(ThemeContext);
  const { userMongoId, setTimeStamp } = useContext(AuthContext);
  const styles = createStyles(theme);

  const { bookId, title, imageUrl } = route.params || {};

  const [formData, setFormData] = useState({
    idBook: bookId || '',
    borrowerName: '',
    loanDate: new Date(),
    returnDate: calculateReturnDate(new Date()),
    status: 'Pendente',
  });

  const [bookDetails, setBookDetails] = useState({
    name: title || '',
    imageUrl: imageUrl || '',
  });

  useEffect(() => {
    if (bookId) {
      setBookDetails({ name: title, imageUrl: imageUrl });
      setFormData((prev) => ({ ...prev, idBook: bookId }));
    }
  }, [bookId, title, imageUrl]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setBookDetails({ name: '', imageUrl: '' });
        setFormData({
          idBook: '',
          borrowerName: '',
          loanDate: new Date(),
          returnDate: calculateReturnDate(new Date()),
          status: 'Pendente',
        });
      };
    }, [])
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      if (field === 'loanDate') {
        return { ...prev, loanDate: value, returnDate: calculateReturnDate(value) };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async () => {
    const { idBook, borrowerName } = formData;

    if (!idBook || !borrowerName) {
      Alert.alert('Campo não Preenchido', 'Preencha o campo "Nome do Solicitante"!');
      return;
    }

    const loanData = {
      ...formData,
      loanDate: formData.loanDate.toISOString().split('T')[0],
      returnDate: formData.returnDate.toISOString().split('T')[0],
      userMongoId,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData),
      });
      if (!response.ok) throw new Error('Erro ao registrar o empréstimo');

      await response.json();
      setTimeStamp(new Date());

      // (opcional) atualizar cache local
      await fetch(`${API_BASE_URL}/books/${userMongoId}/with-loans`);

      Alert.alert('Sucesso', 'Empréstimo registrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao registrar empréstimo:', error);
      Alert.alert('Erro', 'Houve um problema ao registrar o empréstimo.');
    }
  };

  // ---- Subcomponentes usando o tema ----
  const InputField = ({ label, value, onChangeText, placeholder, editable = true }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}:</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.label}
        editable={editable}
      />
    </View>
  );

  const DatePickerField = ({ label, date, setDate }) => {
    const [showPicker, setShowPicker] = useState(false);
    const onChange = (_e, selectedDate) => {
      setShowPicker(false);
      if (selectedDate) setDate(selectedDate);
    };
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}:</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
          <Text style={styles.inputText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={navTheme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* AppBar */}
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>Registrar Empréstimo</Text>
        <TouchableOpacity onPress={handleSubmit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="check" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!!bookDetails.imageUrl && (
          <Image source={{ uri: bookDetails.imageUrl }} style={styles.bookImage} />
        )}

        <InputField label="Livro" value={bookDetails.name} placeholder="Nome do livro" editable={false} />

        <InputField
          label="Nome do Solicitante"
          value={formData.borrowerName}
          placeholder="Digite o nome do solicitante"
          onChangeText={(v) => handleInputChange('borrowerName', v)}
        />

        <DatePickerField
          label="Data do Empréstimo"
          date={formData.loanDate}
          setDate={(d) => handleInputChange('loanDate', d)}
        />

        <DatePickerField
          label="Data de Entrega"
          date={formData.returnDate}
          setDate={(d) => handleInputChange('returnDate', d)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Registrar Empréstimo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/* ========================= STYLES (deixe no fim) ========================= */
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    appbar: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F6E68B',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appbarTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    content: { padding: 20 },

    fieldContainer: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '800', marginBottom: 6, color: theme.text },
    input: {
      height: 44,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.card,
      justifyContent: 'center',
    },
    inputText: { fontSize: 16, color: theme.text },

    button: {
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 14,
      borderWidth: 1,
      borderColor: '#E9CC16',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
    },
    buttonText: { color: theme.text, fontSize: 16, fontWeight: '800' },

    bookImage: {
      width: 150,
      height: 230,
      borderRadius: 12,
      marginBottom: 16,
      alignSelf: 'center',
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
    },
  });

export default LoanForm;
