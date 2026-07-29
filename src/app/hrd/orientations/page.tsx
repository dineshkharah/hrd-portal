export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

export default function OrientationsPage() {
  redirect("/hrd/orientations/requests");
}
