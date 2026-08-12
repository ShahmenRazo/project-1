import type { Metadata } from "next";
import { LegalShell } from "@/components/layout/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — SubSplit",
  description:
    "SubSplit Privacy Policy — what data we collect, how we use it, cookies and your GDPR/CCPA rights.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — SubSplit",
    description:
      "SubSplit Privacy Policy — what data we collect, how we use it, cookies and your GDPR/CCPA rights.",
    url: "/privacy",
    type: "website",
    siteName: "SubSplit",
    images: [
      { url: "/api/og?title=SubSplit%20Privacy", width: 1200, height: 630 },
    ],
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="August 10, 2026"
    >
      <section>
        <h2 className="text-xl font-semibold">1. Who we are</h2>
        <p className="mt-2 text-muted-foreground">
          SubSplit (“we”, “us”) provides a service that helps you share the
          cost of online subscriptions with friends. This Privacy Policy
          explains what personal data we collect, why we collect it, and what
          rights you have under the GDPR, the CCPA and other applicable
          privacy laws.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. What data we collect</h2>
        <p className="mt-2 text-muted-foreground">
          We collect only the data necessary to run the service:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Account data</strong> — email
            address, display name and a hashed password. We never store
            passwords in plain text.
          </li>
          <li>
            <strong className="text-foreground">Subscription data</strong> —
            the services you share (e.g. Netflix, Spotify), their price,
            billing cycle and billing day, as well as group members and their
            share percentages.
          </li>
          <li>
            <strong className="text-foreground">Push notification tokens</strong>{" "}
            (FCM tokens) — only if you enable push notifications in your
            browser. Used exclusively to deliver reminders about debts and
            group activity.
          </li>
          <li>
            <strong className="text-foreground">Payment records</strong> —
            generated amounts owed between group members. SubSplit tracks who
            owes whom but never handles real money transfers.
          </li>
          <li>
            <strong className="text-foreground">Analytics</strong> — aggregate
            usage data, collected only after you give your explicit consent
            via the cookie banner.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. How we use your data</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Calculating shares and debts within your groups.</li>
          <li>Sending reminders and notifications about debts and group changes.</li>
          <li>Providing account access, authentication and security.</li>
          <li>Improving the service with anonymised analytics (with your consent).</li>
          <li>Complying with legal obligations and enforcing our Terms of Service.</li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          We do not sell, rent or share your personal data with third parties
          for their own marketing purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Cookies</h2>
        <p className="mt-2 text-muted-foreground">We use the following types of cookies:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong className="text-foreground">Essential cookies</strong> —
            authentication and session security. These are strictly necessary
            for the service to work and cannot be disabled.
          </li>
          <li>
            <strong className="text-foreground">Analytics cookies</strong> —
            loaded only after you press “Accept all” in the cookie banner. If
            you choose “Only necessary”, no analytics scripts are loaded.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Your choice is stored in your browser and can be changed at any time
          by clearing your browser data for this site.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Who we share data with</h2>
        <p className="mt-2 text-muted-foreground">
          We use a limited set of sub-processors, all bound by data processing
          agreements: a hosting provider for the database and infrastructure,
          an email delivery service for invitation emails, and a payment
          provider for processing Pro subscription payments (they receive only
          the data needed to complete a payment).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Data retention</h2>
        <p className="mt-2 text-muted-foreground">
          We keep your data for as long as your account is active and for a
          reasonable period afterwards to comply with legal obligations and
          resolve disputes. Billing records are kept for the period required
          by tax law. You can delete your account at any time, which removes
          or anonymises your personal data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Your rights</h2>
        <p className="mt-2 text-muted-foreground">
          Depending on your location (GDPR, CCPA and other laws), you have the
          right to:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Access and obtain a copy of your personal data.</li>
          <li>Rectify inaccurate or incomplete data.</li>
          <li>
            Delete your account and personal data — you can do this at any
            time via{" "}
            <a
              href="/api/delete-account"
              className="font-medium underline underline-offset-4"
            >
              /api/delete-account
            </a>
            .
          </li>
          <li>Restrict or object to processing, and request data portability.</li>
          <li>Withdraw consent at any time (for example, for analytics).</li>
          <li>
            Under the CCPA: opt out of the “sale” of personal data — we never
            sell personal data, so nothing changes when you exercise this
            right, and we will not discriminate against you for doing so.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          To exercise any of these rights, contact us at{" "}
          <a
            href="mailto:support@subsplit.app"
            className="font-medium underline underline-offset-4"
          >
            support@subsplit.app
          </a>
          . We will respond within 30 days. You may also lodge a complaint
          with your local data protection authority.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Children</h2>
        <p className="mt-2 text-muted-foreground">
          The service is not intended for children under 13 (or 16 within the
          EEA, unless parental consent is given). If you believe a child has
          provided us with personal data, contact us and we will delete it.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Security</h2>
        <p className="mt-2 text-muted-foreground">
          We encrypt data in transit (HTTPS), store passwords hashed, and
          restrict internal access to personal data. No method of transmission
          or storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Changes to this policy</h2>
        <p className="mt-2 text-muted-foreground">
          We may update this policy from time to time. Material changes will
          be announced on the site or by email. The “Last updated” date above
          indicates when the policy was last revised.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">11. Contact</h2>
        <p className="mt-2 text-muted-foreground">
          Questions about this policy or your data? Write to{" "}
          <a
            href="mailto:support@subsplit.app"
            className="font-medium underline underline-offset-4"
          >
            support@subsplit.app
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}
