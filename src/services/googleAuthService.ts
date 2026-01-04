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
    console.log('[Google Auth] Starting Google Sign-In flow...');

    const clientId = getGoogleClientId();

    if (!clientId) {
      console.log('[Google Auth] No client ID configured - using demo mode');
      return {
        idToken: 'demo_id_token',
        accessToken: 'demo_access_token'
      };
    }

    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'athlead',
        path: 'redirect',
      });

      console.log('[Google Auth] Redirect URI:', redirectUri);
      console.log('[Google Auth] Client ID:', clientId.substring(0, 20) + '...');

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
        console.log('[Google Auth] Authorization successful');

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

        console.log('[Google Auth] Tokens obtained successfully');

        return { idToken, accessToken };
      } else if (result.type === 'cancel') {
        console.log('[Google Auth] User cancelled the sign-in flow');
        throw new Error('Google sign-in was cancelled');
      } else {
        console.error('[Google Auth] Sign-in failed:', result);
        throw new Error('Google sign-in failed');
      }
    } catch (error) {
      console.error('[Google Auth] Error during sign-in:', error);
      throw error;
    }
  },

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture: string;
  }> {
    if (accessToken === 'demo_access_token') {
      console.log('[Google Auth] Demo mode - returning mock user');
      return {
        id: `google_demo_${Date.now()}`,
        email: 'googleuser@demo.com',
        name: 'Google Demo User',
        picture: 'https://i.pravatar.cc/300?img=60',
      };
    }

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
      console.error('[Google Auth] Error fetching user info:', error);
      throw error;
    }
  },
};
