import React, { useMemo, useContext, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../../context/ThemeContext';

const RADIUS = 12;
const ELEV = 2;
const SPACING = { xs: 6, sm: 10, md: 16, lg: 20 };

export default function TermsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useContext(ThemeContext);

  const returnTo = route.params?.returnTo || 'Settings';
  const styles = useMemo(() => createStyles(theme), [theme]);

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

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
          <Text style={styles.heroTitle}>Termos de Uso</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.heroSubtitle}>Regras e responsabilidades ao usar o MyLibrary</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }} showsVerticalScrollIndicator={false}>
        <Section title="Aceitação dos termos">
          <Text style={styles.p}>
            Ao usar o app, você concorda com estes termos. Se não concordar, não utilize o MyLibrary.
          </Text>
        </Section>

        <Section title="Uso do aplicativo">
          <Text style={styles.li}>• Não utilize o app para atividades ilegais.</Text>
          <Text style={styles.li}>• Mantenha seu acesso seguro e não compartilhe credenciais.</Text>
          <Text style={styles.li}>• Respeite a privacidade e o acervo de outros usuários.</Text>
        </Section>

        <Section title="Conteúdo do usuário">
          <Text style={styles.p}>
            Você é responsável pelo conteúdo que cadastra (ex.: capas, resenhas). Podemos remover conteúdos que violem direitos ou estes termos.
          </Text>
        </Section>

        <Section title="Limitação de responsabilidade">
          <Text style={styles.p}>
            O MyLibrary é oferecido “como está”. Empregamos melhores práticas, mas não garantimos disponibilidade contínua.
          </Text>
        </Section>

        <Section title="Modificações">
          <Text style={styles.p}>
            Podemos atualizar estes termos. Alterações relevantes serão comunicadas pelo app.
          </Text>
        </Section>

        <Section title="Contato">
          <Text style={styles.p}>
            Dúvidas sobre os termos? Escreva para <Text style={{ fontWeight: '700', color: theme.text }}>legal@mylibrary.app</Text>.
          </Text>
        </Section>

        <View style={{ height: 12 }} />
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
    sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    card: {
      backgroundColor: theme.card,
      borderRadius: RADIUS, paddingHorizontal: 12, paddingVertical: 12,
      elevation: ELEV, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: ELEV },
      borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    },
    h3: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 6 },
    p: { fontSize: 14, lineHeight: 20, color: theme.textSecondary, marginBottom: 10 },
    li: { fontSize: 14, lineHeight: 20, color: theme.textSecondary, marginBottom: 6 },
  });
}
