import WorkspacePage from "../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="resolve-dispute" title="Resolve dispute" kind="admin" pathId={id} />; }
