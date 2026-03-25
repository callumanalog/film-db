import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/legal-document";
import { SITE_NAME, getSupportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and shares personal data.`,
};

const UPDATED = "March 25, 2026";

export default function PrivacyPage() {
  const support = getSupportEmail();

  return (
    <LegalDocument
      title="Privacy Policy"
      description={`How we handle personal information when you use ${SITE_NAME}.`}
      lastUpdated={UPDATED}
    >
      <LegalSection heading="Overview">
        <p>
          This policy describes how {SITE_NAME} (“we”) processes personal data. It applies to visitors and
          registered users. By using the service, you agree to this policy alongside our{" "}
          <Link href="/terms" className="font-medium text-primary underline underline-offset-2">
            Terms of use
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Account data:</strong> email address, password (stored
            securely by our authentication provider), display name / username, and profile fields you
            choose to add.
          </li>
          <li>
            <strong className="text-foreground">Content you submit:</strong> reviews, ratings, photos,
            captions, and technical notes (camera, lens, lab, etc.) associated with uploads.
          </li>
          <li>
            <strong className="text-foreground">Usage data:</strong> standard server and analytics data
            (e.g. pages viewed, device/browser type, approximate region) as implemented on our hosting and
            analytics tools.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use data">
        <p>We use personal data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accounts, authentication, and core product features.</li>
          <li>Display community content (e.g. reviews and uploads) to you and other users.</li>
          <li>Operate, secure, and improve the service; fix bugs; and understand aggregate usage.</li>
          <li>Send service-related emails (e.g. verification, password reset) when you request them or when required.</li>
          <li>Comply with law and enforce our terms.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Community content visibility">
        <p>
          Reviews and uploads you submit are intended to be{" "}
          <strong className="text-foreground">visible to other users</strong> (for example on film stock
          pages, discovery, and community views). User-generated content may be indexed by search engines
          depending on how we expose pages. Do not post information you consider confidential.
        </p>
      </LegalSection>

      <LegalSection heading="Processors and hosting">
        <p>
          We use service providers to run the product, including{" "}
          <strong className="text-foreground">Supabase</strong> (authentication, database, and file storage)
          and hosting/analytics providers (e.g. Vercel). Those providers process data under their own terms
          and security practices, solely as needed to deliver the service.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and local storage">
        <p>
          We use cookies and similar technologies required for sessions and preferences (e.g. staying logged
          in). Analytics tools on our site may set their own cookies according to their policies.
        </p>
      </LegalSection>

      <LegalSection heading="Retention">
        <p>
          We retain account and content data while your account is active and as needed to operate the
          service. If you delete your account, we will delete or anonymize personal data when practicable,
          subject to legal retention needs and residual backups.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or export your
          personal data, or to object to certain processing. To exercise these rights, contact us using the
          details below. You may also lodge a complaint with your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          {SITE_NAME} is not directed at children under 16. We do not knowingly collect personal data from
          children under 16.
        </p>
      </LegalSection>

      <LegalSection heading="International transfers">
        <p>
          Our providers may process data in countries other than your own. Where required, we rely on
          appropriate safeguards (such as standard contractual clauses) offered by our vendors.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this policy and will change the “Last updated” date above. Material changes may be
          communicated through the product or by email where appropriate.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Privacy questions or requests?
          {support ? (
            <>
              {" "}
              Email{" "}
              <a href={`mailto:${support}`} className="font-medium text-primary underline underline-offset-2">
                {support}
              </a>
              .
            </>
          ) : (
            <> Use the support contact we publish in the app once available.</>
          )}
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
