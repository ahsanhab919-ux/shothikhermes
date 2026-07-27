import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import DotFlashing from "@/components/common/DotFlashing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetUserQuery } from "@/redux/api/auth/authApi";
import {
  logout,
  setShowLoginModal,
  setShowRegisterModal,
} from "@/redux/slices/auth";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import CustomAvatar from "./Avater";

export default function UserInfo() {
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useGetUserQuery();
  const dispatch = useDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      dispatch(logout());
      router.replace("/");
    } catch (error) {
      console.error(error);
    }
  };

  // Show loading state only on client after mount to prevent hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="flex h-full justify-center px-2 py-5 text-center">
        <DotFlashing />
      </div>
    );
  }

  return (
    <div className="py-2 text-center">
      <div className="flex flex-col items-center">
        {user?.email ? (
          <>
            <div className="relative">
              {user?.image ? (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.image} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || ""}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <CustomAvatar name={user?.name} className="h-12 w-12" />
              )}
            </div>

            <div className="mt-1.5 mb-3 flex flex-col gap-0.5">
              <span className="font-medium break-words break-all">
                {user?.name}
              </span>

              <Badge className="bg-[#8E33FF] text-sm text-white capitalize">
                {user.package?.replace("_", " ")}
              </Badge>
            </div>

            {user.package !== "unlimited" && (
              <Button
                asChild
                className="-mt-2"
                variant="default"
                data-rybbit-event="clicked_upgrade_plan"
              >
                <Link href="/pricing">Upgrade plan</Link>
              </Button>
            )}
            <div
              onClick={handleLogout}
              className="bg-muted hover:bg-accent mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md leading-10 font-medium transition-colors"
            >
              Logout
              <LogOut className="h-6 w-6" />
            </div>
          </>
        ) : (
          <div className="flex w-full flex-col items-start gap-2 text-left">
            {/* <div className="flex flex-col gap-0.5">
              <span className="font-medium">Log In or Sign Up</span>
              <span className="text-sm">
                Unlock hidden features. Write with confidence.
              </span>
            </div> */}
            <div className="flex w-full flex-col gap-1.5">
              <Button
                // data-umami-event="Nav: Sign In"
                data-rybbit-event="Nav: Sign In"
                onClick={() => {
                  dispatch(setShowRegisterModal(false));
                  dispatch(setShowLoginModal(true));
                }}
                variant="default"
                className="w-full"
              >
                Sign In
              </Button>

              <Button
                data-umami-event="Nav: Sign Up"
                data-rybbit-event="Nav: Sign Up"
                onClick={() => {
                  dispatch(setShowLoginModal(false));
                  dispatch(setShowRegisterModal(true));
                }}
                variant="outline"
                className="w-full"
              >
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
