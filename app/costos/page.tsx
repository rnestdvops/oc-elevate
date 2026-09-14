import { redirect } from "next/navigation";
import { mesActual } from "@/lib/mes";

export default function CostosPage() {
  redirect(`/costos/${mesActual()}`);
}
