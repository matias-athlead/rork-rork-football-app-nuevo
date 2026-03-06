import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '';
const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '';
const GOOGLE_CLIENT_ID_WEB = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '';

const getGoogleClientId = () => {
  if (Platform.OS === 'ios') return GOOGLE_CLIENT_ID_IOS;
  if (Platform.OS === 'android') return GOOGLE_CLIENT_ID_ANDROID;
  return GOOGLE_CLIENT_ID_WEB;
};

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const googleAuthService = {
  async signInWithGoogle(): Promise<{ idToken: string; accessToken: string }> {
    const clientId = getGoogleClientId();

    // Bug fix: avisar al usuario si no hay cliente ID configurado en lugar de entrar en modo demo silencioso
    if (!clientId) {
      throw new Error('Google Sign-In is not configured. Please contact support or use email/password to log in.');
    }

    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'athlead',
        path: 'redirect',
      });

      const authRequestConfig: AuthSession.AuthRequestConfig = {
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        usePKCE: true,
        responseType: AuthSession.ResponseType.Code,
      };

      const authRequest = new AuthSession.AuthRequest(authRequestConfig);
      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success') {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: authRequest.codeVerifier || '',
            },
          },
          discovery
        );

        const { idToken, accessToken } = tokenResponse;

        if (!idToken || !accessToken) {
          throw new Error('Failed to obtain tokens from Google');
        }

        return { idToken, accessToken };
      } else if (result.type === 'cancel') {
        throw new Error('Google sign-in was cancelled');
      } else {
        throw new Error('Google sign-in failed');
      }
    } catch (error) {
      throw error;
    }
  },

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture: string;
  }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userData = await response.json();

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
      };
    } catch (error) {
      throw error;
    }
  },
};
