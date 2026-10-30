import WorkspacePage from "../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="booking-detail" title="Booking details and receipt" kind="renter" pathId={id} />; }
