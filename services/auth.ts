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

    return {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || email.split('@')[0],
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

    return {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || email.split('@')[0],
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

        return {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        };
    } catch {
        return null;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}
