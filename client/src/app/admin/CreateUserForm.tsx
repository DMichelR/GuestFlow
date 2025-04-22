// src/app/admin/CreateUserForm.tsx
'use client'

import { useState } from "react"
import { createUser } from "./_actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
//import { useToast } from "@/components/ui/use-toast"

interface CreateUserFormProps {
    tenantId: string;
}

export const CreateUserForm = ({ tenantId }: CreateUserFormProps) => {
    const [open, setOpen] = useState(false)
    const [role, setRole] = useState("staff")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    // const { toast } = useToast() // Uncomment if you have toast component

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        setError(null)
        try {
            formData.append("role", role);
            formData.append("tenantId", tenantId);
            const result = await createUser(formData);

            if (result.success) {
                setOpen(false);
                // toast({ title: "User created successfully" }) // Uncomment if you have toast
            } else {
                setError(result.error || "Failed to create user");
            }
        } catch (err) {
            console.error("Form submission error:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary">Create New User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form
                    action={handleSubmit}
                    className="space-y-4"
                >
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input id="firstName" name="firstName" required />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input id="lastName" name="lastName" required />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                        <p className="text-xs text-gray-500">Password must be strong and not found in any data breaches</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={role}
                            onValueChange={setRole}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create User"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
