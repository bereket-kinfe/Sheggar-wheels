import WorkspacePage from "../../../../components/WorkspacePage";

export const instant = false;

export default async function Page({ params }) { const { id } = await params; return <WorkspacePage section="user-detail" title="Demo user details" kind="admin" pathId={id} />; }
