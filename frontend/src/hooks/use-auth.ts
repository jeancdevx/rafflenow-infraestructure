import { useState, useEffect } from 'react';
import { getCurrentUser, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

interface User {
  userId: string;
  username: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
    error: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [user, session, attributes] = await Promise.all([
        getCurrentUser(),
        fetchAuthSession({ forceRefresh: false }),
        fetchUserAttributes(),
      ]);

      const token = session.tokens?.idToken?.toString() || null;

      if (!token) {
        throw new Error('No se pudo obtener el token');
      }

      if (!attributes.email) {
        throw new Error('Email no encontrado en atributos de usuario');
      }

      if (!attributes.given_name || !attributes.family_name) {
        throw new Error('Nombre completo no encontrado en atributos de usuario');
      }

      const fullName = `${attributes.given_name} ${attributes.family_name}`.trim();

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          userId: user.userId,
          username: user.username,
          email: attributes.email,
          name: fullName,
          givenName: attributes.given_name,
          familyName: attributes.family_name,
        },
        token,
        error: null,
      });
    } catch (error: any) {
      console.log('Auth check failed:', error.message);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: error.message || 'Error verificando autenticación',
      });
    }
  };

  const refreshAuth = () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));
    checkAuthStatus();
  };

  return {
    ...authState,
    refreshAuth,
  };
}
