"use client";

import { Button, buttonVariants } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { TbBrandGoogle } from 'react-icons/tb';
import { z } from 'zod';

const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function SignInViewPage() {
    const router = useRouter();
    const { login, signInWithGoogle } = useAuth();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onSubmit',
    });

    const signInWithEmailPasswordMutation = useMutation({
        mutationFn: login,
        onSuccess: () => {
            router.push('/dashboard/overview');
        },
        onError: (error) => {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case 'auth/user-not-found':
                        form.setError('email', { type: 'manual', message: 'User not found' });
                        break;
                    case 'auth/wrong-password':
                        form.setError('password', { type: 'manual', message: 'Incorrect password' });
                        break;
                    case "auth/invalid-credential":
                        form.setError('root', { type: 'manual', message: 'Invalid credentials' });
                        break;
                    default:
                        form.setError('root', { type: 'manual', message: error.message });
                        break;
                }
            } else {
                form.setError('root', { type: 'manual', message: 'An unexpected error occurred' });
            }
        },
    });

    const signInWithGoogleMutation = useMutation({
        mutationFn: signInWithGoogle,
        onSuccess: () => {
            router.push('/dashboard/overview');
        },
        onError: (error) => {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case 'auth/popup-closed-by-user':
                        form.setError('root', { type: 'manual', message: 'Popup closed by user' });
                        break;
                    case 'auth/cancelled-popup-request':
                        form.setError('root', { type: 'manual', message: 'Popup request cancelled' });
                        break;
                    default:
                        form.setError('root', { type: 'manual', message: error.message });
                        break;
                }
            } else {
                form.setError('root', { type: 'manual', message: 'An unexpected error occurred' });
            }
        },
    });

    const handleSignInWithGoogle = useCallback(() => {
        signInWithGoogleMutation.mutate();
    }, [signInWithGoogleMutation.mutate]);

    const onSubmit = form.handleSubmit(async (values) => {
        signInWithEmailPasswordMutation.mutate(values);
    });

    return (
        <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
            <Link
                href='/examples/authentication'
                className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'absolute top-4 right-4 hidden md:top-8 md:right-8'
                )}
            >
                Login
            </Link>
            <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
                <div className='absolute inset-0 bg-zinc-900' />
                <div className='relative z-20 flex items-center text-lg font-medium'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        className='mr-2 h-6 w-6'
                    >
                        <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
                    </svg>
                    Logo
                </div>
                <div className='relative z-20 mt-auto'>
                    <blockquote className='space-y-2'>
                        <p className='text-lg'>
                            &ldquo;This starter template has saved me countless hours of work
                            and helped me deliver projects to my clients faster than ever
                            before.&rdquo;
                        </p>
                        <footer className='text-sm'>Random Dude</footer>
                    </blockquote>
                </div>
            </div>
            <div className='flex h-full items-center justify-center p-4 lg:p-8'>
                <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
                    <Form {...form}>
                        <form onSubmit={onSubmit} className="space-y-4 w-full">
                            {form.formState.errors.root && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                                    {form.formState.errors.root.message}
                                </div>
                            )}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="you@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Password" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={signInWithEmailPasswordMutation.isPending}
                            >
                                {signInWithEmailPasswordMutation.isPending ? 'Signing In...' : 'Sign In'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center gap-2"
                                onClick={handleSignInWithGoogle}
                                disabled={signInWithGoogleMutation.isPending}
                            >
                                <TbBrandGoogle className="size-5" />
                                {signInWithGoogleMutation.isPending ? 'Signing In...' : 'Sign in with Google'}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}