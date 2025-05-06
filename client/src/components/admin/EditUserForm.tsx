"use client";
import { useState } from "react";
import { updateUser } from "../../app/admin/_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EditUserFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  onSave: (updatedUser: {
    firstName: string;
    lastName: string;
    email: string;
  }) => void;
}

export function EditUserForm({ user, onSave }: EditUserFormProps) {
  const [editedUser, setEditedUser] = useState(user);
  const [open, setOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("id", user.id);
    formData.append("firstName", editedUser.firstName);
    formData.append("lastName", editedUser.lastName);
    formData.append("email", editedUser.email);

    await updateUser(formData);
    onSave(editedUser);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={editedUser.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={editedUser.firstName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={editedUser.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <Button type="button" className="w-full" onClick={handleSave}>
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
