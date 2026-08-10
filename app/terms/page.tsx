import type { Metadata } from "next";
import { LegalShell } from "@/components/layout/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "SubSplit Terms of Service — your responsibilities, the scope of the service, disclaimers and Pro subscription terms.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      updated="August 10, 2026"
    >
      <section>
        <h2 className="text-xl font-semibold">1. Acceptance of terms</h2>
        <p className="mt-2 text-muted-foreground">
          By creating an account or using SubSplit (“the Service”) you agree
          to these Terms of Service. If you do not agree, please do not use
          the Service. We may update these terms; continued use after an
          update constitutes acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Eligibility</h2>
        <p className="mt-2 text-muted-foreground">
          You must be at least 13 years old (or the age of digital consent in
          your country, if higher) to use the Service. By using it you
          represent that you meet this requirement and that you have the
          authority to agree to these terms on behalf of your group.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Your responsibilities</h2>
        <p className="mt-2 text-muted-foreground">
          You are responsible for the accuracy of all data you enter,
          including subscription prices, billing dates, member email addresses
          and share percentages. Incorrect data leads to incorrect
          calculations. You are also responsible for keeping your account
          credentials secure and for the activity that happens under your
          account.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. What the Service does</h2>
        <p className="mt-2 text-muted-foreground">
          SubSplit is a tracking tool. It calculates each member&apos;s share
          of a subscription, records who owes whom, and sends reminders.
        </p>
        <p className="mt-3 text-muted-foreground">
          <strong className="text-foreground">
            We do not process real payments.
          </strong>{" "}
          SubSplit never collects, holds or transfers money between users. All
          transfers between group members happen directly between them,
          outside the Service. The amounts shown are estimates based on the
          data you provide and are not financial advice.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Pro subscription</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            Pro is a paid subscription billed on a recurring basis
            (monthly or yearly, depending on your plan).
          </li>
          <li>
            <strong className="text-foreground">Auto-renewal:</strong> your
            subscription renews automatically at the end of each billing
            period until cancelled.
          </li>
          <li>
            <strong className="text-foreground">Cancellation:</strong> you can
            cancel anytime, and the subscription will not renew after the
            current period ends. Cancellation is effective at the end of the
            already paid period.
          </li>
          <li>
            Payments are processed by a third-party payment provider. We do
            not see or store your card details.
          </li>
          <li>
            Fees are generally non-refundable, except where required by
            applicable law.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Acceptable use</h2>
        <p className="mt-2 text-muted-foreground">
          You agree not to misuse the Service: no attempts to breach
          security, no automated scraping, no use of the Service for unlawful
          purposes, and no impersonation of other users. We may suspend or
          terminate accounts that violate these rules.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Intellectual property</h2>
        <p className="mt-2 text-muted-foreground">
          SubSplit, its design, text, graphics and code are owned by us and
          protected by intellectual property laws. You may not copy,
          modify or redistribute them without our written permission. You
          retain ownership of the data you enter.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Disclaimer of warranties</h2>
        <p className="mt-2 text-muted-foreground">
          The Service is provided “as is” and “as available”, without
          warranties of any kind, express or implied. We do not guarantee
          that the Service will be uninterrupted or error-free, or that
          calculations are always correct. SubSplit is not an accounting,
          financial or legal service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Limitation of liability</h2>
        <p className="mt-2 text-muted-foreground">
          To the maximum extent permitted by law, SubSplit is not liable for
          indirect, incidental or consequential damages, including missed
          payments, financial losses or disputes between group members. You
          are responsible for paying group members what you owe them in a
          timely manner; the Service only tracks these obligations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Termination</h2>
        <p className="mt-2 text-muted-foreground">
          You may delete your account at any time. We may suspend or
          terminate your account for violations of these terms or applicable
          law. Upon termination, your access to the Service ends; your data
          will be handled in accordance with our Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">11. Governing law</h2>
        <p className="mt-2 text-muted-foreground">
          These terms are governed by the laws of the jurisdiction where the
          operator of the Service is established, without regard to conflict
          of law rules. Local consumer protection laws of your country of
          residence are not affected.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">12. Contact</h2>
        <p className="mt-2 text-muted-foreground">
          Questions about these terms? Write to{" "}
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
