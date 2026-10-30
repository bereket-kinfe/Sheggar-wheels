import WorkspacePage from "../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="create-review" title="Review a completed trip" kind="renter" pathId={id} />; }
