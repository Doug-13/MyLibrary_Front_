// // src/pages/OnboardingScreens/index.js
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
// import GestureRecognizer from 'react-native-swipe-gestures';
// import { useNavigation, CommonActions } from '@react-navigation/native';

// const { width } = Dimensions.get('window');

// const OnboardingScreens = () => {
//   const navigation = useNavigation();
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const screens = [
//     { id: 1, title: 'Bem-vindo ao Bibliotech!', description: 'Descubra um novo jeito de explorar livros e compartilhar sua paixão por leitura com amigos.', image: require('../../../assets/2.png') },
//     { id: 2, title: 'Explore bibliotecas únicas', description: 'Acesse as estantes virtuais dos seus amigos e descubra livros incríveis para ler.', image: require('../../../assets/4.png') },
//     { id: 3, title: 'Compartilhe livros', description: 'Adicione sua biblioteca e compartilhe suas leituras favoritas com seus amigos.', image: require('../../../assets/6.png') },
//     { id: 4, title: 'Organize suas leituras', description: 'Mantenha controle sobre os livros que leu, deseja ler e está lendo atualmente.', image: require('../../../assets/8.png') },
//   ];

//   const handleSwipeLeft = () => {
//     if (currentIndex < screens.length - 1) setCurrentIndex(i => i + 1);
//   };

//   const handleSwipeRight = () => {
//     if (currentIndex > 0) setCurrentIndex(i => i - 1);
//   };

//   const handleStart = () => {
//     try {
//       navigation.dispatch(
//         CommonActions.reset({
//           index: 0,
//           routes: [{ name: 'Login' }],
//         })
//       );
//       // alternativa simples:
//       // navigation.replace('Login');
//     } catch (e) {
//       console.log('Erro na navegação', e);
//     }
//   };

//   return (
//     <GestureRecognizer style={styles.container} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
//       <View style={styles.content}>
//         <Image source={screens[currentIndex].image} style={styles.image} />
//         <View style={styles.textOverlay}>
//           <Text style={styles.title}>{screens[currentIndex].title}</Text>
//           <Text style={styles.description}>{screens[currentIndex].description}</Text>
//         </View>
//       </View>

//       <View style={styles.footer}>
//         <View style={styles.pagination}>
//           {screens.map((_, index) => (
//             <View key={index} style={[styles.dot, currentIndex === index ? styles.activeDot : styles.inactiveDot]} />
//           ))}
//         </View>

//         {currentIndex === screens.length - 1 ? (
//           <TouchableOpacity style={styles.button} onPress={handleStart}>
//             <Text style={styles.buttonText}>Começar</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity style={styles.button} onPress={handleSwipeLeft}>
//             <Text style={styles.buttonText}>Próximo</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </GestureRecognizer>
//   );
// };


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFF',
//     justifyContent: 'center',
//   },
//   content: {
//     flex: 1,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   textOverlay: {
//     position: 'absolute',
//     top: '68%', // Ajuste a posição vertical conforme necessário
//     left: 20,
//     right: 20,
//     alignItems: 'center',
//   },
//   title: {
//     color: '#00000',
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   description: {
//     color: '#00000',
//     fontSize: 20,
//     textAlign: 'center',
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 20,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   pagination: {
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   dot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginHorizontal: 5,
//   },
//   activeDot: {
//     backgroundColor: '#FFF',
//   },
//   inactiveDot: {
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//   },
//   button: {
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 5,
//   },
//   buttonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default OnboardingScreens;

// src/pages/OnboardingScreens/index.js
import React, { useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import GestureRecognizer from 'react-native-swipe-gestures';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ThemeContext } from '../../../context/ThemeContext.js';

const { width } = Dimensions.get('window');

const OnboardingScreens = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => mkStyles(theme), [theme]);

  const screens = [
    { id: 1, title: 'Bem-vindo ao Bibliotech!', description: 'Descubra um novo jeito de explorar livros e compartilhar sua paixão por leitura com amigos.', image: require('../../../assets/2.png') },
    { id: 2, title: 'Explore bibliotecas únicas', description: 'Acesse as estantes virtuais dos seus amigos e descubra livros incríveis para ler.', image: require('../../../assets/4.png') },
    { id: 3, title: 'Compartilhe livros', description: 'Adicione sua biblioteca e compartilhe suas leituras favoritas com seus amigos.', image: require('../../../assets/6.png') },
    { id: 4, title: 'Organize suas leituras', description: 'Mantenha controle sobre os livros que leu, deseja ler e está lendo atualmente.', image: require('../../../assets/8.png') },
  ];

  const handleSwipeLeft = () => {
    if (currentIndex < screens.length - 1) setCurrentIndex(i => i + 1);
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const handleStart = () => {
    try {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
      // navigation.replace('Login');
    } catch (e) {
      console.log('Erro na navegação', e);
    }
  };

  return (
    <GestureRecognizer style={styles.container} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
      <View style={styles.content}>
        <Image source={screens[currentIndex].image} style={styles.image} />
        <View style={styles.textOverlay}>
          <Text style={styles.title}>{screens[currentIndex].title}</Text>
          <Text style={styles.description}>{screens[currentIndex].description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {screens.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>

        {currentIndex === screens.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>Começar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSwipeLeft}>
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>
        )}
      </View>
    </GestureRecognizer>
  );
};

function mkStyles(t) {
  const onPrimary = '#111827'; // alto contraste em cima do amarelo
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    textOverlay: {
      position: 'absolute',
      top: '68%',
      left: 20,
      right: 20,
      alignItems: 'center',
    },
    title: {
      color: t.text,
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
    },
    description: {
      color: t.textSecondary,
      fontSize: 20,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    pagination: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
    activeDot: {
      backgroundColor: t.primary,
    },
    inactiveDot: {
      backgroundColor: t.label,
    },
    button: {
      backgroundColor: t.primary,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 5,
    },
    buttonText: {
      color: onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}

export default OnboardingScreens;
