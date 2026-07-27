"use client";

import React from "react";

export const ThemeScript = () => {
    const scriptContent = `
    (function () {
      try {
        var raw = localStorage.getItem('settings');
        var s = raw ? JSON.parse(raw) : null;
        var root = document.documentElement;

        // ---- Theme ----
        var theme = s && s.theme ? s.theme : 'system';
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var mode =
          theme === 'dark'
            ? 'dark'
            : theme === 'light'
            ? 'light'
            : prefersDark
            ? 'dark'
            : 'light';
            
        if (root.classList) {
          root.classList.remove('light', 'dark');
          root.classList.add(mode);
        } else {
          root.setAttribute('class', mode);
        }

        // ---- Direction ----
        var dir = s && s.direction ? s.direction : 'ltr';
        root.setAttribute('dir', dir);

        // ---- Language ----
        var lang = s && s.language ? s.language : 'en';
        root.setAttribute('lang', lang);

        // ---- Layout ----
        var layout = s && s.layout ? s.layout : 'vertical';
        root.setAttribute('data-layout', layout);

        // ---- Sidebar ----
        var sidebar = s && s.sidebar ? s.sidebar : 'expanded';
        root.setAttribute('data-sidebar', sidebar);

        // ---- Header ----
        var header = s && s.header ? s.header : 'expanded';
        root.setAttribute('data-header', header);

      } catch (e) {
        // Fallback to default if JSON parse fails
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
      }
    })();
  `;

    return (
        <script
            id="theme-script"
            dangerouslySetInnerHTML={{
                __html: scriptContent,
            }}
        />
    );
};
