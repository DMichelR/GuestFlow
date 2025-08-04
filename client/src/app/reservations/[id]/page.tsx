import ReservationDetail from "@/components/reservations/reservation-detail";

interface ReservationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReservationPage({
  params,
}: ReservationPageProps) {
  const { id } = await params;
  return <ReservationDetail reservationId={id} />;
}
