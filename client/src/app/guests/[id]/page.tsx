"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Guest, getGuestById, deleteGuest } from "@/utils/guestService";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  Pencil,
  Trash,
  CheckCircle2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default function GuestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    const fetchGuest = async () => {
      if (!id) {
        setError("Guest ID not found");
        setLoading(false);
        return;
      }

      try {
        const data = await getGuestById(id);
        setGuest(data);
      } catch (err) {
        setError("Failed to load guest details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
  }, [id]);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleDeleteGuest = async () => {
    if (!id) return;

    try {
      await deleteGuest(id);
      setNotification({
        type: "success",
        message: "Guest deleted successfully",
      });
      // Redirect after a short delay to allow user to see the notification
      setTimeout(() => {
        router.push("/guests");
      }, 1500);
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to delete guest",
      });
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold text-destructive">Error</h2>
        <p>{error || "Guest not found"}</p>
        <Button asChild>
          <Link href="/guests">Back to Guests</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {notification.type && (
        <div
          className={`mb-4 p-4 rounded-md flex items-center ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          <p>{notification.message}</p>
        </div>
      )}

      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-2">
          <Link href="/guests">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Guests
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Guest Details</CardTitle>
          <CardDescription>
            View details about {guest.name} {guest.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-muted-foreground">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium">Full Name</p>
                  <p className="text-lg">
                    {guest.name} {guest.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">ID Number</p>
                  <p className="text-lg">{guest.cid}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Birthday</p>
                  <p className="text-lg">{formatDate(guest.birthday)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-muted-foreground">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-lg">{guest.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-lg">{guest.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-lg">{guest.address}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/guests/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Guest
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete Guest
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  guest record and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGuest}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
