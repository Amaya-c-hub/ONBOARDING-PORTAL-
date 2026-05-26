import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear authentication tokens
    localStorage.removeItem("auth_token");
    localStorage.removeItem("hr_auth");
    // Redirect to home or login page
    router.replace("/auth/login");
  }, [router]);

  return null;
}
