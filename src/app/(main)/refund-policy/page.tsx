import type { Metadata } from "next"
import Link from "next/link"

import { ENTITY } from "@lib/constants/legal"
import { Callout, LegalShell, List, Section } from "@modules/legal/components/legal-shell"

export const metadata: Metadata = {
  title: "Refunds & Cancellations | CrossFriend",
  description:
    "How to cancel a CrossFriend order, when you get a refund, and what to do if a cake arrives damaged, late or wrong. Written for freshly made, perishable food.",
}

export default function RefundPage() {
  return (
    <LegalShell
      title="Refunds & Cancellations"
      summary="Cakes are made fresh to order, so cancellation depends on whether baking has started. If something arrives damaged, wrong or late, send us a photo within 24 hours and we will put it right."
    >
      <Section n={1} title="Why food is different">
        <p>
          Everything on CrossFriend is prepared after you order it, and most of it is perishable.
          Once a baker has started your cake, the ingredients and their time cannot be recovered, and
          a returned cake cannot be resold or safely reused.
        </p>
        <Callout>
          For hygiene and food-safety reasons we cannot accept returns of food. That does not reduce
          your rights where an order is defective, unsafe or not what you ordered — those are covered
          in section 4.
        </Callout>
      </Section>

      <Section n={2} title="Cancelling an order">
        <p>Cancellation is tied to how far the baker has got, not to a fixed clock:</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base-regular">
            <thead>
              <tr className="border-b border-grey-20 text-left">
                <th className="py-2 pr-4 font-semibold text-grey-90">When you cancel</th>
                <th className="py-2 font-semibold text-grey-90">What you get back</th>
              </tr>
            </thead>
            <tbody className="text-grey-70">
              <tr className="border-b border-grey-10">
                <td className="py-2.5 pr-4">Before the baker accepts the order</td>
                <td className="py-2.5 font-medium text-grey-90">Full refund</td>
              </tr>
              <tr className="border-b border-grey-10">
                <td className="py-2.5 pr-4">After acceptance, before preparation starts</td>
                <td className="py-2.5 font-medium text-grey-90">Full refund</td>
              </tr>
              <tr className="border-b border-grey-10">
                <td className="py-2.5 pr-4">After preparation has started</td>
                <td className="py-2.5">Partial refund, depending on what has been used</td>
              </tr>
              <tr className="border-b border-grey-10">
                <td className="py-2.5 pr-4">Once the order is out for delivery</td>
                <td className="py-2.5">No refund, except under section 4</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Custom and personalised cakes — anything with a name, photo, or a design made in the AI
          Cake Studio — move to &ldquo;preparation started&rdquo; sooner, because a baker begins
          sourcing and preparing specifically for you. Cancel these as early as you can.
        </p>
        <p>
          To cancel, contact us at{" "}
          <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
            {ENTITY.supportEmail}
          </a>{" "}
          or {ENTITY.supportPhone} with your order number.
        </p>
      </Section>

      <Section n={3} title="If we or the baker cancel">
        <p>
          Occasionally a baker cannot fulfil an order — illness, an equipment failure, or an
          ingredient they cannot source. If that happens we will tell you as soon as we know, offer
          an alternative where we can, and refund you in full if you would rather not proceed.
        </p>
        <p>
          If we cannot deliver to your address on the date you chose, you get a full refund.
        </p>
      </Section>

      <Section n={4} title="If something is wrong with your order">
        <p>You are entitled to a refund or a replacement if your order:</p>
        <List
          items={[
            "arrives damaged, spoiled or unsafe to eat",
            "is materially different from what you ordered — wrong flavour, wrong size, wrong design",
            "is missing items you paid for",
            "arrives significantly outside the agreed delivery window",
            "does not match the allergen or ingredient information shown on the listing",
          ]}
        />
        <Callout>
          <strong>Tell us within 24 hours of delivery and include photographs.</strong> Photos of the
          cake and its packaging are what let us resolve a claim quickly and fairly with the baker.
          Please keep the item until the claim is settled.
        </Callout>
        <p>
          Handmade food varies. Minor differences in shade, piping or finish from the listing
          photograph are normal and are not on their own grounds for a refund. A design that is
          clearly not what you ordered is.
        </p>
      </Section>

      <Section n={5} title="AI Cake Studio designs">
        <p>
          A generated image is a design concept, not a photograph of the finished cake. A baker works
          in sugar, sponge and buttercream, and reproduces the design as closely as those materials
          allow.
        </p>
        <List
          items={[
            "A reasonable interpretation of your design is not grounds for a refund.",
            "A cake that ignores the design — wrong theme, wrong colours, wrong concept — is.",
            "If a baker decides a design cannot be made after you have ordered, you get a full refund.",
          ]}
        />
      </Section>

      <Section n={6} title="Failed deliveries">
        <p>
          If nobody is available at the address, or the address or contact number is wrong, our
          delivery partner will attempt to contact you and will wait a short time. Where delivery
          fails for a reason within your control, the order cannot be refunded — perishable food
          cannot be redelivered later. Please check the address and number before you pay. See the{" "}
          <Link href="/shipping-policy" className="text-cf-orange underline">
            Shipping &amp; Delivery policy
          </Link>
          .
        </p>
      </Section>

      <Section n={7} title="How refunds are paid">
        <List
          items={[
            "Refunds go back to the original payment method. We cannot redirect a refund to a different account.",
            "We initiate refunds within 3 working days of approving a claim.",
            "Your bank or card issuer then takes 5–7 working days to credit it. That part is outside our control.",
            "Cash-on-delivery orders are refunded by bank transfer or UPI to details you provide.",
          ]}
        />
      </Section>

      <Section n={8} title="Raising a complaint">
        <p>
          Contact{" "}
          <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
            {ENTITY.supportEmail}
          </a>{" "}
          first — most issues are settled quickly. If you are not satisfied, escalate to our
          Grievance Officer, {ENTITY.grievanceOfficer.name}, at{" "}
          <a href={`mailto:${ENTITY.grievanceOfficer.email}`} className="text-cf-orange underline">
            {ENTITY.grievanceOfficer.email}
          </a>
          . We acknowledge within 48 hours and resolve within 30 days.
        </p>
        <p className="text-grey-50">
          Nothing here limits your rights under the Consumer Protection Act, 2019.
        </p>
      </Section>
    </LegalShell>
  )
}
