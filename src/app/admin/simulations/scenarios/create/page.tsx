import { ResourceWorkspace } from "@/features/admin/workbench/components/resource-workspace";
import styles from "@/features/admin/admin05/admin-simulation-pages.module.css";

export default function Page() {
  return (
    <div className={styles.workspace}>
      <ResourceWorkspace kind="scenarios" baseHref="/admin/simulations/scenarios" id="create" />
    </div>
  );
}
