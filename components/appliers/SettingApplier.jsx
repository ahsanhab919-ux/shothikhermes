"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrateSettings } from "@/redux/slices/settings-slice";
import { hydrateAuth } from "@/redux/slices/auth";
import { useTranslation } from "@/i18n";

const SettingApplier = () => {
  const dispatch = useDispatch();
  const direction = useSelector((state) => state.settings.direction);
  const theme = useSelector((state) => state.settings.theme);
  const settingsHydrated = useSelector((state) => state.settings._hydrated);
  const authHydrated = useSelector((state) => state.auth._hydrated);
  const { locale } = useTranslation();

  useEffect(() => {
    if (!settingsHydrated) {
      dispatch(hydrateSettings());
    }
    if (!authHydrated) {
      dispatch(hydrateAuth());
    }
  }, [dispatch, settingsHydrated, authHydrated]);

  useEffect(() => {
    if (direction) {
      document.documentElement.setAttribute("dir", direction);
    }
  }, [direction]);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode) => {
      root.classList.remove("light", "dark");
      root.classList.add(mode);
    };

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(media.matches ? "dark" : "light");

      const listener = (e) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      media.addEventListener("change", listener);

      return () => media.removeEventListener("change", listener);
    } else {
      if (theme === "light" || theme === "dark") {
        applyTheme(theme);
      }
    }
  }, [theme]);

  useEffect(() => {
    if (locale) {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  return null;
};

export default SettingApplier;
