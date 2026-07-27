"use client";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";

const SAMPLE_THESIS_INTRO = `<h1>Introduction</h1>
<p>Climate change represents one of the most pressing challenges facing humanity in the twenty-first century. The scientific consensus, supported by extensive empirical evidence, indicates that anthropogenic greenhouse gas emissions are the primary driver of observed global warming patterns.</p>

<h2>Research Background</h2>
<p>Previous studies have demonstrated significant correlations between industrial activity and atmospheric carbon dioxide concentrations. However, the mechanisms by which these emissions translate into localized climate impacts remain poorly understood in many regions.</p>

<h2>Research Objectives</h2>
<p>This thesis aims to investigate the relationship between urban development patterns and microclimate variations in tropical megacities. Specifically, this research will:</p>
<ol>
<li>Analyze historical temperature data from metropolitan weather stations</li>
<li>Examine the correlation between land use changes and urban heat island intensity</li>
<li>Develop predictive models for future climate scenarios under various development trajectories</li>
</ol>

<h2>Significance of the Study</h2>
<p>Understanding these dynamics is really important for urban planners and policymakers. The findings of this research will contribute to the development of evidence-based strategies for climate-resilient urban design.</p>`;

export default function WritingStudioOnboarding({ onComplete, onLoadSample }) {
  const driverRef = useRef(null);
  const stepIndex = useRef(0);

  const waitForElement = (selector, timeout = 3000) => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = timeout / 50;

      const check = () => {
        attempts++;
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            requestAnimationFrame(() => setTimeout(() => resolve(el), 50));
            return;
          }
        }
        if (attempts < maxAttempts) {
          setTimeout(check, 50);
        } else {
          resolve(document.querySelector(selector));
        }
      };
      check();
    });
  };

  const steps = [
    {
      element: "#writing-studio-editor",
      popover: {
        title: "Step 1: Write Your Content",
        description: "Start writing or paste your academic text here. Use the toolbar to format headings, lists, and more. We've loaded a sample thesis introduction for you to try!",
        side: "right",
      },
    },
    {
      element: "#writing-studio-ai-tools",
      popover: {
        title: "Step 2: AI-Powered Review",
        description: "Select any text and use these AI tools: Paraphrase for rewording, Humanize to bypass AI detectors, or Grammar Fix for clarity. Your changes appear inline with Accept/Reject buttons.",
        side: "left",
      },
    },
    {
      element: "#writing-studio-review-tab",
      popover: {
        title: "Review Your Writing",
        description: "Switch to the Review tab to see readability scores, academic tone analysis, word choice suggestions, and run AI detection scans.",
        side: "left",
      },
    },
    {
      element: "#writing-studio-citations-tab",
      popover: {
        title: "Step 3: Add Citations",
        description: "Search CrossRef and Open Library for academic sources. Format citations in APA, MLA, or Chicago style and build your reference list.",
        side: "left",
      },
    },
    {
      element: "#writing-studio-export",
      popover: {
        title: "Export with References",
        description: "Export your finished document as Word (.docx), HTML, or plain text. Your saved references are automatically appended as a bibliography!",
        side: "bottom",
      },
    },
  ];

  const highlightStep = async (idx) => {
    if (idx < 0 || idx >= steps.length) return;
    stepIndex.current = idx;
    const { element, popover } = steps[idx];
    const isLast = idx === steps.length - 1;

    await waitForElement(element);

    driverRef.current.highlight({
      element,
      popover: {
        ...popover,
        showButtons: ["previous", isLast ? "close" : "next"],
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Get Started!",
        onNextClick: () => {
          driverRef.current.refresh();
          setTimeout(() => highlightStep(idx + 1), 150);
        },
        onPrevClick: () => {
          driverRef.current.refresh();
          setTimeout(() => highlightStep(idx - 1), 150);
        },
        onCloseClick: () => {
          localStorage.setItem("writing-studio-onboarding", "completed");
          driverRef.current.destroy();
          onComplete?.();
        },
      },
    });
  };

  useEffect(() => {
    onLoadSample?.(SAMPLE_THESIS_INTRO);
    
    driverRef.current = driver({
      popoverClass: "driverjs-theme",
      stagePadding: 8,
      smoothScroll: true,
      allowClose: true,
      doneBtnText: "Get Started!",
      overlayColor: "rgba(0, 0, 0, 0.7)",
    });

    setTimeout(() => highlightStep(0), 500);

    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return null;
}

export { SAMPLE_THESIS_INTRO };
