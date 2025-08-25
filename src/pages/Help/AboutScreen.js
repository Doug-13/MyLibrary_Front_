// screens/About/AboutScreen.js
import React, { useMemo, useContext, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Image, Linking, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../../context/ThemeContext';

const RADIUS = 12;
const ELEV = 2;
const SPACING = { xs: 6, sm: 10, md: 16, lg: 20 };

export default function AboutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, mode } = useContext(ThemeContext);

  const returnTo = (route.params?.returnTo || 'Settings'); // <- tela de retorno
  const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

  const Card = ({ children }) => <View style={styles.card}>{children}</View>;
  const Row = ({ icon, children }) => (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={theme.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );

  const goBackToSettings = useCallback(() => {
    navigation.navigate(returnTo);
    return true; // consumiu o evento
  }, [navigation, returnTo]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBackToSettings);
    return () => sub.remove();
  }, [goBackToSettings]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Icon name="arrow-back" size={26} color={theme.text} onPress={goBackToSettings} />
          <Text style={styles.heroTitle}>Sobre o App</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.heroSubtitle}>Saiba mais sobre o MyLibrary</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }} showsVerticalScrollIndicator={false}>
        <Card>
          {/* Ajuste o caminho conforme sua pasta de assets */}
          <Image source={require('../../../assets/logo_Preto.png')} style={styles.logo} />
          <Row icon="menu-book">
            <Text style={styles.p}>
              O <Text style={{ fontWeight: '700', color: theme.text }}>MyLibrary</Text> é seu app pessoal para gerenciar e compartilhar sua biblioteca.
              Organize livros, acompanhe leituras, explore bibliotecas de amigos e facilite empréstimos.
            </Text>
          </Row>
          <Row icon="verified-user">
            <Text style={styles.p}>
              Projeto inspirado em Material Design 3, com foco em simplicidade, performance e privacidade.
            </Text>
          </Row>
          <Row icon="code">
            <Text style={styles.p}>
              Código-fonte e issues:{' '}
              <Text style={styles.link} onPress={() => Linking.openURL('https://github.com/Doug-13/MyLibrary_Front_')}>GitHub</Text>
            </Text>
          </Row>
          <Row icon="info">
            <Text style={styles.p}>Versão 1.0 — feito com ❤️ para leitores.</Text>
          </Row>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================
   STYLES (no fim do arquivo)
   ============================ */
function createStyles(theme, mode) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    hero: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14,
      borderBottomWidth: 1, borderBottomColor: '#F6E68B',
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroTitle: { fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center' },
    heroSubtitle: { marginTop: 4, fontSize: 12, color: theme.text, textAlign: 'center', opacity: 0.9 },
    container: { flex: 1 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    card: {
      backgroundColor: theme.card,
      borderRadius: RADIUS, paddingHorizontal: 8, paddingVertical: 12,
      elevation: ELEV, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: ELEV },
      borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8 },
    iconWrap: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      backgroundColor: mode === 'dark' ? '#2A2A2A' : '#F4F5F7',
      borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, marginRight: 12,
    },
    rowTitle: { fontSize: 16, color: theme.text, fontWeight: '700' },
    rowSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    logo: { width: 84, height: 84, borderRadius: 16, marginBottom: 10, alignSelf: 'center' },
    p: { fontSize: 14, lineHeight: 20, color: theme.textSecondary },
    link: { color: theme.secondary, fontWeight: '700' },
  });
}
