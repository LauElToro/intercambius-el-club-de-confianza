import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User, RegisterData } from '@/services/auth.service';
import { ApiError } from '@/lib/api';
import { setAuthSessionInvalidHandler } from '@/lib/auth-session';

type RegisterPayload = RegisterData;
type GoogleRegisterPayload = {
  aceptaTerminos: boolean;
  codigoReferido?: string;
  ubicacion?: string;
  contacto?: string;
};

interface MfaPendingState {
  mfaToken: string;
  sentTo?: string;
  resendAvailableAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mfaPending: MfaPendingState | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  completeLoginWithMfa: (mfaToken: string, code: string) => Promise<void>;
  resendMfaCode: () => Promise<void>;
  clearMfaPending: () => void;
  register: (data: RegisterPayload) => Promise<void>;
  registerWithGoogle: (credential: string, data: GoogleRegisterPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState<MfaPendingState | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      if (authService.getToken()) {
        const fresh = await authService.refreshFromApi();
        setUser(fresh);
      } else {
        setUser(authService.getCurrentUser());
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  useEffect(() => {
    setAuthSessionInvalidHandler(() => {
      authService.logout();
      setUser(null);
      navigate('/login?sesion=expirada');
    });
    return () => setAuthSessionInvalidHandler(null);
  }, [navigate]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if ('mfaRequired' in response && response.mfaRequired) {
      setMfaPending({
        mfaToken: response.mfaToken,
        sentTo: response.mfaSentTo,
        resendAvailableAt: response.mfaResendAvailableAt,
      });
      return;
    }
    setUser(response.user);
    navigate('/dashboard');
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await authService.googleAuth({ credential, mode: 'login' });
    setMfaPending(null);
    setUser(response.user as User);
    navigate('/dashboard');
  };

  const completeLoginWithMfa = async (mfaToken: string, code: string) => {
    const response = await authService.verifyMfa(mfaToken, code);
    setMfaPending(null);
    setUser(response.user);
    navigate('/dashboard');
  };

  const resendMfaCode = async () => {
    if (!mfaPending?.mfaToken) return;
    try {
      const response = await authService.resendMfa(mfaPending.mfaToken);
      setMfaPending({
        mfaToken: response.mfaToken,
        sentTo: response.mfaSentTo,
        resendAvailableAt: response.mfaResendAvailableAt,
      });
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 429 &&
        typeof err.data?.mfaResendAvailableAt === 'string'
      ) {
        setMfaPending((prev) =>
          prev
            ? { ...prev, resendAvailableAt: err.data.mfaResendAvailableAt as string }
            : prev,
        );
      }
      throw err;
    }
  };

  const clearMfaPending = () => setMfaPending(null);

  const register = async (data: RegisterPayload) => {
    const result = await authService.register(data);
    if ('mfaRequired' in result && result.mfaRequired) {
      setMfaPending({
        mfaToken: result.mfaToken,
        sentTo: result.mfaSentTo,
        resendAvailableAt: result.mfaResendAvailableAt,
      });
      navigate('/login');
      return;
    }
    setUser(result as User);
    navigate('/dashboard');
  };

  const registerWithGoogle = async (credential: string, data: GoogleRegisterPayload) => {
    const response = await authService.googleAuth({
      credential,
      mode: 'register',
      ...data,
    });
    setMfaPending(null);
    setUser(response.user as User);
    navigate('/dashboard');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.refreshFromApi?.() ?? authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(authService.getCurrentUser());
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        mfaPending,
        login,
        loginWithGoogle,
        completeLoginWithMfa,
        resendMfaCode,
        clearMfaPending,
        register,
        registerWithGoogle,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
