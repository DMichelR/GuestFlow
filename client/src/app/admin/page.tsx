// src/app/admin/page.tsx
import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { SearchUsers } from './SearchUsers'
import { CreateUserForm } from './CreateUserForm'
import { clerkClient } from '@clerk/nextjs/server'
import { setRole } from './_actions'
import { getCurrentUserWithTenant } from '@/lib/user'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard(params: {
    searchParams: Promise<{ search?: string }>
}) {
    if (!await checkRole('manager')) {
        redirect('/')
    }

    const query = (await params.searchParams).search
    const currentUserData = await getCurrentUserWithTenant();
    
    if (!currentUserData || !currentUserData.tenantID) {
        redirect('/');
    }
    
    const client = await clerkClient()
    const allUsers = query ?
        (await client.users.getUserList({ query })).data :
        (await client.users.getUserList()).data;

    // Filter users by tenantId
    const users = allUsers.filter(user =>
        user.publicMetadata.tenantId === currentUserData.tenantID ||
        user.publicMetadata.tenantID === currentUserData.tenantID
    );

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="flex justify-between items-center mb-6">
                <SearchUsers />
                <CreateUserForm tenantId={currentUserData.tenantID} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                        <CardHeader className="bg-muted">
                            <CardTitle>
                                {user.firstName} {user.lastName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-sm mb-2">
                                Email: {user.emailAddresses.find(
                                (email) => email.id === user.primaryEmailAddressId
                            )?.emailAddress}
                            </p>
                            <p className="text-sm mb-4">
                                Role: <span className="font-medium">{user.publicMetadata.role as string || 'No role'}</span>
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <form action={setRole}>
                                    <input type="hidden" value={user.id} name="id" />
                                    <input type="hidden" value="manager" name="role" />
                                    <Button type="submit" variant="outline" size="sm" className="w-full">
                                        Make Manager
                                    </Button>
                                </form>

                                <form action={setRole}>
                                    <input type="hidden" value={user.id} name="id" />
                                    <input type="hidden" value="receptionist" name="role" />
                                    <Button type="submit" variant="outline" size="sm" className="w-full">
                                        Make Receptionist
                                    </Button>
                                </form>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <form action={setRole}>
                                    <input type="hidden" value={user.id} name="id" />
                                    <input type="hidden" value="staff" name="role" />
                                    <Button type="submit" variant="outline" size="sm" className="w-full">
                                        Make Staff
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
