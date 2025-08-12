// screens/AboutScreen/index.js
import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';


const COLORS = {
  primary: '#F3D00F',
  secondary: '#4E8CFF',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  label: '#B2BEC3',
  border: '#E0E0E0',
  success: '#28A745',
  error: '#DC3545',
};

const RADIUS = 12;
const ELEV = 2;

export default function AboutScreen() {
  const navigation = useNavigation();

  const features = useMemo(
    () => [
      { icon: 'menu-book', text: 'Gerencie sua biblioteca pessoal de livros.' },
      { icon: 'people-outline', text: 'Explore as bibliotecas dos seus amigos.' },
      { icon: 'outgoing-mail', text: 'Solicite livros emprestados de outros usuários.' },
      { icon: 'published-with-changes', text: 'Registre devoluções e acompanhe empréstimos.' },
      { icon: 'star-border', text: 'Classifique e avalie seus livros favoritos.' },
    ],
    []
  );

  // Links
  const openMail = useCallback(() => Linking.openURL('mailto:suporte@bibliotech.com'), []);
  const openPhone = useCallback(() => Linking.openURL('tel:+5511123456789'), []);
  const openSite = useCallback(() => Linking.openURL('https://www.bibliotech.com'), []);

  // Redes sociais
  const openInstagram = useCallback(
    () => Linking.openURL('https://www.instagram.com/bibliotech'),
    []
  );
  const openFacebook = useCallback(
    () => Linking.openURL('https://www.facebook.com/bibliotech'),
    []
  );
  const openLinkedIn = useCallback(
    () => Linking.openURL('https://www.linkedin.com/company/bibliotech'),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      {/* Faixa superior */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Image
          source={require('../../../assets/logo_Preto.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={styles.appName}>Bibliotech</Text>
        <Text style={styles.appTagline}>Sua biblioteca, do seu jeito.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Apresentação */}
        <View style={styles.card}>
          <Text style={styles.title}>Bem-vindo ao Bibliotech</Text>
          <Text style={styles.paragraph}>
            O Bibliotech é o seu aplicativo pessoal para gerenciar e compartilhar sua biblioteca de
            livros. Com ele, você pode organizar seus livros, explorar bibliotecas de amigos e muito
            mais.
          </Text>
        </View>

        {/* Funcionalidades */}
        <View style={styles.card}>
          <Text style={styles.subTitle}>Principais funcionalidades</Text>
          <View style={styles.list}>
            {features.map((f, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.listIconWrap}>
                  <Icon name={f.icon} size={18} color={COLORS.text} />
                </View>
                <Text style={styles.listText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Missão */}
        <View style={styles.card}>
          <Text style={styles.subTitle}>Nossa missão</Text>
          <Text style={styles.paragraph}>
            Criar uma comunidade de leitores apaixonados, ajudando você a compartilhar histórias e
            conectar-se com outras pessoas por meio dos livros.
          </Text>
        </View>

        {/* Contato */}
        <View style={styles.card}>
          <Text style={styles.subTitle}>Entre em contato</Text>

          {/* E-mail */}
          <TouchableOpacity style={styles.contactRow} onPress={openMail} activeOpacity={0.85}>
            <View style={styles.contactIconWrap}>
              <Icon name="alternate-email" size={18} color={COLORS.text} />
            </View>
            <Text style={styles.contactText}>suporte@bibliotech.com</Text>
            <Icon name="open-in-new" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Telefone */}
          <TouchableOpacity style={styles.contactRow} onPress={openPhone} activeOpacity={0.85}>
            <View style={styles.contactIconWrap}>
              <Icon name="call" size={18} color={COLORS.text} />
            </View>
            <Text style={styles.contactText}>(11) 12345-6789</Text>
            <Icon name="open-in-new" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Website */}
          <TouchableOpacity style={styles.contactRow} onPress={openSite} activeOpacity={0.85}>
            <View style={styles.contactIconWrap}>
              <Icon name="public" size={18} color={COLORS.text} />
            </View>
            <Text style={[styles.contactText, styles.link]}>www.bibliotech.com</Text>
            <Icon name="open-in-new" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Redes sociais */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#E1306C' }]}
              onPress={openInstagram}
            >
              <Icon name="photo-camera" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
              onPress={openFacebook}
            >
              <Icon name="facebook" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: '#0A66C2' }]}
              onPress={openLinkedIn}
            >
              <Icon name="business-center" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>Versão 2025.00.01</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR = 128;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  hero: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F6E68B',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 6,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logo: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  appName: { marginTop: 10, fontSize: 24, fontWeight: '800', color: COLORS.text },
  appTagline: { marginTop: 2, fontSize: 16, color: COLORS.text, opacity: 0.9 },
  scrollView: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    elevation: ELEV,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  paragraph: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary },
  list: { marginTop: 8, gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  listIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.text },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  contactIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactText: { flex: 1, color: COLORS.text, fontWeight: '600' },
  link: { textDecorationLine: 'underline', color: COLORS.secondary, fontWeight: '700' },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 12,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.label,
  },
});
