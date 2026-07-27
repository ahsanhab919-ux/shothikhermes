import PolicyPageLayout from "@/components/(secondary-layout)/PolicyPageLayout";

export async function generateMetadata() {
  return {
    title: "Shothik AI: Payment Policy | Shothik AI",
    description: "This is Payment Policy page",
  };
}

export default function PaymentPolicy() {
  const navigationItems = [
    {
      id: "payment-policy-main",
      label: "Payment Policy",
    },
    {
      id: "section-1",
      label: "Payment Methods",
    },
    {
      id: "section-2",
      label: "Pricing and Fees",
    },
    {
      id: "section-3",
      label: "Automatic Renewal",
    },
    {
      id: "section-4",
      label: "Changes in Subscription Fees",
    },
    {
      id: "section-5",
      label: "Payment Authorization",
    },
    {
      id: "section-6",
      label: "Taxes",
    },
  ];

  return (
    <PolicyPageLayout
      heading="Payment Policy"
      links={[{ name: "Legal" }, { name: "Payment Policy" }]}
      subtitle="Learn about accepted payment methods, billing, and subscription terms for Shothik AI services."
      navigationItems={navigationItems}
    >
      {/* Main content for Payment Policy */}
      <div className="space-y-6">
        <h1 id="payment-policy-main" className="text-2xl font-bold md:text-3xl mb-6">Payment Policy</h1>
        <h2 id="section-1" className="mb-4 text-2xl font-semibold">Payment Methods</h2>

        <p className="text-base leading-relaxed">
          Shothik AI accepts the following payment methods:
        </p>

        <h3 className="mb-2 text-xl font-medium">
          Payment Methods for Bangladesh
        </h3>
        <p className="text-base leading-relaxed">
          For users in Bangladesh, we offer a local and convenient payment
          solution:
        </p>
        <ul className="space-y-2 pl-16">
          <li className="text-base leading-relaxed">
            <strong>bKash</strong>: Payments can be made via the widely used
            bKash mobile financial service. All payments will be processed in
            Bangladesh Taka (Taka). Users are required to provide accurate bKash
            transaction details during the checkout process.
          </li>
        </ul>

        <h3 className="mb-2 text-xl font-medium">Payment Methods for India</h3>
        <p className="text-base leading-relaxed">
          For users in India, we offer a local payment gateway:
        </p>
        <ul className="space-y-2 pl-16">
          <li className="text-base leading-relaxed">
            <strong>Paytm</strong>: Indian users can pay through Paytm, one of
            the most popular payment gateways in the country. All payments will
            be processed in Indian Rupees (INR). Users will be redirected to the
            Paytm gateway during checkout to complete their payment securely.
          </li>
        </ul>

        <h3 className="mb-2 text-xl font-medium">
          Payment Methods for International Users
        </h3>
        <p className="text-base leading-relaxed">
          For international users, we provide the following payment options:
        </p>
        <ul className="space-y-2 pl-16">
          <li className="text-base leading-relaxed">
            <strong>Credit Card</strong>: We accept major credit cards,
            including:
          </li>
          <ul className="space-y-1 pl-16">
            <li className="text-base leading-relaxed">Visa</li>
            <li className="text-base leading-relaxed">Mastercard</li>
            <li className="text-base leading-relaxed">American Express</li>
          </ul>
        </ul>

        <h2 id="section-2" className="mt-8 mb-4 text-2xl font-semibold">Pricing and Fees</h2>
        <p className="text-base leading-relaxed">
          Our services operate on a subscription model. The following plans are
          available:
        </p>
        <ul className="space-y-4 pl-16">
          <li className="text-base leading-relaxed">
            <strong>Free Plan</strong>: Ideal for freelance writers, bloggers,
            and small business owners. This plan allows you to paraphrase up to
            1,080 words, translate text up to 1,000 words (basic & humanized),
            fix basic grammar errors up to 1,000 words, summarize texts up to
            1,000 words, and translate text up to 1,000 words (basic).
            Additionally, you can detect AI-generated content up to 10,000
            words.
          </li>

          <li className="text-base leading-relaxed">
            <strong>Value Plan</strong>: You&apos;ll get unlimited access to our
            paraphrasing tool, humanize GPT up to 5,000 words per day, advanced
            grammar checks without any word limit, summarizer with no word
            limit, and basic & humanized translation without any word limit,
            plus 150,000 words with AI Detector.
          </li>

          <li className="text-base leading-relaxed">
            <strong>Pro Plan</strong>: You can unlock maximum potential with our
            Pro Plan. Enjoy unlimited access to our paraphrasing tool, humanize
            GPT up to 20,000 words with Raven Model, unlimited Panda Model for
            Humanize GPT, advanced grammar checks without any word limit,
            300,000 words with the AI Detector, summarizer with no word limit,
            and basic & humanized translation without any word limit.
          </li>

          <li className="text-base leading-relaxed">
            <strong>Unlimited Plan</strong>: You can unlock maximum potential
            with our Unlimited Plan. Enjoy unlimited access to our paraphrasing
            tool, unlimited Panda Model for Humanize GPT, unlimited Raven Model
            for Humanize GPT, 500,000 words with the AI Detector, summarizer
            with no word limit, advanced grammar checks without any word limit,
            and basic & humanized translation without any word limit.
          </li>
        </ul>
        <p className="mt-4 text-base leading-relaxed">
          The cost of each plan is displayed during the purchase process. All
          fees are non-refundable except in specific cases outlined below.
        </p>

        <h2 id="section-3" className="mt-8 mb-4 text-2xl font-semibold">Automatic Renewal</h2>
        <p className="text-base leading-relaxed">
          All subscriptions are subject to automatic renewal unless canceled by
          the user at least 10 days before the renewal date. Users will receive
          a reminder email about upcoming renewals, including any changes in the
          subscription fee. The new rate will automatically apply if no action
          is taken by the user.
        </p>

        <h2 id="section-4" className="mt-8 mb-4 text-2xl font-semibold">
          Changes in Subscription Fees
        </h2>
        <p className="text-base leading-relaxed">
          Shothik AI reserves the right to change the subscription fees at any
          time. Any changes will be communicated at least 10 days before the
          next billing cycle. By continuing to use the services after receiving
          notice, you agree to the updated fees.
        </p>

        <h2 id="section-5" className="mt-8 mb-4 text-2xl font-semibold">
          Payment Authorization
        </h2>
        <p className="text-base leading-relaxed">
          By subscribing, you authorize Shothik AI to charge your selected
          payment method for the subscription fees. If payment fails, Shothik AI
          may retry the payment method, and if unsuccessful, we reserve the
          right to suspend access to your account until payment is received.
        </p>

        <h2 id="section-6" className="mt-8 mb-4 text-2xl font-semibold">Taxes</h2>
        <p className="text-base leading-relaxed">
          All applicable taxes, including VAT or sales tax, will be added to the
          price of purchases as required by law.
        </p>
      </div>
    </PolicyPageLayout>
  );
}
