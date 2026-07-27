"use client";

import { useGetTokenQuery } from "@/redux/api/auth/authApi";
import { updateUser } from "@/redux/slices/auth";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const PaymentSuccessAndUpdateUser = () => {
  const { accessToken } = useSelector((state) => state.auth);
  const { data } = useGetTokenQuery({ skip: !accessToken });
  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      dispatch(updateUser(data));
    }
  }, [data, dispatch]);

  return null;
};

export default PaymentSuccessAndUpdateUser;
