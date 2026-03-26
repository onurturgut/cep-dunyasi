import { Suspense } from "react";
import AdminReviewsScreen from "@/screens/admin/AdminReviews";

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReviewsScreen />
    </Suspense>
  );
}
