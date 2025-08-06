import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Text, StyleSheet, Image, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import MainScreen from '../src/pages/MainScreen';
import ViewProfile from '../src/pages/ViewProfile';
import ChatScreen from '../src/pages/ChatScreen';
import FriendsView from '../src/pages/FriendsView';
import SearchBooks from '../src/pages/SearchBooks'; // <-- Certifique-se de importar

const Tab = createBottomTabNavigator();

function CustomAddButton({ onPress }) {
    return (
        <TouchableOpacity style={styles.customButton} onPress={onPress}>
            <Text style={styles.customButtonText}>+</Text>
        </TouchableOpacity>
    );
}

function BottomTabsRoutes({ navigation }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'HomeMainScreen') {
                        return <MaterialIcons name="home" size={28} color={color} />;
                    }

                    if (route.name === 'Perfil') {
                        return <MaterialIcons name="person" size={28} color={color} />;
                    }

                    if (route.name === 'Chat') {
                        return <MaterialIcons name="chat" size={28} color={color} />;
                    }

                    if (route.name === 'Amigos') {
                        return <MaterialIcons name="group" size={28} color={color} />;
                    }

                    return <MaterialIcons name="home" size={28} color={color} />;
                },
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#ddd',
                    height: 60,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 5,
                    position: 'absolute',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 5,
                },
                tabBarIconStyle: {
                    marginTop: 5,
                },
                headerShown: false,
                tabBarActiveTintColor: '#f3d00f',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen
                name="HomeMainScreen"
                component={MainScreen}
                options={{ title: 'Início', tabBarLabel: 'Início' }}
            />

            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Novidades', tabBarLabel: 'Novidades' }}
            />

            {/* BOTÃO CENTRAL - INVISÍVEL NA BARRA, MAS VISUAL */}
            <Tab.Screen
                name="AddBookButton"
                component={ViewProfile} // Pode usar um dummy ou tela qualquer (não será usada diretamente)
                options={{
                    tabBarButton: (props) => (
                        <CustomAddButton onPress={() => navigation.navigate('SearchBooks')} />
                    ),
                }}
            />

            <Tab.Screen
                name="Amigos"
                component={FriendsView}
                options={{ title: 'Amigos', tabBarLabel: 'Amigos' }}
            />

            <Tab.Screen
                name="Perfil"
                component={ViewProfile}
                options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    customButton: {
        position: 'absolute',
        bottom: 10, // distância da borda inferior
        alignSelf: 'center', // centraliza horizontalmente
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3d00f',
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 10, // garante que fica acima da tabBar
    },
    customButtonText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
    },
});

export default BottomTabsRoutes;
