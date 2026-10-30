import WorkspacePage from "../../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="availability" title="Manage availability" kind="owner" pathId={id} />; }
