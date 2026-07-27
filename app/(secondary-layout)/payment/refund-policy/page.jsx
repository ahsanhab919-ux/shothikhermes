import PolicyPageLayout from "@/components/(secondary-layout)/PolicyPageLayout";

export async function generateMetadata() {
  return {
    title: "Shothik AI: Refund Policy | Shothik AI",
    description: "This is Refund Policy page",
  };
}

export default function PaymentPolicy() {
  const navigationItems = [
    {
      id: "refund-policy-main",
      label: "Shothik AI Return and Cancellation Policy",
    },
    {
      id: "section-1",
      label: "1. Subscription Cancellation",
    },
    {
      id: "section-2",
      label: "2. Refund Policy",
    },
    {
      id: "section-3",
      label: "3. Termination by Shothik AI",
    },
    {
      id: "section-4",
      label: "4. Chargebacks",
    },
  ];

  return (
    <PolicyPageLayout
      heading="Refund Policy"
      links={[{ name: "Legal" }, { name: "Refund Policy" }]}
      subtitle="Learn about our refund and cancellation policies for Shothik AI services."
      navigationItems={navigationItems}
    >
      {/* Main content for Return and Cancellation Policy */}
      <div className="space-y-6">
        <h1 id="refund-policy-main" className="text-2xl font-bold md:text-3xl">
          Shothik AI Return and Cancellation Policy
        </h1>

        <h2 id="section-1" className="mb-4 text-2xl font-semibold">
          1. Subscription Cancellation
        </h2>
        <p className="text-base leading-relaxed">
          You may cancel your subscription at any time by logging into your
          account and navigating to the "Account Settings" page. Once canceled,
          your subscription will remain active until the end of the current
          billing cycle. No refunds will be issued for the remaining period
          unless otherwise specified in the refund policy below.
        </p>

        <h2 id="section-2" className="mt-8 mb-4 text-2xl font-semibold">2. Refund Policy</h2>
        <p className="mb-4 text-base leading-relaxed">
          Refunds are only available under the following conditions:
        </p>
        <ul className="space-y-3 pb-8 pl-16">
          <li className="text-base leading-relaxed">
            <strong>Technical Issues</strong>: If Shothik AI services are not
            accessible due to technical problems on our side, users may request
            a refund. These issues must be reported within 3 days of purchase or
            renewal.
          </li>
          <li className="text-base leading-relaxed">
            <strong>Accidental Purchase</strong>: Users who accidentally
            purchased a subscription may request a refund within 48 hours of the
            transaction.
          </li>
        </ul>
        <p className="text-base leading-relaxed">
          All refund requests must be submitted via email to{" "}
          <a
            href="mailto:support@shothik.ai"
            className="text-primary hover:underline"
          >
            support@shothik.ai
          </a>
          . Refunds will be processed within 14 days of receiving the request
          and will be credited to the original payment method.
        </p>

        <h2 id="section-3" className="mt-8 mb-4 text-2xl font-semibold">
          3. Termination by Shothik AI
        </h2>
        <p className="text-base leading-relaxed">
          Shothik AI reserves the right to terminate a user's subscription for
          violations of the Terms and Conditions. No refunds will be issued in
          cases of termination due to misuse or policy violations.
        </p>

        <h2 id="section-4" className="mt-8 mb-4 text-2xl font-semibold">4. Chargebacks</h2>
        <p className="text-base leading-relaxed">
          If a chargeback is initiated for any transaction, access to the
          services will be immediately suspended. Users must resolve the
          chargeback with their payment provider before regaining access to the
          services.
        </p>
      </div>
    </PolicyPageLayout>
  );
}
