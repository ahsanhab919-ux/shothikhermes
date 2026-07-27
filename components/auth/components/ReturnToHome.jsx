"use client";
import { setShowLoginModal } from "@/redux/slices/auth";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

const ReturnToHome = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleNavigation = () => {
    router.push("/");
    dispatch(setShowLoginModal(true));
  };

  return (
    <button
      onClick={handleNavigation}
      className="mx-auto mt-6 inline-flex items-center text-sm font-medium"
    >
      <ChevronLeft className="h-4 w-4" />
      Return to home
    </button>
  );
};

export default ReturnToHome;
