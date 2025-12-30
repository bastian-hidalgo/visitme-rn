import AppleLoginButton, {
  type AppleLoginButtonStatus,
  type AppleLoginStatusChangeDetails,
} from '@/components/auth/AppleLoginButton';
import GoogleLoginButton, {
  type GoogleLoginButtonStatus,
} from '@/components/auth/GoogleLoginButton';
import { ThemedText } from '@/components/themed-text';
import { env } from '@/constants/env';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ArrowRight, Mail } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const videoSource = require('@/assets/videos/login-bg.mp4');

const getMagicLinkRedirectUrl = () => {
    const base = (env.authBaseUrl || '').trim();
    if (!base) return undefined;
    const deviceDeepLink = Linking.createURL('/auth/callback/client');
    const url = new URL(base);
    url.searchParams.set('deep_link', deviceDeepLink);
    return url.toString();
};

export default function LoginScreen() {
    const { session, isLoading: isAuthLoading, authRestrictionMessage, clearAuthRestrictionMessage } = useSupabaseAuth();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const palette = Colors[colorScheme ?? 'light'];
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isAppleLoading, setIsAppleLoading] = useState(false);
    
    const [logoTapCount, setLogoTapCount] = useState(0);

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [isShowingEmailForm, setIsShowingEmailForm] = useState(false);

    // Video Player
    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    useEffect(() => {
        if (authRestrictionMessage) {
            setErrorMessage(authRestrictionMessage);
        }
    }, [authRestrictionMessage]);

    const handleLogoPress = () => {
        setLogoTapCount((prev) => {
            const newCount = prev + 1;
            if (newCount === 6) {
                setShowPasswordInput(true);
                return 0;
            }
            return newCount;
        });
    };

    const snapPoints = useMemo(() => ['45%', '85%'], []);

    const openLoginOptions = () => {
        bottomSheetRef.current?.present();
    };

    const handleMagicLinkSubmit = async () => {
        if (!email.trim() || !email.includes('@')) {
            setErrorMessage('Ingresa un correo electrónico válido.');
            return;
        }

        try {
            setIsMagicLinkLoading(true);
            setErrorMessage(null);
            setStatusMessage(null);
            
            const emailRedirectTo = getMagicLinkRedirectUrl();
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: { emailRedirectTo },
            });
            
            if (error) throw error;
            
            setStatusMessage('Enlace enviado. Revisa tu correo.');
            // Close after a short delay or stay open? Let's stay open to show message
        } catch (error: any) {
            setErrorMessage('Error al enviar el enlace. Intenta de nuevo.');
        } finally {
            setIsMagicLinkLoading(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setErrorMessage('Completa todos los campos.');
            return;
        }

        try {
            setIsPasswordLoading(true);
            setErrorMessage(null);
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });
            if (error) throw error;
        } catch (error: any) {
            setErrorMessage(error.message || 'Error al iniciar sesión.');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const handleGoogleStatusChange = useCallback((status: GoogleLoginButtonStatus, details?: { errorMessage?: string | null }) => {
        if (status === 'loading') {
            setIsGoogleLoading(true);
            setErrorMessage(null);
            return;
        }
        setIsGoogleLoading(false);
        if (status === 'error') {
            setErrorMessage(details?.errorMessage ?? 'Error con Google.');
        }
    }, []);

    const handleAppleStatusChange = useCallback((status: AppleLoginButtonStatus, details?: AppleLoginStatusChangeDetails) => {
        if (status === 'loading') {
            setIsAppleLoading(true);
            setErrorMessage(null);
            return;
        }
        setIsAppleLoading(false);
        if (status === 'error') {
            setErrorMessage(details?.errorMessage ?? 'Error con Apple.');
        }
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        ),
        []
    );

    if (isAuthLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (session) {
        return <Redirect href="/(tabs)" />;
    }

    const isBusy = isMagicLinkLoading || isPasswordLoading || isGoogleLoading || isAppleLoading;

    return (
        <View style={styles.container}>
            {/* Background Video */}
            <VideoView
                player={player}
                style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}
                contentFit="cover"
                nativeControls={false}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
            />
            
            {/* Dark Overlay for readability */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.mainContent}>
                    {/* Logo */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 1000 }}
                        style={styles.logoContainer}
                    >
                        <Pressable onPress={handleLogoPress}>
                            <Image
                                source={require('@/assets/logo-white.png')}
                                style={styles.logo}
                                contentFit="contain"
                            />
                        </Pressable>
                    </MotiView>

                    {/* Welcome Text */}
                    <View style={styles.welcomeContainer}>
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 800, delay: 400 }}
                        >
                            <ThemedText style={styles.welcomeTitle}>Vive tu comunidad</ThemedText>
                        </MotiView>
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 800, delay: 600 }}
                        >
                            <ThemedText style={styles.welcomeSubtitle}>
                                Reserva espacios comunes, gestiona invitaciones seguras, recibe encomiendas y mantente conectado con tu comunidad.
                            </ThemedText>
                        </MotiView>
                    </View>

                    {/* Login CTA */}
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 800, delay: 1000 }}
                        style={styles.ctaContainer}
                    >
                        <Pressable
                            style={styles.ctaButton}
                            onPress={openLoginOptions}
                        >
                            <ThemedText style={styles.ctaButtonText}>Comenzar ahora</ThemedText>
                            <ArrowRight size={20} color="#fff" />
                        </Pressable>
                    </MotiView>
                </View>

                {/* Footer Info */}
                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1000, delay: 1200 }}
                    style={[styles.footer, { marginBottom: insets.bottom + 10 }]}
                >
                    <ThemedText style={styles.footerText}>
                        Exclusivo para residentes autorizados.
                    </ThemedText>
                </MotiView>
            </SafeAreaView>

            {/* Login Modal */}
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
                backgroundStyle={{ borderRadius: 32 }}
                onDismiss={() => {
                    setIsShowingEmailForm(false);
                    setErrorMessage(null);
                    setStatusMessage(null);
                }}
            >
                <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
                    <View style={styles.sheetHeader}>
                        <ThemedText style={styles.sheetTitle}>Iniciar Sesión</ThemedText>
                        <ThemedText style={styles.sheetSubtitle}>
                            {isShowingEmailForm 
                                ? 'Ingresa tu correo institucional.' 
                                : 'Elige tu método de acceso preferido.'}
                        </ThemedText>
                    </View>

                    <AnimatePresence>
                        {!isShowingEmailForm ? (
                            <MotiView
                                key="options"
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                exit={{ opacity: 0, translateX: 20 }}
                                style={styles.optionsList}
                            >
                                {Platform.OS === 'ios' && (
                                    <AppleLoginButton
                                        onStatusChange={handleAppleStatusChange}
                                        onSuccess={() => {}}
                                        disabled={isBusy}
                                    />
                                )}
                                <GoogleLoginButton
                                    onStatusChange={handleGoogleStatusChange}
                                    onSuccess={() => {}}
                                    disabled={isBusy}
                                />
                                
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <ThemedText style={styles.dividerText}>o también</ThemedText>
                                    <View style={styles.dividerLine} />
                                </View>

                                <Pressable
                                    onPress={() => setIsShowingEmailForm(true)}
                                    style={styles.emailOptionButton}
                                >
                                    <View style={styles.emailIconBox}>
                                        <Mail size={18} color="#6366F1" />
                                    </View>
                                    <ThemedText style={styles.emailOptionText}>Continuar con Email</ThemedText>
                                </Pressable>
                            </MotiView>
                        ) : (
                            <MotiView
                                key="form"
                                from={{ opacity: 0, translateX: 20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                exit={{ opacity: 0, translateX: -20 }}
                                style={styles.emailForm}
                            >
                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.inputLabel}>Correo electrónico</ThemedText>
                                    <BottomSheetTextInput
                                        autoFocus
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholder="ejemplo@visitme.cl"
                                        style={styles.textInput}
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>

                                {showPasswordInput && (
                                    <View style={styles.inputGroup}>
                                        <ThemedText style={styles.inputLabel}>Contraseña</ThemedText>
                                        <BottomSheetTextInput
                                            secureTextEntry
                                            placeholder="Tu contraseña"
                                            style={styles.textInput}
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                    </View>
                                )}

                                <Pressable
                                    style={[styles.formSubmitButton, isBusy && styles.buttonDisabled]}
                                    onPress={showPasswordInput ? handlePasswordSubmit : handleMagicLinkSubmit}
                                    disabled={isBusy}
                                >
                                    {isMagicLinkLoading || isPasswordLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <ThemedText style={styles.formSubmitText}>
                                            {showPasswordInput ? 'Entrar' : 'Enviar Enlace Mágico'}
                                        </ThemedText>
                                    )}
                                </Pressable>

                                <Pressable
                                    style={styles.backButton}
                                    onPress={() => {
                                        setIsShowingEmailForm(false);
                                        setErrorMessage(null);
                                        setStatusMessage(null);
                                    }}
                                >
                                    <ThemedText style={styles.backButtonText}>Usar otro método</ThemedText>
                                </Pressable>
                            </MotiView>
                        )}
                    </AnimatePresence>

                    {/* Messages */}
                    <AnimatePresence>
                        {(errorMessage || statusMessage) && (
                            <MotiView
                                from={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={[
                                    styles.messageContainer,
                                    errorMessage ? styles.errorContainer : styles.successContainer
                                ]}
                            >
                                <ThemedText style={[
                                    styles.messageText,
                                    errorMessage ? styles.errorText : styles.successText
                                ]}>
                                    {errorMessage || statusMessage}
                                </ThemedText>
                            </MotiView>
                        )}
                    </AnimatePresence>
                </BottomSheetScrollView>
            </BottomSheetModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    safeArea: { flex: 1 },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        marginBottom: 40,
    },
    logo: {
        width: 220,
        height: 60,
    },
    welcomeContainer: {
        alignItems: 'center',
        gap: 12,
        marginBottom: 60,
    },
    welcomeTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    ctaContainer: {
        width: '100%',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#6366F1',
        paddingVertical: 18,
        borderRadius: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    // Bottom Sheet
    bottomSheetContent: {
        padding: 24,
        paddingBottom: 40,
    },
    sheetHeader: {
        marginBottom: 32,
        alignItems: 'center',
    },
    sheetTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    sheetSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    optionsList: {
        gap: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F1F5F9',
    },
    dividerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    emailOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emailIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    emailOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    // Email Form
    emailForm: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginLeft: 4,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1E293B',
    },
    formSubmitButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    formSubmitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    backButtonText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    // Messages
    messageContainer: {
        marginTop: 24,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    errorContainer: {
        backgroundColor: '#FFF1F2',
    },
    successContainer: {
        backgroundColor: '#F0FDF4',
    },
    messageText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    errorText: {
        color: '#E11D48',
    },
    successText: {
        color: '#16A34A',
    },
});
