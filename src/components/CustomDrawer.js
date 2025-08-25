// components/CustomDrawerContent.js
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

// ====== Design System (MyLibrary App) ======
const COLORS = {
  primary: '#F3D00F',
  secondary: '#4E8CFF',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  label: '#B2BEC3',
  border: '#E0E0E0',
  error: '#DC3545',
  success: '#28A745',
};

const RADIUS = 12; // cards 8–12
const ELEV = 2; // sombra leve
const SP = 16; // padding base

// ====== Atoms ======
const MenuItem = React.memo(function MenuItem({ icon, label, onPress, active = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[styles.item, active && styles.itemActive]}
    >
      <View style={[styles.itemIconWrap, active && styles.itemIconWrapActive]}>
        <Icon name={icon} size={20} color={active ? COLORS.text : COLORS.textSecondary} />
      </View>
      <Text style={[styles.itemLabel, active && styles.itemLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      <Icon name="chevron-right" size={20} color={active ? COLORS.text : '#9CA3AF'} />
    </TouchableOpacity>
  );
});

const QuickChip = React.memo(function QuickChip({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickChip}
      onPress={onPress}
      activeOpacity={0.9}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Icon name={icon} size={16} color={COLORS.text} />
      <Text style={styles.quickChipTxt}>{label}</Text>
    </TouchableOpacity>
  );
});

// ====== Drawer ======
const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const { logout, user } = useContext(AuthContext);
  const [userName, setUserName] = useState('');

  const currentRoute = useMemo(() => {
    const idx = props?.state?.index ?? 0;
    return props?.state?.routeNames?.[idx];
  }, [props?.state]);

  useEffect(() => {
    if (user?.data?.nome) setUserName(user.data.nome);
  }, [user]);

  const fotoUrl = user?.data?.foto_url;

  const goHome = useCallback(() => props.navigation.navigate('HomeTabs'), [props.navigation]);
  const goBibliotech = useCallback(() => props.navigation.navigate('Bibliotech'), [props.navigation]);
  const goStats = useCallback(() => props.navigation.navigate('Estatisticas'), [props.navigation]);
  const goSett = useCallback(() => props.navigation.navigate('Settings'), [props.navigation]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout(() => navigation.navigate('Login')),
        },
      ],
      { cancelable: true }
    );
  }, [logout, navigation]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image
            source={
              fotoUrl
                ? { uri: fotoUrl }
                : require('../../assets/logo_Preto.png')
            }
            style={styles.avatar}
          />
          <View style={styles.statusDot} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={styles.name} numberOfLines={1}>
            {userName || 'Olá!'}
          </Text>
          <Text style={styles.caption} numberOfLines={1}>
            {user?.data?.email || 'Bem-vindo(a) 👋'}
          </Text>
        </View>

        {/* Ações rápidas (exemplos prontos para ativar) */}
        <View style={styles.quickRow}>
          {/* <QuickChip icon="home" label="Início" onPress={goHome} />
          <QuickChip icon="library-books" label="Bibliotech" onPress={goBibliotech} />
          <QuickChip icon="insights" label="Estatísticas" onPress={goStats} /> */}
        </View>
      </View>

      {/* Conteúdo */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Geral</Text>
        </View>

        <View style={styles.itemsWrap}>
          <MenuItem
            icon="home"
            label="Início"
            active={currentRoute === 'HomeTabs'}
            onPress={goHome}
          />
          <MenuItem
            icon="library-books"
            label="Bibliotech"
            active={currentRoute === 'Bibliotech'}
            onPress={goBibliotech}
          />
          <MenuItem
            icon="insert-chart-outlined"
            label="Estatísticas"
            active={currentRoute === 'Estatisticas'}
            onPress={goStats}
          />
          <MenuItem
            icon="settings"
            label="Configurações"
            active={currentRoute === 'Configurações'}
            onPress={goSett}
          />
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.9}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Icon name="logout" size={20} color={COLORS.text} />
          <Text style={styles.logoutTxt}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versão 2025.00.01</Text>
      </View>
    </SafeAreaView>
  );
};

const AVATAR = 72;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header com primária, tipografia forte e espaçamento
  header: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E68B', // variação suave do primário
  },

  // Avatar circular com borda fina e sombra leve
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: AVATAR / 2, resizeMode: 'cover' },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  // Tipografia hierárquica
  name: { marginTop: 8, fontSize: 16, fontWeight: '800', color: COLORS.text },
  caption: { fontSize: 18, color: COLORS.text },

  // Chips rápidos (opcionais)
  quickRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SP,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  quickChipTxt: { color: COLORS.text, fontWeight: '800', fontSize: 12 },

  // Conteúdo
  scrollContent: { paddingTop: 8, paddingBottom: 8 },
  sectionTitleWrap: { paddingHorizontal: SP, paddingVertical: 8 },
  sectionTitle: { color: COLORS.textSecondary, fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },

  itemsWrap: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },

  // Card item (MD3)
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  // Estado ativo com realce baseado no primário (sem exagero)
  itemActive: {
    backgroundColor: '#FFF7CC', // primário diluído
    borderColor: COLORS.primary,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconWrapActive: {
    backgroundColor: '#FDE68A',
  },
  itemLabel: { flex: 1, color: COLORS.text, fontWeight: '700' },
  itemLabelActive: { color: COLORS.text },

  // Footer
  footer: {
    paddingVertical: 14,
    paddingHorizontal: SP,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderColor: '#E9CC16',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS,
  },
  logoutTxt: { color: COLORS.text, fontWeight: '800' },
  version: { marginTop: 8, fontSize: 11, color: COLORS.label, textAlign: 'center' },
});

export default CustomDrawerContent;
