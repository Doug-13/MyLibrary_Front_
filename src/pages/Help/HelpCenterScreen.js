import React, { useMemo, useContext, useEffect, useCallback, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable, Linking, BackHandler, LayoutAnimation, Platform, UIManager } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../../../context/ThemeContext';

const RADIUS = 12;
const ELEV = 2;
const SPACING = { xs: 6, sm: 10, md: 16, lg: 20 };

// Habilita animação layout no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpCenterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, mode } = useContext(ThemeContext);

  const returnTo = route.params?.returnTo || 'Settings';
  const styles = useMemo(() => createStyles(theme, mode), [theme, mode]);

  // controla quais itens estão abertos
  const [open, setOpen] = useState({
    addBooks: false,
    followFriends: false,
    backup: false,
    policies: false,
  });

  const toggle = useCallback((key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const Chevron = ({ expanded }) => (
    <Icon
      name={expanded ? 'expand-less' : 'expand-more'}
      size={22}
      color={theme.label}
    />
  );

  const Divider = () => <View style={styles.divider} />;
  const Card = ({ children }) => <View style={styles.card}>{children}</View>;

  const Row = ({ icon, title, subtitle, expanded, onPress }) => (
    <Pressable onPress={onPress} android_ripple={{ color: '#00000010' }}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={22} color={theme.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.trailing}>
          <Chevron expanded={expanded} />
        </View>
      </View>
    </Pressable>
  );

  const Bullet = ({ children }) => <Text style={styles.li}>• {children}</Text>;

  const openLink = useCallback((url) => Linking.openURL(url).catch(() => {}), []);

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
          <Text style={styles.heroTitle}>Central de Ajuda</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.heroSubtitle}>Tire dúvidas e fale com a gente</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }} showsVerticalScrollIndicator={false}>
        {/* Dúvidas rápidas */}
        <Section title="Dúvidas rápidas" styles={styles}>
          <Card>
            {/* Como adicionar livros */}
            <Row
              icon="search"
              title="Como adicionar livros"
              subtitle="Passo a passo para cadastrar pelo ISBN ou manual"
              expanded={open.addBooks}
              onPress={() => toggle('addBooks')}
            />
            {open.addBooks && (
              <View style={styles.contentBox}>
                <Text style={styles.p}>
                  Você pode adicionar livros de três formas:
                </Text>
                <Bullet>Busca por ISBN: informe o código e confirme o resultado.</Bullet>
                <Bullet>Busca por título/autor: escolha na lista de resultados.</Bullet>
                <Bullet>Cadastro manual: preencha título, autor, editora e status.</Bullet>
                <Text style={styles.p}>
                  Dica: utilize a visibilidade da biblioteca em <Text style={styles.bold}>Configurações → Preferências</Text> para controlar quem vê seus livros.
                </Text>
              </View>
            )}
            <Divider />

            {/* Seguir amigos */}
            <Row
              icon="group"
              title="Seguir amigos"
              subtitle="Explorar bibliotecas e pedir empréstimos"
              expanded={open.followFriends}
              onPress={() => toggle('followFriends')}
            />
            {open.followFriends && (
              <View style={styles.contentBox}>
                <Bullet>Procure pessoas pelo nome de usuário ou código.</Bullet>
                <Bullet>Toque em <Text style={styles.bold}>Seguir</Text> para ver a biblioteca deles.</Bullet>
                <Bullet>Se permitido, solicite empréstimo a partir do card do livro.</Bullet>
                <Text style={styles.p}>
                  Você será notificado quando houver resposta. Ajuste notificações em <Text style={styles.bold}>Configurações</Text>.
                </Text>
              </View>
            )}
            <Divider />

            {/* Backup e sincronização */}
            <Row
              icon="sync"
              title="Backup e sincronização"
              subtitle="Mantenha tudo seguro e atualizado"
              expanded={open.backup}
              onPress={() => toggle('backup')}
            />
            {open.backup && (
              <View style={styles.contentBox}>
                <Bullet>Ative o <Text style={styles.bold}>Backup automático</Text> em Configurações → Dados e sincronização.</Bullet>
                <Bullet>Quando ativo, alterações ficam salvas na nuvem e restauradas ao reinstalar.</Bullet>
                <Bullet>Use <Text style={styles.bold}>Economia de dados</Text> se sua rede estiver limitada.</Bullet>
                <Text style={styles.note}>
                  Observação: o primeiro backup pode demorar um pouco dependendo do seu acervo.
                </Text>
              </View>
            )}
            <Divider />

            {/* Políticas & segurança */}
            <Row
              icon="policy"
              title="Políticas & segurança"
              subtitle="Resumo de privacidade e termos"
              expanded={open.policies}
              onPress={() => toggle('policies')}
            />
            {open.policies && (
              <View style={styles.contentBox}>
                <Text style={styles.h3}>Privacidade</Text>
                <Bullet>Coletamos dados mínimos para o app funcionar.</Bullet>
                <Bullet>Não vendemos seus dados.</Bullet>
                <Bullet>Você controla a visibilidade da sua biblioteca.</Bullet>

                <Text style={styles.h3}>Segurança</Text>
                <Bullet>Criptografia em trânsito e repouso (quando disponível).</Bullet>
                <Bullet>Controles de acesso e boas práticas de armazenamento.</Bullet>

                <Text style={styles.h3}>Termos</Text>
                <Bullet>Use o app de forma legal e respeitando outras pessoas.</Bullet>
                <Bullet>Você é responsável pelo conteúdo que publica.</Bullet>

                <Text style={styles.p}>
                  Leia na íntegra:
                  {' '}
                  <Text style={styles.link} onPress={() => openLink('https://example.com/privacy')}>Política de Privacidade</Text>
                  {'  •  '}
                  <Text style={styles.link} onPress={() => openLink('https://example.com/terms')}>Termos de Uso</Text>
                </Text>
              </View>
            )}
          </Card>
        </Section>

        {/* Contato */}
        <Section title="Contato" styles={styles}>
          <Card>
            <InlineRow
              icon="mail-outline"
              title="E-mail de suporte"
              subtitle="contato@mylibrary.app"
            />
            <Divider />
            <Pressable onPress={() => openLink('https://github.com/Doug-13/MyLibrary_Front_/issues')} android_ripple={{ color: '#00000010' }}>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Icon name="bug-report" size={22} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Reportar um problema</Text>
                  <Text style={styles.rowSubtitle}>Abra um issue no GitHub</Text>
                </View>
                <View style={styles.trailing}>
                  <Icon name="open-in-new" size={20} color={theme.label} />
                </View>
              </View>
            </Pressable>
          </Card>
        </Section>

        <Text style={styles.footerText}>Precisa de algo específico? Fale com a gente pelo e-mail.</Text>
        <View style={{ height: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, styles, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InlineRow({ icon, title, subtitle }) {
  const { theme, mode } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme, mode), [theme, mode]); // só para pegar cores/tamanhos
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={22} color={theme.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

/* ========== STYLES (fim) ========== */
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
      borderRadius: RADIUS, paddingHorizontal: 8, paddingVertical: 4,
      elevation: ELEV, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: ELEV },
      borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border,
    },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
    iconWrap: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      backgroundColor: mode === 'dark' ? '#2A2A2A' : '#F4F5F7',
      borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, marginRight: 12,
    },
    rowTitle: { fontSize: 16, color: theme.text, fontWeight: '700' },
    rowSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    trailing: { marginLeft: 10 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: 56 },

    contentBox: { paddingHorizontal: 8, paddingBottom: 12 },
    p: { fontSize: 14, lineHeight: 20, color: theme.textSecondary, marginTop: 6 },
    li: { fontSize: 14, lineHeight: 20, color: theme.textSecondary, marginTop: 6 },
    h3: { fontSize: 15, fontWeight: '800', color: theme.text, marginTop: 10 },

    link: { color: theme.secondary, fontWeight: '700' },
    bold: { fontWeight: '700', color: theme.text },
    note: { fontSize: 12, lineHeight: 18, color: theme.label, marginTop: 6 },

    footerText: { textAlign: 'center', color: theme.label, fontSize: 12, marginTop: 16 },
  });
}
