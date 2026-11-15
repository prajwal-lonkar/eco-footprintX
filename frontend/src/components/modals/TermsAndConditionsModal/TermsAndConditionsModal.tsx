import ContentModal from "@components/modals/ContentModal/ContentModal";

import styles from "../ContentModal/ContentModal.module.scss";

interface TermsAndConditionsModalProps {
  show: boolean;
  onHide: () => void;
}

const TermsAndConditionsModal = ({
  show,
  onHide,
}: TermsAndConditionsModalProps) => {
  return (
    <ContentModal title="Terms and Conditions" show={show} onHide={onHide}>
      <div className={styles.lastUpdated}>Last updated: 6th Nov 2025</div>
      <div className={styles.separator}></div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>1. Introduction</div>
        <div className={styles.contentDescription}>
          These Terms & Conditions ("Terms") govern access to and use of the Eco
          FootprintX platform (the "Platform") provided by Eco FootprintX
          Limited, a company registered in England and Wales under number
          [Company Number] with its registered office at [Registered Address]
          ("Eco FootprintX", "we", "us", "our"). By creating an account,
          clicking "I agree", or otherwise using the Platform, the organisation
          you represent ("you", "your Company") accepts and agrees to be bound
          by these Terms and our Privacy Policy and Cookie Policy (together, the
          "Agreement").
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>2. Definitions</div>
        <div className={styles.contentDescription}>
          "Account" means a unique login and profile on the Platform. <br />
          "Company" means a Eco FootprintX customer that requests environmental
          impact data from its partners. <br />
          "Partner" means an organisation invited to provide environmental
          impact data for a product's component or service. <br />
          "Impact Category Data" means data relating to carbon, water, land, and
          waste impacts of a component, service, or product. <br />
          "User Content" means any data, files, or materials you or your
          authorised users submit to the Platform. <br />
          "Fees" means charges payable for Paid Plans, if applicable. <br />
          "Services" means all functionality provided via the Platform,
          websites, or APIs.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          3. Eligibility & Account Registration
        </div>
        <div className={styles.contentDescription}>
          You warrant that the individual accepting these Terms has authority to
          bind the organisation. The Platform is intended for business users
          only; consumers may not register. You must provide complete and
          accurate company registration information, a valid business email, and
          keep all details up to date. You are responsible for safeguarding
          login credentials and must promptly notify us of any unauthorised use.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>4. Description of Services</div>
        <div className={styles.contentDescription}>
          Eco FootprintX enables Companies to request environmental Impact
          Category Data from their Partners, compare results with industry
          benchmarks, and visualise supply-chain sustainability metrics. Key
          components include partner onboarding and invitation workflows, a
          secure data-exchange dashboard for Impact Category Data, benchmarking
          tools using the ecoinvent database and supplemental datasets, and
          analytics and reporting features. Certain features may be labelled
          beta, preview, or PoC and are provided "as is" for evaluation with no
          service-level guarantees.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          5. Licence & Intellectual Property
        </div>
        <div className={styles.contentDescription}>
          You retain all intellectual property rights in User Content. By
          uploading or submitting User Content, you grant Eco FootprintX a
          worldwide, royalty-free, non-exclusive licence to host, process,
          display, reproduce, and share your Content only as necessary to
          operate the Platform, fulfil data requests, and provide Services to
          you and your counterparties.
          <br />
          <br />
          The Platform, underlying software, design system, and all content not
          supplied by users are owned by Eco FootprintX or its licensors and are
          protected by UK and international intellectual property laws. We grant
          you a non-exclusive, non-transferable right to use the Platform during
          the subscription term in accordance with these Terms.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>6. Acceptable Use</div>
        <div className={styles.contentDescription}>
          You agree not to upload unlawful, infringing, or misleading data;
          reverse-engineer, decompile, or attempt to extract source code;
          interfere with security-related features or attempt unauthorised
          access; resell or sublicense the Platform without our written consent;
          introduce viruses, malicious code, or conduct penetration testing
          without permission; or upload personal data of third parties without a
          lawful basis. We reserve the right to suspend or terminate Accounts
          for breach of this clause.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          7. Fees & Payment (Public MVP)
        </div>
        <div className={styles.contentDescription}>
          Plans and pricing are as described on our order form or website.
          Invoices are issued in GBP, and VAT is added where applicable. Payment
          terms are net 30 days from invoice date unless stated otherwise. Late
          payments are subject to statutory interest under the Late Payment of
          Commercial Debts Act 1998. Fees are non-refundable except as required
          by law or under a Service-Level Agreement.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>8. Warranties & Disclaimers</div>
        <div className={styles.contentDescription}>
          Each party warrants that it has authority to enter into this
          Agreement. We will provide the Services with reasonable skill and
          care. Except as expressly stated, the Platform is provided "as is",
          and we do not warrant that benchmarks or third-party data (including
          ecoinvent) are error-free, complete, or fit for any particular
          purpose. Nothing in these Terms limits liability that cannot be
          excluded under English law, including liability for death, personal
          injury caused by negligence, or fraud.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>9. Limitation of Liability</div>
        <div className={styles.contentDescription}>
          In no event are we liable for indirect or consequential loss,
          including loss of profits, revenue, or data. Our total aggregate
          liability in any 12-month period is capped at the total Fees paid by
          you during that period or £10,000, whichever is higher.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>10. Indemnities</div>
        <div className={styles.contentDescription}>
          You shall indemnify Eco FootprintX against claims arising from User
          Content that infringes third-party rights or from your breach of these
          Terms. We will defend you against claims alleging that the Platform
          infringes third-party intellectual property rights, provided you
          promptly notify us and allow us to control the defence. Our liability
          for such claims is subject to the limitation in Section 9.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>11. Confidentiality</div>
        <div className={styles.contentDescription}>
          "Confidential Information" includes non-public business, technical, or
          data disclosures. Each party must protect the other's Confidential
          Information with reasonable care and may only use it to perform
          obligations under this Agreement. This does not apply to information
          that becomes public, is independently developed, received lawfully
          from a third party, or is required to be disclosed by law or court
          order.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>12. Data Protection</div>
        <div className={styles.contentDescription}>
          Each party shall comply with the UK GDPR and Data Protection Act 2018.
          Eco FootprintX acts as a Controller for account and billing data, and
          as a Processor on behalf of the requesting Company for Impact Category
          Data exchanged between Companies and Partners.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>13. Third-Party Services</div>
        <div className={styles.contentDescription}>
          The Platform may integrate with third-party databases or tools,
          including ecoinvent. Your use of third-party services is governed by
          their terms, and Eco FootprintX is not responsible for those services.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>14. Suspension & Termination</div>
        <div className={styles.contentDescription}>
          We may suspend or terminate access immediately if you breach these
          Terms, fees are overdue by 30 days, your use poses security or legal
          risk, or we are required by law. Upon termination, we will make your
          User Content available for export for 30 days before deletion.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          15. Changes to the Service or Terms
        </div>
        <div className={styles.contentDescription}>
          We may update the Platform or these Terms. Material changes will be
          notified at least 30 days in advance by email or in-app notification.
          Continued use after the effective date constitutes acceptance. If you
          object to the change, you may terminate before it takes effect.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>
          16. Governing Law & Jurisdiction
        </div>
        <div className={styles.contentDescription}>
          These Terms are governed by English law. The courts of England and
          Wales have exclusive jurisdiction, except that either party may seek
          injunctive relief in any jurisdiction to protect its intellectual
          property or Confidential Information.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>17. Force Majeure</div>
        <div className={styles.contentDescription}>
          Neither party is liable for delay or failure caused by events beyond
          reasonable control, including natural disasters, acts of government,
          or internet failures.
        </div>
      </div>

      <div className={styles.contentItem}>
        <div className={styles.contentTitle}>18. Miscellaneous</div>
        <div className={styles.contentDescription}>
          You may not assign this Agreement without our written consent; we may
          assign it to an affiliate or successor entity. This Agreement
          supersedes all prior agreements regarding the Services. If any
          provision is unenforceable, the remainder remains in effect. A party's
          failure to enforce any right is not a waiver of future enforcement.
          Notices must be in writing to the addresses in Section 1 or sent by
          email to{" "}
          <a href="mailto:legal@ecofootprintx.com">
            legal@ecofootprintx.com
          </a>{" "}
          (or your last known admin email). Notices are deemed received 24 hours
          after email dispatch or three business days after posting.
        </div>
      </div>
    </ContentModal>
  );
};

export default TermsAndConditionsModal;
