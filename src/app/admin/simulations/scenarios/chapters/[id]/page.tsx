import { ResourceWorkspace } from "@/features/admin/workbench/components/resource-workspace";
import styles from "@/features/admin/admin05/admin-simulation-pages.module.css";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className={styles.workspace}>
      <ResourceWorkspace kind="simulation-chapters" baseHref="/admin/simulations/scenarios/chapters" id={id} />
    </div>
  );
}
