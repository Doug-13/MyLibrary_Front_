import React, { useMemo, useContext, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../../context/ThemeContext';

const SPACING = { md: 16 };
const RADIUS = 12;
const ELEV = 2;

const ARTICLES = {
  'como-adicionar-livros': {
    title: 'Como adicionar livros',
    body:
      'Você pode adicionar um livro pelo ISBN, pesquisando por título/autor ou cadastrando manualmente. ' +
      'Na tela de adicionar, use o campo de busca ou o formulário completo.',
  },
  'seguir-amigos': {
    title: 'Seguir amigos',
    body:
      'Procure usuários pelo nome ou código. Ao seguir, você poderá explorar a biblioteca deles e ' +
      'solicitar empréstimos quando permitido.',
  },
  'backup-sincronizacao': {
    title: 'Backup e sincronização',
    body:
      'Ative o backup automático nas Configurações para manter seus dados seguros e sincronizados ' +
      'em múltiplos dispositivos.',
  },
};

export default function HelpArticle() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext);

  const { slug } = route.params || {};
  const article = ARTICLES[slug] || { title: 'Artigo', body: 'Conteúdo em breve.' };

  const returnTo = route.params?.returnTo || 'Settings';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const goBackToSettings = useCallback(() => {
    navigation.navigate(returnTo);
    return true;
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
          <Text style={styles.heroTitle}>Ajuda</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.heroSubtitle}>{article.title}</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.p}>{article.body}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========== STYLES (fim) ========== */
function createStyles(theme) {
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
    card: {
      backgroundColor: theme.card,
      borderRadius: RADIUS, paddingHorizontal: 12, paddingVertical: 12,
      elevation: ELEV, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: ELEV },
      borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
      margin: SPACING.md,
    },
    title: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
    p: { fontSize: 14, lineHeight: 20, color: theme.textSecondary },
  });
}
