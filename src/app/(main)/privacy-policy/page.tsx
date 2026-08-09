import type { Metadata } from "next"

import { ENTITY } from "@lib/constants/legal"
import { Callout, LegalShell, List, Section } from "@modules/legal/components/legal-shell"

export const metadata: Metadata = {
  title: "Privacy Policy | CrossFriend",
  description:
    "What personal data CrossFriend collects, why we collect it, who we share it with — including the bakers who make your order — and how to exercise your rights.",
}

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      summary="What we collect, why, and who sees it. The short version: we collect what an order needs, we share your delivery details with the baker making it, and we never sell your data."
    >
      <Section n={1} title="Who is responsible for your data">
        <p>
          {ENTITY.legalName}, at {ENTITY.address}, is the data fiduciary for personal data collected
          through {ENTITY.website}.
        </p>
        <p>
          This policy is written to meet the Digital Personal Data Protection Act, 2023 and the
          Information Technology (Reasonable Security Practices) Rules, 2011.
        </p>
      </Section>

      <Section n={2} title="What we collect">
        <p className="font-semibold text-grey-90">Because you place an order</p>
        <List
          items={[
            "Your name, mobile number and email address.",
            "Delivery address and pincode, and the recipient's name and number if you are sending a gift.",
            "Your order history, and any message you ask to be written on a cake.",
            "Delivery date and time preferences.",
          ]}
        />

        <p className="mt-6 font-semibold text-grey-90">Because you use the AI Cake Studio</p>
        <List
          items={[
            "The descriptions you type, and any reference photo you upload.",
            "The design images generated from them, and the options you selected (size, flavour, occasion).",
            "Whether you chose to share a design publicly.",
          ]}
        />

        <p className="mt-6 font-semibold text-grey-90">Automatically</p>
        <List
          items={[
            "Device and browser information, IP address, and pages viewed.",
            "Cookies needed to keep you signed in and to remember your cart.",
          ]}
        />

        <Callout>
          We do <strong>not</strong> store your full card number, CVV or UPI PIN. Payments are
          handled by a payment provider; we receive only the result and a reference.
        </Callout>
      </Section>

      <Section n={3} title="Why we use it">
        <List
          items={[
            "To take, prepare, deliver and support your order.",
            "To sign you in, and to keep your account secure.",
            "To generate cake designs you ask for, and to show you your own past designs.",
            "To tell you about your order — confirmation, preparation and delivery updates.",
            "To detect and prevent fraud and abuse.",
            "To meet tax, accounting and food-safety record-keeping obligations.",
          ]}
        />
        <p>
          We use your data for marketing only where you have opted in, and you can opt out at any
          time.
        </p>
      </Section>

      <Section n={4} title="Who we share it with">
        <Callout>
          <strong>Bakers see what they need to make and deliver your order</strong> — your name,
          delivery address, contact number, order contents and any cake message. They do not see your
          payment details or your wider order history with other bakers.
        </Callout>
        <List
          items={[
            "Delivery partners, where a delivery is not made by the baker directly.",
            "Payment providers, to process and reconcile payments and refunds.",
            "AI providers, to generate cake designs from your descriptions — see section 5.",
            "Cloud hosting and storage providers who run our infrastructure.",
            "Government authorities, where we are required by law to disclose information.",
          ]}
        />
        <p>
          We do not sell your personal data, and we do not share it with advertisers for their own
          purposes.
        </p>
      </Section>

      <Section n={5} title="AI processing of your prompts">
        <p>
          When you describe a cake in the Studio, that description — and any reference image you
          upload — is sent to third-party AI providers to produce a design. Those providers process
          it on our behalf under their own terms, and some are located outside India.
        </p>
        <Callout>
          Please do not include personal, confidential or sensitive information in a cake
          description. Names and occasions are fine and are the point; identification numbers,
          financial details or health information are not.
        </Callout>
      </Section>

      <Section n={6} title="Designs you share publicly">
        <p>
          A design is private by default. If you choose to share it to the community gallery, the
          image and its description become visible to anyone who visits the gallery. We do not
          display your name or contact details alongside it.
        </p>
        <p>You can make a shared design private again at any time from the Studio.</p>
      </Section>

      <Section n={7} title="How long we keep it">
        <List
          items={[
            "Order and invoice records: as long as tax and accounting law requires, currently eight years.",
            "Account details: while your account is active, and for a reasonable period afterwards to handle disputes.",
            "Cake designs: until you delete them or close your account.",
            "Server and access logs: typically 90 days.",
          ]}
        />
      </Section>

      <Section n={8} title="How we protect it">
        <p>
          Data is transmitted over encrypted connections and stored on access-controlled
          infrastructure. Passwords, where used, are stored hashed and never in readable form. Access
          is limited to staff who need it for their work.
        </p>
        <p>
          No system is perfectly secure. If a breach affects your personal data, we will notify you
          and the relevant authority as the law requires.
        </p>
      </Section>

      <Section n={9} title="Your rights">
        <List
          items={[
            "Ask for a copy of the personal data we hold about you.",
            "Ask us to correct data that is wrong or incomplete.",
            "Ask us to delete your data, where we are not required to keep it.",
            "Withdraw consent for anything you consented to, including marketing.",
            "Nominate someone to exercise your rights if you are unable to.",
            "Complain to the Data Protection Board of India.",
          ]}
        />
        <p>
          To exercise any of these, email{" "}
          <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
            {ENTITY.supportEmail}
          </a>
          . We will respond within 30 days.
        </p>
      </Section>

      <Section n={10} title="Children">
        <p>
          CrossFriend is not intended for anyone under 18, and we do not knowingly collect data from
          children. If you believe a child has provided us with personal data, contact us and we will
          delete it.
        </p>
      </Section>

      <Section n={11} title="Cookies">
        <p>
          We use cookies that are necessary for the site to work — keeping you signed in, remembering
          your cart and your region. Blocking these will break checkout. We also use basic analytics
          to understand which pages are used; you can block those in your browser without affecting
          your ability to order.
        </p>
      </Section>

      <Section n={12} title="Grievance Officer">
        <p>
          {ENTITY.grievanceOfficer.name}
          <br />
          {ENTITY.legalName}
          <br />
          {ENTITY.address}
          <br />
          <a href={`mailto:${ENTITY.grievanceOfficer.email}`} className="text-cf-orange underline">
            {ENTITY.grievanceOfficer.email}
          </a>
        </p>
      </Section>
    </LegalShell>
  )
}
