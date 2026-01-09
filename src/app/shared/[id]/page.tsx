"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Redirect to dashboard shared page
export default function SharedRedirect() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.id as string;

  useEffect(() => {
    router.replace(`/dashboard/shared/${shareId}`);
  }, [shareId, router]);

  return null;
}
