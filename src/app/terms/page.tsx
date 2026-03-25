import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/legal-document";
import { SITE_NAME, getSupportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms of use for ${SITE_NAME} — accounts, community content, and acceptable use.`,
};

const UPDATED = "March 25, 2026";

export default function TermsPage() {
  const support = getSupportEmail();

  return (
    <LegalDocument
      title="Terms of use"
      description={`These terms govern your use of ${SITE_NAME} and our community features.`}
      lastUpdated={UPDATED}
    >
      <LegalSection heading="Who we are">
        <p>
          {SITE_NAME} (“we”, “us”) provides a film photography database, discovery tools, and optional
          community features (such as reviews and image uploads). By creating an account or using the
          service, you agree to these terms and our{" "}
          <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Eligibility">
        <p>
          You must be at least <strong className="text-foreground">16 years old</strong> to use {SITE_NAME}.
          If you are using the service on behalf of an organization, you confirm you have authority to bind
          that organization.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You are responsible for your login credentials and for activity under your account. Provide
          accurate information and keep your account secure. You may not share accounts in a way that
          misleads others about who posted content.
        </p>
      </LegalSection>

      <LegalSection heading="Community content you submit">
        <p>
          When you post reviews, photos, captions, or other materials (“your content”), you retain your
          rights, but you grant {SITE_NAME} a{" "}
          <strong className="text-foreground">non-exclusive, worldwide, royalty-free licence</strong> to
          host, store, reproduce, display, and distribute your content as needed to operate, promote, and
          improve the service (including showing it to other users on film pages, discovery, and community
          areas).
        </p>
        <p>
          You confirm you have the rights to grant this licence for your content. Do not upload others’
          work without permission, or content you do not have rights to use.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Break the law or infringe others’ intellectual property or privacy rights.</li>
          <li>Upload malware, attempt to breach security, or disrupt the service.</li>
          <li>Harass, threaten, or post unlawful, hateful, or sexually exploitative content.</li>
          <li>Spam, scrape, or use automated means in a way that overloads or damages the service.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Moderation and removal">
        <p>
          We may remove or restrict content or accounts that violate these terms, pose risk, or are required
          to be removed by law. We may also remove content that is technically problematic (e.g. broken or
          unsafe files). We are not obligated to monitor all content but may review reports and take action
          we consider appropriate.
        </p>
        <p>
          To report abuse or request review of content, contact us
          {support ? (
            <>
              {" "}
              at{" "}
              <a href={`mailto:${support}`} className="font-medium text-primary underline underline-offset-2">
                {support}
              </a>
              .
            </>
          ) : (
            <> using the contact method we publish on the site or in product communications.</>
          )}
        </p>
      </LegalSection>

      <LegalSection heading="Catalog and third-party information">
        <p>
          Film stock data, retailer links, and similar information are provided for reference. Specifications
          and availability change; we do not guarantee accuracy. Third-party sites (e.g. retailers, Flickr)
          have their own terms.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers">
        <p>
          The service is provided <strong className="text-foreground">“as is”</strong>. To the fullest extent
          permitted by law, we disclaim implied warranties and are not liable for indirect or consequential
          damages arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update these terms from time to time. We will indicate the “Last updated” date at the top of
          this page. Continued use after changes constitutes acceptance of the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms?
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
            <> Reach out via the contact details we provide in the app or on our website.</>
          )}
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
