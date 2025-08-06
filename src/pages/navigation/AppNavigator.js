// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { NavigationContainer } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/Ionicons';

// // Importar suas telas
// import FriendsView from '../screens/FriendsView'; 
// import ProfileView from '../screens/ProfileView'; 
// import SettingsView from '../screens/SettingsView'; 

// const Tab = createBottomTabNavigator();

// const AppNavigator = () => {
//   return (
//     <NavigationContainer>
//       <Tab.Navigator
//         screenOptions={({ route }) => ({
//           tabBarIcon: ({ color, size }) => {
//             let iconName;

//             if (route.name === 'Amigos') {
//               iconName = 'people-outline';
//             } else if (route.name === 'Perfil') {
//               iconName = 'person-outline';
//             } else if (route.name === 'Configurações') {
//               iconName = 'settings-outline';
//             }

//             return <Icon name={iconName} size={size} color={color} />;
//           },
//           tabBarActiveTintColor: '#6C63FF',
//           tabBarInactiveTintColor: 'gray',
//           headerShown: false, // Remove o cabeçalho padrão
//         })}
//       >
//         <Tab.Screen name="Amigos" component={FriendsView} />
//         <Tab.Screen name="Perfil" component={ProfileView} />
//         <Tab.Screen name="Configurações" component={SettingsView} />
//       </Tab.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;
