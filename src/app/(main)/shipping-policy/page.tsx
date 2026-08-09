import type { Metadata } from "next"
import Link from "next/link"

import { ENTITY } from "@lib/constants/legal"
import { Callout, LegalShell, List, Section } from "@modules/legal/components/legal-shell"

export const metadata: Metadata = {
  title: "Shipping & Delivery | CrossFriend",
  description:
    "Where CrossFriend delivers, how long orders take, same-day cut-offs, and what happens if a delivery cannot be completed.",
}

export default function ShippingPage() {
  return (
    <LegalShell
      title="Shipping & Delivery"
      summary="We deliver from local bakers to serviceable pincodes near them. Preparation time is set by the baker and shown on every product before you order."
    >
      <Section n={1} title="Where we deliver">
        <p>
          CrossFriend is a local marketplace. Each baker serves the areas around their kitchen, so
          what you can order depends on your pincode.
        </p>
        <List
          items={[
            "Enter your delivery pincode before checkout to see what is available to you.",
            "If a pincode is not yet served, no baker near you has been onboarded — we are adding bakeries continually.",
            "We do not ship cakes across cities. Fresh cream, fondant and fresh fruit do not survive long transit, and we would rather not serve an area than serve it badly.",
          ]}
        />
      </Section>

      <Section n={2} title="How long it takes">
        <p>
          Every product shows the baker&apos;s preparation time before you order — from{" "}
          <em>immediate</em> for something already made, through <em>4–8 hours</em>, to several days
          for elaborate custom work.
        </p>
        <Callout>
          Preparation time is set by the baker who makes your cake, not by CrossFriend. Choose your
          delivery date with that time in mind — a design with sugar work or multiple tiers needs
          longer than a standard cake.
        </Callout>
        <List
          items={[
            "Same-day delivery is available where a baker has capacity and you order before their cut-off. The cut-off is shown at checkout.",
            "You can choose a delivery date and a time slot at checkout.",
            "Festival periods and weekends fill up. Order early for Diwali, Raksha Bandhan, Valentine's Day and New Year.",
          ]}
        />
      </Section>

      <Section n={3} title="Delivery charges">
        <p>
          Any delivery charge is calculated from your pincode and shown before you pay. There are no
          charges added after checkout.
        </p>
      </Section>

      <Section n={4} title="On the day">
        <List
          items={[
            "Keep the delivery number reachable. Our delivery partner will call on arrival.",
            "For gift deliveries, give us the recipient's name and number — we will contact them, not you, on arrival.",
            "Somebody must be available to receive the order. We cannot leave a cake unattended at a door, in a lobby or with a neighbour without your instruction.",
            "Please check the order at the door where you can.",
          ]}
        />
      </Section>

      <Section n={5} title="If a delivery cannot be completed">
        <p>
          Our partner will attempt to contact you and wait a short time. If we cannot reach you, or
          the address is wrong or inaccessible, the delivery fails.
        </p>
        <Callout>
          <strong>A failed delivery caused by a wrong address or an unreachable number cannot be
          refunded.</strong> Perishable food cannot be stored and redelivered later. Please check the
          address and phone number carefully before you pay.
        </Callout>
        <p>
          Where a delivery fails for a reason on our side or the baker&apos;s, you get a full refund
          under the{" "}
          <Link href="/refund-policy" className="text-cf-orange underline">
            Refunds &amp; Cancellations policy
          </Link>
          .
        </p>
      </Section>

      <Section n={6} title="Delays outside our control">
        <p>
          Heavy rain, flooding, traffic restrictions, strikes, civil disturbance and similar events
          can delay deliveries. We will keep you informed and, where an order can no longer be useful
          to you, refund it.
        </p>
      </Section>

      <Section n={7} title="When it arrives">
        <List
          items={[
            "Cream and cheesecake-based cakes should be refrigerated immediately and eaten the same day.",
            "Fondant cakes should be kept cool and dry, and not refrigerated uncovered.",
            "Cakes are transported flat and upright. Keep them level when you carry them.",
            "Any specific storage advice from the baker is shown on the product page.",
          ]}
        />
      </Section>

      <Section n={8} title="Questions">
        <p>
          Contact{" "}
          <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
            {ENTITY.supportEmail}
          </a>{" "}
          or call {ENTITY.supportPhone} with your order number.
        </p>
      </Section>
    </LegalShell>
  )
}
