"use client";
import useGeolocation from "@/hooks/useGeolocation";
import { setShowLoginModal, setShowRegisterModal } from "@/redux/slices/auth";
import { useState } from "react";
import { useDispatch } from "react-redux";
import AuthRegisterForm from "./AuthRegisterForm";
import AuthWithSocial from "./AuthWithSocial";

// ----------------------------------------------------------------------

export default function RegisterContent() {
  const [loading, setLoading] = useState(false);
  const { location } = useGeolocation();
  const dispatch = useDispatch();

  return (
    <>
      <div className="bg-background mb-2 rounded-lg pb-4 sm:p-10 sm:pb-10">
        <AuthRegisterForm country={location} loading={loading} />
        <AuthWithSocial title="up" loading={loading} setLoading={setLoading} />
      </div>

      <div className="flex justify-center gap-1">
        <span className="text-muted-foreground text-sm leading-5">
          Already have an account?
        </span>

        <button
          onClick={() => {
            dispatch(setShowRegisterModal(false));
            dispatch(setShowLoginModal(true));
          }}
          className="text-primary cursor-pointer text-sm leading-5 font-semibold underline"
        >
          Sign In
        </button>
      </div>
    </>
  );
}
