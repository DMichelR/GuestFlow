// src/app/admin/SearchUsers.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const SearchUsers = () => {
    const router = useRouter()
    const pathname = usePathname()

    return (
        <div>
            <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                    e.preventDefault()
                    const form = e.currentTarget
                    const formData = new FormData(form)
                    const queryTerm = formData.get('search') as string
                    router.push(pathname + '?search=' + queryTerm)
                }}
            >
                <div className="grid gap-1.5">
                    <Label htmlFor="search">Search users</Label>
                    <Input id="search" name="search" type="text" className="w-64" />
                </div>
                <Button type="submit">Search</Button>
            </form>
        </div>
    )
}
