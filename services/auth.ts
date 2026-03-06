import { supabase } from './supabase';
import { User } from '../types';

export async function login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.user) {
        throw new Error('Login failed. Please try again.');
    }

    // Fetch extended profile data including preferred_language
    const { data: profile } = await supabase
        .from('profiles')
        .select('name, preferred_language')
        .eq('id', data.user.id)
        .single();

    return {
        id: data.user.id,
        email: data.user.email || email,
        name: profile?.name || data.user.user_metadata?.name || email.split('@')[0],
        preferredLanguage: profile?.preferred_language,
    };
}

export async function signup(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
            data: {
                name: email.split('@')[0],
            },
        },
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data.user) {
        throw new Error('Signup failed. Please try again.');
    }

    // New users get the default en-IN language set by the DB trigger/schema
    return {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        preferredLanguage: 'en-IN',
    };
}

export async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
    }
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('name, preferred_language')
            .eq('id', session.user.id)
            .single();

        return {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            preferredLanguage: profile?.preferred_language,
        };
    } catch {
        return null;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}
