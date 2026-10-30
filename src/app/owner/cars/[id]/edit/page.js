import WorkspacePage from "../../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="edit-car" title="Edit listing" kind="owner" pathId={id} />; }
