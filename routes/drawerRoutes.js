import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabsRoutes from './bottomTabsRoutes';
import CustomDrawerContent from '../src/components/CustomDrawer';
import AddBooks from '../src/pages/AddBooks/index';
import DataBooks from '../src/pages/DataBooks';
import EditBooks from '../src/pages/EditBooks';
import BooksView from '../src/pages/BooksView';
import SearchUsers from '../src/pages/SearchUsers';
import FriendsProfile from '../src/pages/FriendsProfile';
import FriendsView from '../src/pages/FriendsView';
import Loan from '../src/pages/Loan';
import SearchFriends from '../src/pages/SearchFriends';
import Bibliotech from '../src/pages/Bibliotech';
import Estatisticas from '../src/pages/Estatisticas';
import SearchBooks from '../src/pages/SearchBooks';
import BookDetailsFriends from '../src/pages/BookDetailsFriends';
import LoanBooksList from '../src/pages/LoanBooksList';
// import MainScreen from '../src/pages/MainScreen';

import Profile from '../src/pages/Profile';
import ViewProfile from '../src/pages/ViewProfile';
// import Bibliotech from '../src/pages/Bibliotech';


const Drawer = createDrawerNavigator();

// Configuração do Drawer Navigator
function DrawerRoutes() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                drawerStyle: {
                    backgroundColor: '#fff',
                    width: 280,
                },
                headerShown: false,
            }}
        >
            {/* Rotas do Drawer */}
            <Drawer.Screen
                name="HomeTabs"
                component={BottomTabsRoutes}
                options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="AddBooks"
                component={AddBooks}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="SearchBooks"
                component={SearchBooks}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="EditBooks"
                component={EditBooks}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="BooksView"
                component={BooksView}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="SearchUsers"
                component={SearchUsers}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="FriendsProfile"
                component={FriendsProfile}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="Loan"
                component={Loan}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="Profile"
                component={Profile}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="FriendsView"
                component={FriendsView}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="ViewProfile"
                component={ViewProfile}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="SearchFriends"
                component={SearchFriends}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="Bibliotech"
                component={Bibliotech}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="Estatisticas"
                component={Estatisticas}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="DataBooks"
                component={DataBooks}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="BookDetailsFriends"
                component={BookDetailsFriends}
            // options={{ title: 'Início' }}
            />
            <Drawer.Screen
                name="LoanBooksList"
                component={LoanBooksList}
            // options={{ title: 'Início' }}
            />
            {/* <Drawer.Screen
                name="MainScreen"
                component={MainScreen}
                // options={{ headerShown: false }}
            /> */}

        </Drawer.Navigator>
    );
}



export default DrawerRoutes;