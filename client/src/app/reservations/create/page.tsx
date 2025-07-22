import CreateReservationForm from "@/components/receptionist/create-reservation-form";
import { auth } from "@clerk/nextjs/server";

export default async function CreateReservationPage() {
  const session = await auth();

  const token = await session.getToken();

  if (!token) {
    return <div>Unauthorized</div>;
  }

  return <CreateReservationForm token={token} />;
}
