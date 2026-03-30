"use client";

import { useEffect } from "react";
import { useNavigate } from "@/lib/router";

export default function Account() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/account/profile", { replace: true });
  }, [navigate]);

  return null;
}
