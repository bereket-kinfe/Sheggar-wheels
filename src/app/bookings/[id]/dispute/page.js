import WorkspacePage from "../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="create-dispute" title="Raise an issue" kind="participant" pathId={id} />; }
