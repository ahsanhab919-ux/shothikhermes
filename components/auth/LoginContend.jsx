"use client";
import { setShowLoginModal, setShowRegisterModal } from "@/redux/slices/auth";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthLoginForm from "./AuthLoginForm";
import AuthWithSocial from "./AuthWithSocial";
import ForgetPasswordModal from "./ForgetPasswordModal";

const LoginContend = () => {
  const [loading, setLoading] = useState(false);
  const { showForgotPasswordModal } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <>
      <div className="bg-background mb-2 rounded-lg p-0 sm:p-10">
        <AuthLoginForm loading={loading} setLoading={setLoading} />
        <AuthWithSocial loading={loading} setLoading={setLoading} />
      </div>

      <div className="flex justify-center gap-1">
        <span className="text-muted-foreground text-sm leading-5">
          Don&apos;t have an account?
        </span>

        <button
          onClick={() => {
            dispatch(setShowLoginModal(false));
            dispatch(setShowRegisterModal(true));
          }}
          className="text-primary cursor-pointer text-sm leading-5 font-semibold underline"
        >
          Sign Up
        </button>
      </div>
      {showForgotPasswordModal && <ForgetPasswordModal />}
    </>
  );
};

export default LoginContend;
