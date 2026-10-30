import WorkspacePage from "../../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="car-bookings" title="Bookings for this car" kind="owner" pathId={id} />; }
