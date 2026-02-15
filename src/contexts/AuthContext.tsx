import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mfaPending: { mfaToken: string } | null;
  login: (email: string, password: string) => Promise<void>;
  completeLoginWithMfa: (mfaToken: string, code: string) => Promise<void>;
  clearMfaPending: () => void;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState<{ mfaToken: string } | null>(null);
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

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if ('mfaRequired' in response && response.mfaRequired) {
      setMfaPending({ mfaToken: response.mfaToken });
      return;
    }
    setUser(response.user);
    navigate('/dashboard');
  };

  const completeLoginWithMfa = async (mfaToken: string, code: string) => {
    const response = await authService.verifyMfa(mfaToken, code);
    setMfaPending(null);
    setUser(response.user);
    navigate('/dashboard');
  };

  const clearMfaPending = () => setMfaPending(null);

  const register = async (data: any) => {
    const result = await authService.register(data);
    if ('mfaRequired' in result && result.mfaRequired) {
      setMfaPending({ mfaToken: result.mfaToken });
      navigate('/login');
      return;
    }
    setUser(result as User);
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
        completeLoginWithMfa,
        clearMfaPending,
        register,
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
