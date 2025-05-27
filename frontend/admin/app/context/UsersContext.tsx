// src/contexts/UserContext.jsx
import React from 'react';

const UserContext = React.createContext();

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // Fetch user data once when app starts
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:8080/api/users');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for easier use
export function useUser() {
  return React.useContext(UserContext);
}
