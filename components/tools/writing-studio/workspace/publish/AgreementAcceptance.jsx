"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileCheck,
  CheckCircle2,
  Shield,
  BookOpen,
  DollarSign,
  AlertTriangle,
  Scale,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const AGREEMENT_VERSION = "1.0";

const AGREEMENT_SECTIONS = [
  {
    title: "1. Grant of License",
    content: `Author grants Shothik AI Ltd ("Publisher"), a company registered in the United Kingdom, a non-exclusive, worldwide license to publish, distribute, and market the Work in digital formats (ebook, PDF, EPUB) through Google Play Books and other authorized distribution channels selected by the Publisher.

This license is non-exclusive — Author retains all copyrights and may publish the same Work through other publishers or platforms simultaneously.`,
  },
  {
    title: "2. Territory & Distribution",
    content: `The Work will be made available for worldwide digital distribution through Google Play Books and any additional distribution channels selected by the Author. The Publisher will manage all store submissions, metadata, and compliance requirements on behalf of the Author.`,
  },
  {
    title: "3. Commission & Royalties",
    content: `The Publisher retains 15% of net revenue received from distribution stores as a publishing commission. The Author receives 85% of net revenue as royalties.

"Net revenue" means the amount actually received by the Publisher from the distribution store after the store's own commission (e.g., Google Play Books retains 30% of the list price).

Example: For a $9.99 book on Google Play Books:
- Google keeps 30% ($3.00)
- Net revenue to Publisher: $6.99 (70%)
- Publisher commission (15% of $6.99): $1.05
- Author royalty (85% of $6.99): $5.94

A 10% reserve holdback is applied for 60 days to cover potential returns and chargebacks. Reserved amounts are released automatically after the holdback period.`,
  },
  {
    title: "4. Payment Terms",
    content: `Royalties are calculated monthly based on sales reports received from distribution stores. Payments are processed within 30 days after the close of each reporting period, subject to:

- Minimum payout threshold: varies by payment method (typically $20-$50 USD)
- Supported payment methods: Payoneer, Stripe, Wise (availability varies by country)
- Currency: Royalties are calculated in USD and converted to the Author's local currency at the prevailing exchange rate at the time of payout

The Publisher will provide monthly royalty statements detailing sales, commission, reserves, and payouts.`,
  },
  {
    title: "5. Author Warranties & Representations",
    content: `The Author warrants and represents that:

a) The Work is original and created by the Author
b) The Work does not infringe any copyright, trademark, or other intellectual property rights of any third party
c) The Work does not contain defamatory, obscene, or illegal content
d) The Author has full authority to grant the rights in this Agreement
e) The Work has not been previously published under an exclusive license that conflicts with this Agreement
f) All citations, references, and quoted material are properly attributed
g) The Author will comply with all applicable laws in their jurisdiction`,
  },
  {
    title: "6. Content Review & Standards",
    content: `The Publisher reserves the right to review all submitted Works for compliance with:

a) Google Play Books content policies
b) Publisher's quality standards (minimum word count, formatting, cover requirements)
c) Legal requirements (copyright, defamation, prohibited content)

The Publisher may reject a Work that does not meet these standards. Rejected Works may be revised and resubmitted. The Publisher may remove a published Work at any time if it is found to violate content policies or receives valid legal complaints.`,
  },
  {
    title: "7. Indemnification",
    content: `The Author agrees to indemnify and hold harmless the Publisher, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:

a) Breach of the Author's warranties
b) Copyright or intellectual property infringement claims related to the Work
c) Defamation or privacy claims related to the Work
d) Any third-party claims related to the content of the Work`,
  },
  {
    title: "8. ISBN & Publisher Imprint",
    content: `The Publisher will assign an ISBN from its registered pool to each published Work. ISBNs remain the property of Shothik AI Ltd and may not be transferred to another publisher. The Work will be published under the Shothik AI Publishing imprint.`,
  },
  {
    title: "9. Term & Termination",
    content: `This Agreement begins on the date of acceptance and continues for an initial term of one (1) year, automatically renewing for successive one-year terms unless either party provides thirty (30) days written notice of non-renewal.

Either party may terminate this Agreement at any time with thirty (30) days written notice. Upon termination:

a) The Work will be removed from all distribution channels within 30 days
b) All earned and unpaid royalties will be paid within 60 days of termination
c) The Author's ISBN assignment will be retired (ISBN cannot be reused)
d) The Publisher will retain records for legal and tax compliance purposes`,
  },
  {
    title: "10. Governing Law",
    content: `This Agreement is governed by the laws of England and Wales. Any disputes arising from this Agreement shall be resolved through good-faith negotiation, and if necessary, through the courts of England and Wales.`,
  },
];

export function AgreementAcceptance({ formData, updateFormData }) {
  const scrollContainerRef = useRef(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(formData.agreementScrolled || false);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (scrollBottom < 50) {
      setHasScrolledToBottom(true);
      updateFormData({ agreementScrolled: true });
    }
  }, [updateFormData]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const keyTerms = [
    { icon: BookOpen, label: "Non-exclusive license", desc: "Publish elsewhere too" },
    { icon: DollarSign, label: "85% royalty", desc: "15% publisher commission" },
    { icon: Shield, label: "Monthly payouts", desc: "Minimum threshold applies" },
    { icon: Scale, label: "30-day termination", desc: "Either party, any time" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Publishing Agreement
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Please read the full agreement before accepting. Scroll to the bottom to enable the acceptance checkbox.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {keyTerms.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center"
          >
            <Icon className="h-5 w-5 text-brand mx-auto mb-1.5" />
            <p className="text-xs font-bold text-zinc-900 dark:text-white">{label}</p>
            <p className="text-[10px] text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold">Shothik AI Publishing Agreement</h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">v{AGREEMENT_VERSION}</span>
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-[400px] overflow-y-auto p-6 custom-scrollbar"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-xs text-zinc-500 mb-6">
              This Publishing Agreement (&quot;Agreement&quot;) is entered into between the Author (&quot;Author&quot;)
              and Shothik AI Ltd, a company registered in the United Kingdom (&quot;Publisher&quot;).
            </p>

            {AGREEMENT_SECTIONS.map((section) => (
              <div key={section.title} className="mb-6">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                  {section.title}
                </h4>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!hasScrolledToBottom && (
          <div className="bg-amber-50 dark:bg-amber-900/10 px-6 py-3 border-t border-amber-200 dark:border-amber-800/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Please scroll to the bottom to read the full agreement before accepting.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
        <label
          className={cn(
            "flex items-start gap-3 cursor-pointer group",
            !hasScrolledToBottom && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="checkbox"
            checked={formData.agreementAccepted}
            onChange={(e) => updateFormData({ agreementAccepted: e.target.checked })}
            disabled={!hasScrolledToBottom}
            className="mt-1 size-5 rounded border-zinc-300 text-brand focus:ring-brand accent-brand"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            I have read and agree to the{" "}
            <span className="font-bold text-brand">Shothik AI Publishing Agreement</span>{" "}
            (Version {AGREEMENT_VERSION}). I understand the commission structure, payment terms, and my obligations as an author.
          </span>
        </label>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            <User className="h-3 w-3 inline mr-1" />
            Type your full legal name to confirm
          </label>
          <input
            type="text"
            value={formData.agreementName}
            onChange={(e) => updateFormData({ agreementName: e.target.value })}
            placeholder="Your full name as digital signature"
            disabled={!formData.agreementAccepted}
            className={cn(
              "w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all",
              !formData.agreementAccepted && "opacity-50"
            )}
            aria-label="Full legal name"
          />
        </div>

        {formData.agreementAccepted && formData.agreementName.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-bold">Agreement accepted by {formData.agreementName}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
