"use client";

import { useEffect } from "react";
import {
  useGetUserLimitQuery,
  useGetUserQuery,
} from "@/redux/api/auth/authApi";
import { hydrateAuth } from "@/redux/slices/auth";
import { useDispatch, useSelector } from "react-redux";

const AuthApplier = () => {
  const dispatch = useDispatch();
  const { accessToken, _hydrated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!_hydrated) {
      dispatch(hydrateAuth());
    }
  }, [dispatch, _hydrated]);

  useGetUserQuery(undefined, {
    skip: !accessToken,
  });
  useGetUserLimitQuery();

  return null;
};

export default AuthApplier;
