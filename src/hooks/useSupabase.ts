import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export type UseSupabaseHook = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  userId: string | null;
};

export function useSupabase(): UseSupabaseHook {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    // ფუნქცია სესიის მისაღებად
    async function getSession() {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          setUser(session.user);
          setUserId(session.user.id);
        } else {
          setUser(null);
          setUserId(null);
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    
    // საწყისი სესიის მიღება
    getSession();
    
    // შემდგომი ცვლილებების მოსმენა
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setUserId(session?.user?.id ?? null);
        setLoading(false);
      }
    );
    
    // გავასუფთაოთ subscription-ი კომპონენტის განადგურებისას
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // გამოსვლის ფუნქცია
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  return { user, loading, error, signOut, userId };
}