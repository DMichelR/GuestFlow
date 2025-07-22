import ReservationDetail from "@/components/reservations/reservation-detail";

interface ReservationPageProps {
  params: {
    id: string;
  };
}

export default function ReservationPage({ params }: ReservationPageProps) {
  const { id } = params;
  return <ReservationDetail reservationId={id} />;
}
