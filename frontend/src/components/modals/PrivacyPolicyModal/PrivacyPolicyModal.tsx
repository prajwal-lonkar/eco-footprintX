import ContentModal from "@components/modals/ContentModal/ContentModal";

import styles from "../ContentModal/ContentModal.module.scss";

interface PrivacyPolicyModalProps {
  show: boolean;
  onHide: () => void;
}

const PrivacyPolicyModal = ({ show, onHide }: PrivacyPolicyModalProps) => {
  return (
    <ContentModal title="Privacy Policy" show={show} onHide={onHide}>
      <div className={styles.lastUpdated}>Last updated: 6th Nov 2025</div>
      <div className={styles.separator}></div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>1. Introduction</div>
        <div className={styles.contentDescription}>
          This Privacy Policy explains how Eco FootprintX Limited ("Eco
          FootprintX", "we", "us", "our") collects, uses, and protects personal data
          when you or your Company access and use the Eco FootprintX platform
          (the "Platform"). By using the Platform, you acknowledge that your
          personal data will be processed in accordance with this Privacy Policy
          and applicable data protection laws.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>2. Data We Collect</div>
        <div className={styles.contentDescription}>
          We collect the following categories of personal data:
          <ul>
            <li>
              <strong>Account Information:</strong> Name, business email, job
              title, company name, and login credentials.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact
              with the Platform, including log files, IP addresses, browser
              type, and session activity.
            </li>
            <li>
              <strong>Communications:</strong> Emails, messages, or other
              correspondence exchanged with us.
            </li>
            <li>
              <strong>Billing Data:</strong> Payment information, billing
              address, and transaction history for paid subscriptions.
            </li>
            <li>
              <strong>Supplier and Partner Contacts:</strong> Business contact
              details submitted for the purpose of data exchange between
              Companies and Partners.
            </li>
          </ul>
          We do not intentionally collect sensitive personal data unless
          required by law or voluntarily provided with consent.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>3. How We Use Your Data</div>
        <div className={styles.contentDescription}>
          We process personal data to:
          <ul>
            <li>Provide and maintain the Platform and its features.</li>
            <li>Create and manage user accounts.</li>
            <li>
              Facilitate communication between Companies and their Partners.
            </li>
            <li>Process payments and manage subscriptions.</li>
            <li>
              Ensure platform security, prevent fraud, and comply with legal
              obligations.
            </li>
            <li>
              Improve the functionality and user experience of the Platform.
            </li>
            <li>
              Send service-related notifications or administrative messages.
            </li>
          </ul>
          We do not sell or rent personal data to third parties.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>4. Legal Basis for Processing</div>
        <div className={styles.contentDescription}>
          We process personal data under one or more of the following lawful
          bases:
          <ul>
            <li>Performance of a contract with your Company.</li>
            <li>Compliance with legal obligations.</li>
            <li>
              Legitimate interests, such as improving our Services and ensuring
              security.
            </li>
            <li>
              Consent, where required by law (for example, for optional
              communications).
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>5. Data Sharing</div>
        <div className={styles.contentDescription}>
          We may share personal data with:
          <ul>
            <li>
              Service providers that support Platform hosting, analytics,
              communication, and payment processing.
            </li>
            <li>
              Business partners involved in delivering the Platform's features
              (e.g., database and analytics providers).
            </li>
            <li>Regulatory bodies or law enforcement where required by law.</li>
            <li>
              Successors or affiliates in the event of a merger, acquisition, or
              restructuring.
            </li>
          </ul>
          All third parties are bound by confidentiality and data protection
          obligations consistent with this Policy.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          6. International Data Transfers
        </div>
        <div className={styles.contentDescription}>
          If personal data is transferred outside the United Kingdom, we ensure
          appropriate safeguards are in place, such as Standard Contractual
          Clauses or equivalent mechanisms approved under UK GDPR.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>7. Data Retention</div>
        <div className={styles.contentDescription}>
          We retain personal data only for as long as necessary to fulfil the
          purposes described in this Policy, comply with legal requirements, or
          resolve disputes. Once data is no longer required, it will be securely
          deleted or anonymised.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>8. Security</div>
        <div className={styles.contentDescription}>
          We use technical and organisational measures to protect personal data
          against unauthorised access, alteration, disclosure, or destruction.
          These include encryption, access controls, and regular system
          monitoring. However, no system is entirely secure, and we cannot
          guarantee absolute security of data transmission over the internet.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>9. Your Rights</div>
        <div className={styles.contentDescription}>
          Under the UK GDPR, you have the right to:
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate or incomplete data.</li>
            <li>Request deletion of your data where applicable.</li>
            <li>Object to or restrict certain types of processing.</li>
            <li>
              Request data portability in a structured, commonly used format.
            </li>
            <li>Withdraw consent where processing is based on consent.</li>
          </ul>
          Requests can be made by contacting us at{" "}
          <a href="mailto:privacy@ecofootprintx.com">
            privacy@ecofootprintx.com
          </a>
          . We will respond within the time limits set by law.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>10. Cookies</div>
        <div className={styles.contentDescription}>
          We use cookies and similar technologies to improve Platform
          performance and user experience. Cookies may collect technical data
          such as browser type, pages visited, and session duration. You can
          manage or disable cookies in your browser settings, but some features
          of the Platform may not function properly if cookies are disabled.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>11. Third-Party Links</div>
        <div className={styles.contentDescription}>
          The Platform may contain links to external websites or services not
          operated by Eco FootprintX. We are not responsible for the privacy
          practices or content of such third parties, and users are encouraged
          to review their privacy policies.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          12. Data Controller and Contact
        </div>
        <div className={styles.contentDescription}>
          Eco FootprintX Limited acts as the data controller for account and
          billing data and as a processor for Impact Category Data exchanged
          between Companies and Partners. For all privacy-related questions,
          please contact{" "}
          <a href="mailto:privacy@ecofootprintx.com">
            privacy@ecofootprintx.com
          </a>{" "}
          or write to us at our registered office.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>13. Changes to This Policy</div>
        <div className={styles.contentDescription}>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or legal requirements. Updates will be notified via
          email or in-app notice, and the revised version will take effect upon
          posting. Continued use of the Platform after such updates constitutes
          acceptance of the revised Policy.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>14. Governing Law</div>
        <div className={styles.contentDescription}>
          This Privacy Policy is governed by the laws of England and Wales. Any
          disputes will be subject to the exclusive jurisdiction of the courts
          of England and Wales.
        </div>
      </div>
    </ContentModal>
  );
};

export default PrivacyPolicyModal;
