// UserContext.tsx
import { useEffect, useState, createContext, useContext } from 'react';

export interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    level: number;
    points: number;
}

interface UserContextType {
    user: User | null | undefined;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
    user: undefined,
    setUser: () => {},
    isLoading: true,
    refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        try {
      

            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.log("❌ No auth token found");
                setUser(null);
                setIsLoading(false);
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (res.ok) {
                const data = await res.json();
                console.log("✅ User authenticated:", data);
                // Ensure is_admin is properly set from the API response
                const userData = {
                    ...data,
                    is_admin: Boolean(data.is_admin),
                    level: data.level || 1,
                    points: data.points || 0
                };
                setUser(userData);
                localStorage.setItem('auth_user', JSON.stringify(userData));
                return userData;
            } else {
                console.log("User not authenticated");
                setUser(null);
                localStorage.removeItem('auth_user');
                return null;
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setUser(null);
            localStorage.removeItem('auth_user');
            return null;
        }
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    useEffect(() => {
        // Check for cached user data first
        const cachedUser = localStorage.getItem('auth_user');
        if (cachedUser && cachedUser !== 'undefined' && cachedUser !== 'null') {
            try {
                const parsedUser = JSON.parse(cachedUser);
                // Ensure level and points exist with default values
                const userData = {
                    ...parsedUser,
                    level: parsedUser.level || 1,
                    points: parsedUser.points || 0
                };
                setUser(userData);
            } catch (error) {
                console.error("Error parsing cached user:", error);
                localStorage.removeItem('auth_user');
            }
        }

        const initializeUser = async () => {
            await fetchUser();
            setIsLoading(false);
        };

        initializeUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};