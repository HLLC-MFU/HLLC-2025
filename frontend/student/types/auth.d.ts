type AuthContextType = {
    user: User | null;
    loading: boolean;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
  };
  