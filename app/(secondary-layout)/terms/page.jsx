import PolicyPageLayout from "@/components/(secondary-layout)/PolicyPageLayout";

export async function generateMetadata() {
  return {
    title: "Shothik AI: Terms & Conditions | Shothik AI",
    description: "This is terms and condition page",
  };
}

export default function TermsPage() {
  const navigationItems = [
    {
      id: "terms-main",
      label: "Shothik AI Terms and Conditions",
    },
    {
      id: "section-1",
      label: "1. Acceptance of Terms",
    },
    {
      id: "section-2",
      label: "2. Services Provided",
    },
    {
      id: "section-3",
      label: "3. User Responsibilities",
    },
    {
      id: "section-4",
      label: "4. Prohibited Activities",
    },
    {
      id: "section-5",
      label: "5. Intellectual Property",
    },
    {
      id: "section-6",
      label: "6. Payment for Services",
    },
    {
      id: "section-7",
      label: "7. Modifications to the Services",
    },
    {
      id: "section-8",
      label: "8. Disclaimer of Warranties",
    },
    {
      id: "section-9",
      label: "9. Limitation of Liability",
    },
    {
      id: "section-10",
      label: "10. Governing Law and Dispute Resolution",
    },

  ];

  return (
    <PolicyPageLayout
      heading="Terms & Conditions"
      links={[{ name: "Legal" }, { name: "Terms & Conditions" }]}
      subtitle="These Terms govern your use of our website and services. By using our Services, you agree to these Terms."
      navigationItems={navigationItems}
    >
      {/* Main content */}
      <div className="space-y-6">
        <h1 id="terms-main" className="text-2xl font-bold md:text-3xl">Shothik AI Terms and Conditions</h1>

        <p className="text-base leading-relaxed">
          These Terms of Service ("Agreement") are made between Shothik AI
          (referred to as "Company", "we", "us", or "our") and you ("User",
          "you", or "your"), the individual accessing our services. By using the
          Shothik AI platform, you agree to comply with the terms and conditions
          outlined below. If you do not agree, please discontinue using the
          services immediately.
        </p>

        <div className="space-y-4">
          <h2 id="section-1" className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-base leading-relaxed">
            By using the Shothik AI services, you affirm that you are at least
            13 years of age. Minors (under 18 years of age) must have the
            consent of a parent or guardian to use the services. Shothik AI
            reserves the right to change these terms at any time. You will be
            notified of any changes via email or a notice on our website. Your
            continued use of the services after any modifications indicates your
            acceptance of the updated terms.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-2" className="text-2xl font-semibold">2. Services Provided</h2>
          <p className="text-base leading-relaxed">
            Shothik AI offers a wide range of AI-powered writing and translation
            tools designed to assist users in creating, refining, and improving
            content. The services provided include:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Paraphrasing: Rewriting content while maintaining the original
              meaning.
            </li>
            <li>
              Bypass GPT: Advanced paraphrasing and content generation that
              avoids detection by AI detection tools, ideal for academic or
              content creation use cases.
            </li>
            <li>
              Grammar Fix: Correcting grammatical errors, improving sentence
              structure, and ensuring content is written clearly.
            </li>
            <li>
              Summarizing: Condensing long pieces of text into shorter summaries
              that capture the main points.
            </li>
            <li>
              Translator: Translating content between multiple languages,
              providing accurate and context-aware translations.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 id="section-3" className="text-2xl font-semibold">3. User Responsibilities</h2>
          <p className="text-base leading-relaxed">Users agree to:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Provide accurate, current, and complete information during
              registration.
            </li>
            <li>
              Maintain the confidentiality of account credentials and notify us
              immediately of unauthorized use of your account.
            </li>
            <li>
              Comply with all applicable laws and not use our services for any
              unlawful or fraudulent purposes.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 id="section-4" className="text-2xl font-semibold">4. Prohibited Activities</h2>
          <p className="text-base leading-relaxed">Users may not:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Attempt to breach or bypass security features of the site.</li>
            <li>
              Use the services to defraud, mislead, or impersonate others.
            </li>
            <li>
              Use Shothik AI for any illegal purposes, including sending
              harassing or harmful content.
            </li>
            <li>Reverse-engineer or misuse any part of the service.</li>
            <li>
              Share account credentials with unauthorized persons or resell the
              services without permission.
            </li>
          </ul>
          <p className="text-base leading-relaxed">
            Violation of any of these prohibitions may result in termination of
            your account and legal action.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-5" className="text-2xl font-semibold">5. Intellectual Property</h2>
          <p className="text-base leading-relaxed">
            All content, technology, and trademarks on Shothik AI are owned by
            the Company. Users are granted a limited, non-exclusive license to
            use the services for personal or internal business purposes only. No
            content may be reproduced, distributed, or publicly displayed
            without our express written consent.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-6" className="text-2xl font-semibold">6. Payment for Services</h2>
          <p className="text-base leading-relaxed">
            See our Payment Policy below for details on fees, billing, and
            subscription terms.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-7" className="text-2xl font-semibold">
            7. Modifications to the Services
          </h2>
          <p className="text-base leading-relaxed">
            Shothik AI reserves the right to modify, suspend, or discontinue any
            part of our services at any time, with or without notice.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-8" className="text-2xl font-semibold">
            8. Disclaimer of Warranties
          </h2>
          <p className="text-base leading-relaxed">
            Shothik AI services are provided "AS IS" and "AS AVAILABLE". We do
            not guarantee that the services will meet your needs or be
            error-free. We disclaim all warranties, express or implied,
            including any warranties of merchantability or fitness for a
            particular purpose.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-9" className="text-2xl font-semibold">9. Limitation of Liability</h2>
          <p className="text-base leading-relaxed">
            In no event shall Shothik AI be liable for any direct, indirect,
            incidental, special, or consequential damages arising from the use
            of our services. This limitation applies to all claims, including
            but not limited to lost profits, service interruptions, or
            inaccuracies in service content.
          </p>
        </div>

        <div className="space-y-4">
          <h2 id="section-10" className="text-2xl font-semibold">
            10. Governing Law and Dispute Resolution
          </h2>
          <p className="text-base leading-relaxed">
            These Terms are governed by the laws of Bangladesh. Any disputes
            arising out of or related to these Terms or the use of our services
            will be settled in the courts of Bangladesh.
          </p>
        </div>
      </div>


    </PolicyPageLayout>
  );
}
