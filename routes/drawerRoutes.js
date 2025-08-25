import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabsRoutes from './bottomTabsRoutes';
import CustomDrawerContent from '../src/components/CustomDrawer';

import AddBooks from '../src/pages/AddBooks';
// import DataBooks from '../src/pages/DataBooks';
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
import Profile from '../src/pages/Profile';
import ViewProfile from '../src/pages/ViewProfile';
import Settings from '../src/pages/Settings';
import HelpCenterScreen from '../src/pages/Help/HelpCenterScreen';
import HelpArticle from '../src/pages/Help/HelpArticle';
import AboutScreen from '../src/pages/Help/AboutScreen';
import PrivacyScreen from '../src/pages/Help/PrivacyScreen';
import TermsScreen from '../src/pages/Help/TermsScreen';


const Drawer = createDrawerNavigator();

export default function DrawerRoutes() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeTabs"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#fff', width: 280 },
        // performance
        detachInactiveScreens: true,
        swipeEdgeWidth: 50,
        sceneContainerStyle: { backgroundColor: '#F8F9FA' },
      }}
    >
      {/* Início (Bottom Tabs como root logado) */}
      <Drawer.Screen
        name="HomeTabs"
        component={BottomTabsRoutes}
        options={{ title: 'Início' }}
      />

      {/* Telas do app */}
      <Drawer.Screen name="AddBooks" component={AddBooks} />
      <Drawer.Screen name="SearchBooks" component={SearchBooks} />
      <Drawer.Screen name="EditBooks" component={EditBooks} />
      <Drawer.Screen name="BooksView" component={BooksView} />
      <Drawer.Screen name="SearchUsers" component={SearchUsers} />
      <Drawer.Screen name="FriendsProfile" component={FriendsProfile} />
      <Drawer.Screen name="Loan" component={Loan} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="FriendsView" component={FriendsView} />
      <Drawer.Screen name="ViewProfile" component={ViewProfile} />
      <Drawer.Screen name="SearchFriends" component={SearchFriends} />
      <Drawer.Screen name="Bibliotech" component={Bibliotech} />
      <Drawer.Screen name="Estatisticas" component={Estatisticas} />
      {/* <Drawer.Screen name="DataBooks" component={DataBooks} /> */}
      <Drawer.Screen name="BookDetailsFriends" component={BookDetailsFriends} />
      <Drawer.Screen name="LoanBooksList" component={LoanBooksList} />
      <Drawer.Screen name="Settings" component={Settings} />
      <Drawer.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
      <Drawer.Screen name="HelpArticle" component={HelpArticle} />
      <Drawer.Screen name="AboutScreen" component={AboutScreen} />
      <Drawer.Screen name="PrivacyScreen" component={PrivacyScreen} />
      <Drawer.Screen name="TermsScreen" component={TermsScreen} />
    </Drawer.Navigator>
  );
}
