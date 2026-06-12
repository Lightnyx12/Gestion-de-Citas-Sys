import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

export type UserRole = "patient" | "doctor" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null
  setUser: (user: User) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Inicializar desde Supabase session real
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Obtener el rol desde la tabla usuarios
          const { data: userData } = await supabase
            .from('usuarios')
            .select('user_role, full_name')
            .eq('id', session.user.id)
            .single()

          if (userData) {
            const role = userData.user_role as UserRole
            const appUser: User = {
              id: session.user.id,
              name: userData.full_name || session.user.email || '',
              email: session.user.email || '',
              role,
            }
            setUserState(appUser)
            localStorage.setItem('user', JSON.stringify(appUser))
          }
        } else {
          // No hay sesión activa en Supabase, limpiar localStorage
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              setUserState(JSON.parse(storedUser))
            } catch {
              localStorage.removeItem('user')
            }
          }
        }
      } catch {
        // Fallback a localStorage si falla la consulta
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            setUserState(JSON.parse(storedUser))
          } catch {
            localStorage.removeItem('user')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    initSession()

    // Escuchar cambios de autenticación de Supabase (cierre de sesión, expiración de token, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user')
        setUserState(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Guardar usuario en contexto y localStorage
  const setUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setUserState(user);
  };

  // Cerrar sesión limpiando tanto Supabase como el contexto local
  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe estar dentro de AuthProvider');
  }

  return context;
}