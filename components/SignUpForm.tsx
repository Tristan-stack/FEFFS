import React, { useState, useEffect, useRef } from 'react';
import {
    Animated,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


export default function SignUpScreen({ onLogin }: { onLogin: () => void }) {
    const colorScheme = useColorScheme();

    const [formType, setFormType] = useState<'signup' | 'signin'>('signup');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [firstname, setFirstname] = useState('');
    const [psw, setPsw] = useState('');
    const [pass, setPass] = useState('');
    const [program, setProgram] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const firstnameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const pswRef = useRef<TextInput>(null);

    const formPosition = useRef(new Animated.Value(800)).current;

    const hashedPsw = async (psw: string): Promise<string> => {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            psw
        );
    }

    useEffect(() => {
        const checkUser = async () => {
            const storedName = await AsyncStorage.getItem('name');
            const storedEmail = await AsyncStorage.getItem('email');
            const storedFirstname = await AsyncStorage.getItem('firstname');
            if (storedName && storedEmail && storedFirstname) {
                setName(storedName);
                setEmail(storedEmail);
                setFirstname(storedFirstname);
                onLogin();
            }
        };
        checkUser();
    }, []);

    // Gérer l'animation du formulaire
    const handleStart = () => {
        setIsFormVisible(true);
        Animated.timing(formPosition, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const handleCloseForm = () => {
        Animated.timing(formPosition, {
            toValue: 800,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            setIsFormVisible(false);
        });
    }

    // Gérer l'inscription
    const handleSignUp = async () => {
        if (!name || !email || !firstname || !psw) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Veuillez entrer un email valide.');
            return;
        }

        try {
            await AsyncStorage.setItem('name', name);
            await AsyncStorage.setItem('email', email);
            await AsyncStorage.setItem('firstname', firstname);
            const hashedPassword = await hashedPsw(psw);

            const response = await fetch('https://feffs.elioooooo.fr/user/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "userId": null,
                    "email": email,
                    "birthdate": null,
                    "image": null,
                    "firstname": firstname,
                    "lastname": name,
                    "password": hashedPassword,
                }),
            });

            if (!response.ok) {
                setError('Erreur lors de l\'inscription.');
            }
            onLogin();
            setError(null);
        } catch (error) {
            setError('Erreur lors de l\'enregistrement.');
        }
    };

    const handleSignIn = async () => {
        if (!email || !psw) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Veuillez entrer un email valide.');
            return;
        }

        try {
            const hashedPassword = await hashedPsw(psw);

            const userByEmail = await fetch(`https://feffs.elioooooo.fr/user/verify`, {
                method: 'Post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "email": email,
                    "password": hashedPassword,
                }),
            });

            const contentType = userByEmail.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const userData = await userByEmail.json();
                if (userData.success == true) {
                    await AsyncStorage.setItem('name', userData.user.lastname);
                    await AsyncStorage.setItem('email', email);
                    await AsyncStorage.setItem('firstname', userData.user.firstname);
                    console.log("email:", email);

                    const userId = await fetch(`https://feffs.elioooooo.fr/user/get`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            "email": email,
                        }),
                    }).then((response) => response.json())
                        .then((data) => {
                            console.log("userId:", data.userId);
                            return data.userId;
                        });

                    const userProgramResponse = await fetch(`https://feffs.elioooooo.fr/program/get`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            "userId": userId,
                        }),
                    });

                    const userProgram = await userProgramResponse.json();

                    if (userProgramResponse.status === 200) {
                        await AsyncStorage.setItem('program', JSON.stringify(userProgram));
                        setProgram(userProgram);
                        console.log("Programme:", userProgram);
                    }

                    const userPassResponse = await fetch(`https://feffs.elioooooo.fr/pass/get`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            "email": email,
                        }),
                    });

                    const userPass = await userPassResponse.json();

                    if (userPassResponse.status === 200) {
                        await AsyncStorage.setItem('pass', JSON.stringify(userPass));
                        setPass(userPass);
                        console.log("Pass:", userPass);
                    }

                    onLogin();
                    setError(null);
                } else {
                    setError('Mot de passe incorrect.');
                }
            } else {
                setError('Réponse du serveur invalide.');
            }
        } catch (error) {
            setError(`Erreur lors de l\'enregistrement. ${error}`);
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.topSection}>
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 50,
                        marginBottom: 20,
                        shadowColor: '#fff',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 25,
                        elevation: 10,
                        overflow: 'hidden'
                    }}
                    accessible={true}
                    accessibilityLabel="Logo de l'application FEFFS"
                    accessibilityRole="image"
                >
                    <Image
                        style={{ width: '100%', height: '100%' }}
                        source={require('@/assets/images/logo.png')}
                        accessible={false}
                    />
                </View>
                <Text
                    style={[styles.tagline, { color: Colors[colorScheme ?? 'light'].text }]}
                    accessible={true}
                    accessibilityRole="header"
                    accessibilityLabel="Simplifiez votre expérience, inscrivez-vous rapidement."
                >
                    Simplifiez votre expérience, inscrivez-vous rapidement.
                </Text>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => { handleStart(); setFormType('signup'); }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Bouton pour s'inscrire"
                    accessibilityHint="Appuyez pour ouvrir le formulaire d'inscription"
                >
                    <Text style={styles.startButtonText}>S'inscrire</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.importButton}
                    onPress={() => { handleStart(); setFormType('signin'); }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Bouton pour se connecter"
                    accessibilityHint="Appuyez pour ouvrir le formulaire de connexion"
                >
                    <Text style={styles.startButtonText}>Se connecter</Text>
                </TouchableOpacity>
            </View>

            {/* Formulaire animé */}
            {isFormVisible && formType === 'signup' && (
                <Animated.View
                    style={[styles.formContainer, { transform: [{ translateY: formPosition }], backgroundColor: Colors[colorScheme ?? 'light'].cardDarkBg }]}
                    accessible={true}
                    accessibilityLabel="Formulaire d'inscription"
                    
                    accessibilityViewIsModal={true}
                >
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseForm}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Bouton de fermeture"
                        accessibilityHint="Appuyez pour fermer le formulaire d'inscription"
                    >
                        <Text style={[styles.closeButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>✕</Text>
                    </TouchableOpacity>
                    <Text
                        style={[styles.formTitle, { color: Colors[colorScheme ?? 'light'].text }]}
                        accessible={true}
                        accessibilityRole="header"
                        accessibilityLabel="Créer un compte"
                    >
                        Créer un compte
                    </Text>
                    <Text
                        style={[styles.formSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}
                        accessible={true}
                        accessibilityLabel="Inscrivez-vous pour continuer"
                    >
                        Inscrivez-vous pour continuer
                    </Text>
                    {error && <Text style={styles.error} accessible={true} accessibilityRole="alert">{error}</Text>}
                    <TextInput
                        placeholder="Nom"
                        style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                        accessible={true}
                        accessibilityLabel="Champ pour le nom"
                        accessibilityHint="Entrez votre nom"
                        autoFocus={true}
                        importantForAccessibility="yes"
                        returnKeyType="next"
                        onSubmitEditing={() => firstnameRef.current?.focus()}
                    />
                    <TextInput
                        ref={firstnameRef}
                        placeholder="Prénom"
                        style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                        placeholderTextColor="#aaa"
                        value={firstname}
                        onChangeText={setFirstname}
                        accessible={true}
                        accessibilityLabel="Champ pour le prénom"
                        accessibilityHint="Entrez votre prénom"
                        importantForAccessibility="yes"
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                    />
                    <TextInput
                        ref={emailRef}
                        placeholder="Email"
                        style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                        keyboardType="email-address"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        accessible={true}
                        accessibilityLabel="Champ pour l'email"
                        accessibilityHint="Entrez votre adresse email"
                        importantForAccessibility="yes"
                        returnKeyType="next"
                        onSubmitEditing={() => pswRef.current?.focus()}
                    />
                    <TextInput
                        ref={pswRef}
                        placeholder="Mot de passe"
                        style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                        secureTextEntry={true}
                        placeholderTextColor="#aaa"
                        value={psw}
                        onChangeText={setPsw}
                        accessible={true}
                        accessibilityLabel="Champ pour le mot de passe"
                        accessibilityHint="Entrez votre mot de passe"
                        importantForAccessibility="yes"
                        returnKeyType="done"
                        onSubmitEditing={handleSignUp}
                    />
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSignUp}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Bouton pour s'inscrire"
                        accessibilityHint="Appuyez pour soumettre le formulaire d'inscription"
                    >
                        <Text style={styles.submitButtonText}>S'inscrire</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
            {isFormVisible && formType === 'signin' && (
                <Animated.View
                    style={[styles.formContainer, { transform: [{ translateY: formPosition }], backgroundColor: Colors[colorScheme ?? 'light'].cardDarkBg }]}
                    accessible={true}
                    accessibilityLabel="Formulaire de connexion"
                    
                    accessibilityViewIsModal={true}
                >
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseForm}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Bouton de fermeture"
                        accessibilityHint="Appuyez pour fermer le formulaire de connexion"
                    >
                        <Text style={[styles.closeButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>✕</Text>
                    </TouchableOpacity>
                    <Text
                        style={[styles.formTitle, { color: Colors[colorScheme ?? 'light'].text }]}
                        accessible={true}
                        accessibilityRole="header"
                        accessibilityLabel="Se connecter"
                    >
                        Se connecter
                    </Text>
                    <Text
                        style={[styles.formSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}
                        accessible={true}
                        accessibilityLabel="Connectez-vous à un compte déjà existant"
                    >
                        Connectez-vous à un compte déjà existant
                    </Text>
                    {error && <Text style={styles.error} accessible={true} accessibilityRole="alert">{error}</Text>}
                    <TextInput
                        placeholder="Email"
                        style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                        keyboardType="email-address"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        accessible={true}
                        accessibilityLabel="Champ pour l'email"
                        accessibilityHint="Entrez votre adresse email"
                        autoFocus={true}
                        importantForAccessibility="yes"
                        returnKeyType="next"
                        onSubmitEditing={() => pswRef.current?.focus()}
                    />
                    <TextInput
                        ref={pswRef}
                        placeholder="Mot de passe"
                        style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                        secureTextEntry={true}
                        placeholderTextColor="#aaa"
                        value={psw}
                        onChangeText={setPsw}
                        accessible={true}
                        accessibilityLabel="Champ pour le mot de passe"
                        accessibilityHint="Entrez votre mot de passe"
                        importantForAccessibility="yes"
                        returnKeyType="done"
                        onSubmitEditing={handleSignIn}
                    />
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSignIn}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Bouton pour se connecter"
                        accessibilityHint="Appuyez pour soumettre le formulaire de connexion"
                    >
                        <Text style={styles.submitButtonText}>Se connecter</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    startButton: {
        backgroundColor: 'rgba(206, 90, 75, 0.3)',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    startButtonText: {
        color: 'rgba(206, 90, 75, 1)',
        fontSize: 16,
        fontWeight: 'bold',
    },
    importButton: {
        borderStyle: 'solid',
        borderColor: 'rgba(206, 90, 75, 0.5)', // Jaune pour le bouton d'importation
        backgroundColor: 'rgba(206, 90, 75, 0.05)',
        borderWidth: 1,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginTop: 10,
    },
    importButtonText: {
        color: 'rgba(206, 90, 75, 1)',
        fontSize: 16,
        fontWeight: 'bold',
    },
    formContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        boxShadow: '-320 -22px 75px rgba(206, 90, 75, 1)',
        padding: 20,
    },
    closeButtonText: {
        fontSize: 24,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    formSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        borderStyle: 'solid',
        borderColor: 'rgba(206, 90, 75, 0.8)', // Jaune pour le bouton d'importation
        backgroundColor: 'rgba(206, 90, 75, 0.05)',
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        color: '#fff',
    },
    submitButton: {
        backgroundColor: 'rgba(206, 90, 75, 0.3)',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: 'rgba(206, 90, 75, 1)',
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
});