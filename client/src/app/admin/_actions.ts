// src/app/admin/_actions.ts
'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function setRole(formData: FormData): Promise<void> {
    const client = await clerkClient()
    
    if (!await checkRole('manager')) {
        throw new Error('Not Authorized');
    }

    try {
        await client.users.updateUserMetadata(formData.get('id') as string, {
            publicMetadata: { role: formData.get('role') },
        });
        revalidatePath('/admin');
    } catch (err) {
        console.error('Error setting role:', err);
    }
}

export async function removeRole(formData: FormData): Promise<void> {
    const client = await clerkClient()

    try {
        await client.users.updateUserMetadata(formData.get('id') as string, {
            publicMetadata: { role: null },
        });
        revalidatePath('/admin');
    } catch (err) {
        console.error('Error removing role:', err);
    }
}
export async function createUser(formData: FormData): Promise<{success: boolean, error?: string}> {
    const client = await clerkClient()

    if (!await checkRole('manager')) {
        throw new Error('Not Authorized');
    }

    try {
        const email = formData.get('email') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const role = formData.get('role') as string;
        const tenantId = formData.get('tenantId') as string;

        console.log('Creating user with:', { email, firstName, lastName, role, tenantId });

        await client.users.createUser({
            emailAddress: [email],
            firstName,
            lastName,
            password: formData.get('password') as string,
            publicMetadata: {
                role,
                tenantId
            }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (err: unknown) {
        console.error('Error creating user:', err);
        
        if (err && typeof err === 'object' && 'status' in err && 'errors' in err) {
            const errorObj = err as {
                status: number;
                errors: Array<{ longMessage?: string; message?: string }>
            };

            if (errorObj.status === 422 && Array.isArray(errorObj.errors)) {
                const errorMessages = errorObj.errors
                    .map(e => e.longMessage || e.message || '')
                    .filter(msg => msg)
                    .join('. ');

                return {
                    success: false,
                    error: errorMessages
                };
            }
        }

        return {
            success: false,
            error: "Error creating user. Please try again."
        };
    }
}
