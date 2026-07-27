"use client";
import { setParaphraseValues } from "@/redux/slices/inputOutput";
import { setDemo } from "@/redux/slices/settings-slice.js";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import "./Onboarding.css";
export default function Onboarding() {
  const dispatch = useDispatch();
  const driverRef = useRef(null);
  const stepIndex = useRef(0);
  const DELAY = 300;
  const SIDEBAR_DELAY = 500; // Extra delay for sidebar close animation

  // Simple utility to wait for element to be properly positioned
  const waitForElementReady = (selector, timeout = 3000) => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = timeout / 50;

      const checkElement = () => {
        attempts++;
        const element = document.querySelector(selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if element has proper dimensions and position
          if (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top !== 0 &&
            rect.left !== 0
          ) {
            // Wait one more frame to ensure layout is stable
            requestAnimationFrame(() => {
              setTimeout(() => resolve(element), 50);
            });
            return;
          }
        }

        if (attempts < maxAttempts) {
          setTimeout(checkElement, 50);
        } else {
          // Fallback timeout
          resolve(document.querySelector(selector));
        }
      };
      checkElement();
    });
  };

  const steps = [
    {
      element: "#sample-paste-section",
      popover: {
        description: 'Paste text or use "Try Sample"',
        side: "top",
      },
      onNext: () => clickAndNext("mode_more"),
    },
    {
      element: "#mode_more_section",
      popover: {
        description: "Click More to access additional styles",
        side: "top",
      },
      onNext: () => {
        clickElByID("mode_x_button");
        setTimeout(() => clickAndNext("language_all_button"), DELAY);
      },
      onPrevious: () => {
        clickElByID("mode_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
    },
    {
      element: "#language_menu",
      popover: {
        description: "Choose from English, Bangla, Hindi…",
        side: "bottom",
      },
      onNext: () => clickAndNext("language_x_button"),
      onPrevious: () => {
        clickElByID("language_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
    },
    {
      element: "#paraphrase_settings",
      popover: {
        description: "Click the gear icon to open Settings",
        side: "bottom",
      },
      onNext: () => clickElByID("paraphrase_settings_button", true),
      onPrevious: () => {
        clickElByID("language_all_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
    },
    {
      element: "#settings_tab",
      popover: {
        description:
          "You can set 'Paraphrase Options' and 'Interface options' here",
        side: "top",
      },
      onNext: () => clickElByID("settings_sidebar_x_button", true),
      onPrevious: () => {
        clickElByID("settings_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
    },
    {
      element: "#paraphrase_feedback",
      popover: {
        description: "Click the Feedback icon",
        side: "bottom",
      },
      onNext: () => clickAndNext("paraphrase_feedback_button"),
      onPrevious: () => {
        clickElByID("paraphrase_settings_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
    },
    {
      element: "#feedback_tab",
      popover: {
        description: "Give service reviews or suggestions",
        side: "top",
      },
      onPrevious: () => {
        clickElByID("settings_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), SIDEBAR_DELAY);
      },
      // when Next is clicked here, close settings and move to the new shortcuts step
      onNext: () => clickAndNext("settings_sidebar_x_button"),
    },
    {
      element: "#paraphrase_shortcuts",
      popover: {
        description:
          "Click the Keyboard icon on the right to open Hotkeys panel",
        side: "right",
      },
      onPrevious: () => {
        clickElByID("paraphrase_feedback");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => clickAndNext("paraphrase_shortcuts_button"),
    },
    {
      element: "#shortcuts_tab",
      popover: {
        description: "Learn Keyboard shortcuts of shothik.ai",
        side: "top",
      },
      onPrevious: () => {
        clickElByID("settings_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), SIDEBAR_DELAY);
      },
      onNext: () => {
        clickAndNext("settings_sidebar_x_button");
      },
    },
    {
      element: "#paraphrase_history",
      popover: {
        description:
          "Click the History icon on the right to open Previous history.",
      },
      onPrevious: () => {
        clickElByID("plagiarism_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), SIDEBAR_DELAY);
      },
      onNext: () => {
        clickAndNext("paraphrase_history_button");
      },
    },
    {
      element: "#history_tab",
      popover: {
        description:
          "You can see previous history panel on the right, Click entries to revisit and reuse previous outputs.",
      },
      onPrevious: () => {
        clickElByID("plagiarism_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), SIDEBAR_DELAY);
      },
      onNext: () => {
        dispatch(setDemo(true));
        clickAndNext("plagiarism_sidebar_x_button");
      },
    },
    {
      element: "#paraphrase_plagiarism",
      popover: {
        description:
          "After paraphrasing, click the “Check Plagiarism” icon to analyze the text.",
      },
      onPrevious: () => {
        clickElByID("paraphrase_history_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        dispatch(setDemo("plagiarism_high"));
        clickAndNext("paraphrase_plagiarism_button");
      },
    },
    {
      element: "#plagiarism_score",
      popover: {
        description:
          "High Plagiarism (e.g., 100%) – Text is mostly unchanged from original sources",
      },
      onPrevious: () => {
        dispatch(setDemo(true));
        clickElByID("plagiarism_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), SIDEBAR_DELAY);
      },
      onNext: () => {
        dispatch(setDemo("plagiarism_low"));
        setTimeout(() => highlightStep(stepIndex.current + 1), DELAY);
      },
    },
    {
      element: "#plagiarism_score",
      popover: {
        description:
          "Low/No Plagiarism (e.g., 0%) – Paraphrasing was effective.",
      },
      onPrevious: () => {
        dispatch(setDemo("plagiarism_high"));
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        dispatch(setDemo(true));
        setTimeout(() => highlightStep(stepIndex.current + 1), DELAY);
      },
    },
    {
      element: "#plagiarism_results",
      popover: {
        description: "Each match can be expanded for preview or collapsed.",
      },
      onPrevious: () => {
        dispatch(setDemo("plagiarism_low"));
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        dispatch(setDemo("frozen"));
        clickElByID("plagiarism_sidebar_x_button");
        setTimeout(() => highlightStep(stepIndex.current + 1), DELAY);
      },
    },
    {
      element: "#frozen_demo_id",
      popover: {
        description:
          "Highlight a word and click the green Freeze button, Frozen words will remain unchanged in the output",
      },
      onPrevious: () => {
        dispatch(setDemo(true));
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        dispatch(setDemo("unfrozen"));
        setTimeout(() => highlightStep(stepIndex.current + 1), DELAY);
      },
    },
    {
      element: "#unfrozen_demo_id",
      popover: {
        description:
          "Highlight a word and click the green Unfreeze button to unfreeze frozen words",
      },
      onPrevious: () => {
        dispatch(setDemo("frozen"));
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        dispatch(setDemo(true));
        setTimeout(() => highlightStep(stepIndex.current + 1), DELAY);
      },
    },
    {
      element: "#multi_upload_button",
      popover: {
        description: "Click Multi Upload Document at the bottom.",
      },
      onPrevious: () => {
        dispatch(setDemo("unfrozen"));
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        clickAndNext("multi_upload_button");
      },
    },
    {
      element: "#multi_upload_view",
      popover: {
        description: "Drop or browse pdf, doc, txt, docx files.",
      },
      onPrevious: () => {
        clickElByID("multi_upload_close_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        clickAndNext("multi_upload_close_button");
      },
    },
    {
      element: "#file_history_view_button",
      popover: {
        description: "Click saved document icon to see your uploaded documents",
      },
      onPrevious: () => {
        dispatch(setDemo("frozen"));
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        clickAndNext("file_history_view_button");
      },
    },
    {
      element: "#file_history_view",
      popover: {
        description: "All of your Uploaded documents will stored here.",
      },
      onPrevious: () => {
        clickElByID("file_history_close_button");
        setTimeout(() => highlightStep(stepIndex.current - 1), DELAY);
      },
      onNext: () => {
        clickElByID("file_history_close_button");
      },
    },
  ];
  const reset = () => {
    clickElByID("settings_sidebar_x_button");
    clickElByID("language_x_button");
  };
  useEffect(() => {
    reset();
    driverRef.current = driver({
      popoverClass: "driverjs-theme",
      stagePadding: 4,
      smoothScroll: true,
      animation: true,
      animate: true, // ← enable built-in step animations :contentReference[oaicite:0]{index=0}
      allowClose: true,
      doneBtnText: "Done",
    });
    highlightStep(0); // start the tour
  }, []);

  function clickElByID(id, moveNext = false) {
    const el = document.getElementById(id);
    if (el) el.click();
    if (moveNext) {
      // give UI time to update
      setTimeout(() => highlightStep(stepIndex.current + 1), 300);
    }
  }

  function clickAndNext(id) {
    clickElByID(id);
    // extra delay before moving on
    setTimeout(() => highlightStep(stepIndex.current + 1), 300);
  }

  async function highlightStep(idx) {
    if (idx < 0 || idx > steps.length - 1) return;
    stepIndex.current = idx;
    const isLast = idx === steps.length - 1;
    const { element, popover, onNext, onPrevious } = steps[idx];

    // Wait for element to be properly positioned before highlighting
    await waitForElementReady(element);

    const btns = isLast
      ? ["previous", "close"] // show “Done” (close) on last step :contentReference[oaicite:3]{index=3}
      : ["previous", "next", "close"];

    driverRef.current.highlight({
      element,
      popover: {
        ...popover,
        showButtons: btns,
        // wire up the Next button:
        onNextClick: (el, step, opts) => {
          opts.driver.refresh();
          onNext && onNext(el, step, opts);
        },
        // wire up the Previous button:
        onPrevClick: (el, step, opts) => {
          opts.driver.refresh();
          // Check if this step has a custom onPrevious handler
          if (onPrevious) {
            onPrevious(el, step, opts);
          } else {
            // Default behavior: go to previous step with a small delay
            setTimeout(() => highlightStep(idx - 1), 150);
          }
        },
        // wire up the Close/Done button:
        onCloseClick: (el, step, opts) => {
          localStorage.setItem("onboarding", true);
          dispatch(setDemo(false));
          dispatch(
            setParaphraseValues({
              type: "input",
              values: "",
            }),
          );
          opts.driver.destroy();
        },
      },
    });
  }
  useEffect(() => {
    dispatch(setDemo(true));
    return () => {
      dispatch(setDemo(false));
      dispatch(
        setParaphraseValues({
          type: "input",
          values: "",
        }),
      );
    };
  }, []);
  return null;
}
