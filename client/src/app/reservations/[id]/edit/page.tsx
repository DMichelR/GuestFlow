import EditReservationForm from "@/components/receptionist/edit-reservation-form";
import { auth } from "@clerk/nextjs/server";

interface EditReservationPageProps {
  params: {
    id: string;
  };
}

export default async function EditReservationPage({
  params,
}: EditReservationPageProps) {
  const { id } = await params;
  const session = await auth();

  const token = await session.getToken();

  if (!token) {
    return <div>Unauthorized</div>;
  }

  return <EditReservationForm token={token} reservationId={id} />;
}
