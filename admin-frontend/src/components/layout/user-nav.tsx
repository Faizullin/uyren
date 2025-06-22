'use client';

import { UserAvatarProfile } from '@/components/common/user-avatart-profile';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
export function UserNav() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const userData = useMemo(() => {
        if (!user) {
            return null;
        }
        return {
            fullName: user.username,
            imageUrl: user.profile_picture_url || '',
            emailAddresses: [{
                emailAddress: user.email,
            }]
        };
    }, [user]);
    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                        <UserAvatarProfile user={userData} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className='w-56'
                    align='end'
                    sideOffset={10}
                    forceMount
                >
                    <DropdownMenuLabel className='font-normal'>
                        <div className='flex flex-col space-y-1'>
                            <p className='text-sm leading-none font-medium'>
                                {userData?.fullName}
                            </p>
                            <p className='text-muted-foreground text-xs leading-none'>
                                {userData?.emailAddresses[0].emailAddress}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>New Team</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
}