import WorkspacePage from "../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="track" title="Trip tracking simulation" kind="renter" pathId={id} />; }
