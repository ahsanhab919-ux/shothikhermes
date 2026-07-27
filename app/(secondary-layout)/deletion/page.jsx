import PolicyPageLayout from "@/components/(secondary-layout)/PolicyPageLayout";

export async function generateMetadata() {
  return {
    title: "Shothik AI: Data Deletion Policy | Shothik AI",
    description:
      "Data deletion instructions and policy for Shothik AI Marketing Automation",
  };
}

export default function DataDeletionPage() {
  const navigationItems = [
    {
      id: "data-deletion-main",
      label: "Shothik AI Marketing Automation - Data Deletion Policy",
    },
    {
      id: "section-1",
      label: "1. Data Deletion Methods",
    },
    {
      id: "section-2",
      label: "2. Data Deletion Scope",
    },
    {
      id: "section-3",
      label: "3. Data Retention Notes",
    },
    {
      id: "section-4",
      label: "4. Confirmation Process",
    },
    {
      id: "section-5",
      label: "5. Third-Party Data",
    },
    {
      id: "section-6",
      label: "6. Contact & Support",
    },
  ];

  return (
    <PolicyPageLayout
      heading="Data Deletion Policy"
      links={[{ name: "Legal" }, { name: "Data Deletion Policy" }]}
      subtitle="Learn how to request deletion of your personal data in compliance with GDPR, CCPA, and other privacy regulations."
      navigationItems={navigationItems}
    >
      {/* Main content */}
      <div className="space-y-6">
        <h1 id="data-deletion-main" className="text-2xl font-bold md:text-3xl">
          Shothik AI Marketing Automation - Data Deletion Policy
        </h1>

        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              <b>Effective date</b>: October 20, 2025
            </p>
            <p className="text-base leading-relaxed">
              This Data Deletion Policy explains how you can request deletion of
              your personal data from Shothik AI Marketing Automation in
              compliance with GDPR, CCPA, and other privacy regulations.
            </p>
          </div>

          <div className="space-y-4">
            <h2 id="section-1" className="text-2xl font-semibold">1. Data Deletion Methods</h2>
            <p className="text-base leading-relaxed">
              We provide multiple convenient methods for data deletion:
            </p>

            <div className="ml-4 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xl font-medium">
                  1.1 Via Facebook Settings
                </h3>
                <p className="text-base leading-relaxed">
                  The easiest way to remove your data:
                </p>
                <ol className="ml-4 list-inside list-decimal space-y-2">
                  <li>Go to your Facebook Settings</li>
                  <li>
                    Navigate to <strong>Apps and Websites</strong>
                  </li>
                  <li>
                    Find "Shothik AI Marketing Automation" in your active apps
                  </li>
                  <li>
                    Click <strong>Remove</strong> or{" "}
                    <strong>Revoke Access</strong>
                  </li>
                  <li>Confirm the removal action</li>
                </ol>
                <p className="text-primary text-base leading-relaxed">
                  ✓ This action automatically triggers immediate data deletion
                  from our systems.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-medium">1.2 Via Email Request</h3>
                <p className="text-base leading-relaxed">
                  Send us a formal deletion request:
                </p>
                <ul className="ml-4 list-inside list-disc space-y-2">
                  <li>
                    <strong>Email:</strong> support@shothik.ai
                  </li>
                  <li>
                    <strong>Subject:</strong> "Data Deletion Request"
                  </li>
                  <li>
                    <strong>Required Information:</strong>
                    <ul className="list-circle ml-6 list-inside space-y-1">
                      <li>Your registered email address</li>
                      <li>Facebook User ID (if available)</li>
                      <li>Account username</li>
                    </ul>
                  </li>
                </ul>
                <p className="text-base leading-relaxed">
                  We will process email requests within <strong>30 days</strong>{" "}
                  as required by law.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-medium">
                  1.3 Via Automated Endpoint (For Developers)
                </h3>
                <p className="text-base leading-relaxed">
                  For integration purposes, we provide a secure API endpoint:
                </p>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <div>
                    <strong>Endpoint:</strong> POST
                    https://api.shothik.ai/v1/data-deletion
                  </div>
                  <div>
                    <strong>Headers:</strong>
                  </div>
                  <div className="ml-4">Content-Type: application/json</div>
                  <div className="ml-4">
                    X-Shothik-Signature: HMAC-SHA256(JSON payload, secret_key)
                  </div>
                  <div>
                    <strong>Payload:</strong>
                  </div>
                  <div className="ml-4">{`{`}</div>
                  <div className="ml-8">"user_id": "facebook_user_id",</div>
                  <div className="ml-8">"email": "registered_email",</div>
                  <div className="ml-8">
                    "signed_request": "facebook_signed_request"
                  </div>
                  <div className="ml-4">{`}`}</div>
                </div>
                <p className="text-destructive text-base leading-relaxed">
                  ⚠️ This method requires technical knowledge and proper
                  authentication.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-medium">
                  1.4 Via Platform Dashboard
                </h3>
                <p className="text-base leading-relaxed">
                  Direct deletion from our platform:
                </p>
                <ol className="ml-4 list-inside list-decimal space-y-2">
                  <li>Log into your Shothik AI Marketing Automation account</li>
                  <li>
                    Navigate to <strong>Settings</strong> →{" "}
                    <strong>Account</strong>
                  </li>
                  <li>
                    Click on <strong>"Delete Account"</strong>
                  </li>
                  <li>Confirm your decision in the pop-up dialog</li>
                  <li>Enter your password for verification</li>
                </ol>
                <p className="text-primary text-base leading-relaxed">
                  ✓ This method provides immediate account and data deletion.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="section-2" className="text-2xl font-semibold">2. Data Deletion Scope</h2>
            <p className="text-base leading-relaxed">
              When you request data deletion, we permanently remove the
              following information from our active systems:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                <strong>User Account Information</strong>
                <ul className="list-circle ml-6 list-inside space-y-1">
                  <li>Email address and profile data</li>
                  <li>Encrypted credentials and authentication tokens</li>
                  <li>Personal preferences and settings</li>
                </ul>
              </li>
              <li>
                <strong>Facebook Integration Data</strong>
                <ul className="list-circle ml-6 list-inside space-y-1">
                  <li>Facebook Ad Account connections and permissions</li>
                  <li>Page access tokens and business manager links</li>
                  <li>API credentials and authentication data</li>
                </ul>
              </li>
              <li>
                <strong>Campaign Data</strong>
                <ul className="list-circle ml-6 list-inside space-y-1">
                  <li>All created campaigns and ad sets</li>
                  <li>Historical performance metrics and analytics</li>
                  <li>A/B testing results and optimization data</li>
                </ul>
              </li>
              <li>
                <strong>AI-Generated Content</strong>
                <ul className="list-circle ml-6 list-inside space-y-1">
                  <li>AI-created ad copy and campaign ideas</li>
                  <li>Generated images, videos, and media content</li>
                  <li>Competitor analysis and market research data</li>
                </ul>
              </li>
              <li>
                <strong>Business Data</strong>
                <ul className="list-circle ml-6 list-inside space-y-1">
                  <li>Billing information and subscription records</li>
                  <li>Payment history and invoice data</li>
                  <li>Support tickets and communication history</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="section-3" className="text-2xl font-semibold">3. Data Retention Notes</h2>
            <div className="border-border bg-muted/50 rounded-lg border p-4">
              <p className="text-foreground text-base leading-relaxed font-semibold">
                Important Retention Information:
              </p>
              <ul className="text-muted-foreground mt-2 ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Encrypted Backups:</strong> Some data may remain in
                  our encrypted backups for up to 30 days due to technical
                  backup rotation processes
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may retain certain
                  data as required by law for tax, audit, or legal compliance
                  purposes
                </li>
                <li>
                  <strong>Aggregate Data:</strong> Anonymous, aggregated
                  analytics data that cannot be linked back to you may be
                  retained for platform improvement
                </li>
                <li>
                  <strong>Meta Platform Data:</strong> Data stored directly on
                  Facebook/Meta platforms will follow Meta's data retention
                  policies
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 id="section-4" className="text-2xl font-semibold">4. Confirmation Process</h2>
            <p className="text-base leading-relaxed">
              After processing your deletion request, we provide:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                <strong>Email Confirmation:</strong> Detailed confirmation email
                specifying what data was deleted
              </li>
              <li>
                <strong>Deletion Certificate:</strong> Optional certificate of
                data destruction upon request
              </li>
              <li>
                <strong>Timeline:</strong> Clear communication about the
                deletion timeline and any retention exceptions
              </li>
              <li>
                <strong>Support Follow-up:</strong> Opportunity to confirm
                completion and address any concerns
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="section-5" className="text-2xl font-semibold">5. Third-Party Data</h2>
            <p className="text-base leading-relaxed">
              Our data deletion process also covers data shared with our trusted
              service providers:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                <strong>Meta Platforms:</strong> We revoke all API access and
                delete stored Meta data
              </li>
              <li>
                <strong>Google Cloud AI:</strong> All AI training data and
                generated content is purged
              </li>
              <li>
                <strong>MongoDB Atlas:</strong> Complete database record removal
                across all collections
              </li>
              <li>
                <strong>ImageKit & CDN:</strong> All uploaded and generated
                media files are deleted
              </li>
              <li>
                <strong>Analytics Services:</strong> User-specific data is
                removed from analytics platforms
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 id="section-6" className="text-2xl font-semibold">6. Contact & Support</h2>
            <p className="text-base leading-relaxed">
              For assistance with data deletion or any questions:
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-base leading-relaxed">
                <strong>Primary Support:</strong>{" "}
                <a href="mailto:support@shothik.ai" className="text-primary">
                  support@shothik.ai
                </a>
              </p>
              <p className="text-base leading-relaxed">
                <strong>Privacy Team:</strong>{" "}
                <a href="mailto:privacy@shothik.ai" className="text-primary">
                  privacy@shothik.ai
                </a>
              </p>
              <p className="text-base leading-relaxed">
                <strong>Urgent Requests:</strong>{" "}
                <a href="mailto:legal@shothik.ai" className="text-primary">
                  legal@shothik.ai
                </a>
              </p>
            </div>
            <div className="mt-4 rounded-lg border p-4">
              <p className="text-base leading-relaxed font-semibold">
                Response Time Guarantee:
              </p>
              <ul className="mt-2 ml-4 list-inside list-disc space-y-1">
                <li>
                  <strong>Initial Response:</strong> Within 72 hours
                </li>
                <li>
                  <strong>Deletion Processing:</strong> Within 30 days (as
                  required by law)
                </li>
                <li>
                  <strong>Urgent Requests:</strong> Expedited processing
                  available for legal requirements
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              7. Compliance Information
            </h2>
            <p className="text-base leading-relaxed">
              Our data deletion processes are designed to comply with:
            </p>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                <strong>GDPR Article 17:</strong> Right to erasure ("right to be
                forgotten")
              </li>
              <li>
                <strong>CCPA Section 1798.105:</strong> California Consumer
                Privacy Act deletion rights
              </li>
              <li>
                <strong>Meta Platform Terms:</strong> Data deletion requirements
                for Facebook platform apps
              </li>
              <li>
                <strong>Global Standards:</strong> Adaptable to various
                international privacy regulations
              </li>
            </ul>
          </div>
        </div>
      </div>

    
    </PolicyPageLayout>
  );
}
