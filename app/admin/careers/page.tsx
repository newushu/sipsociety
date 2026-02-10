import CareersAdminClient from "@/components/admin/CareersAdminClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function CareersAdminPage() {
  return <CareersAdminClient />;
}
