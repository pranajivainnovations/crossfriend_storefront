import type { Metadata } from "next"

import { ENTITY } from "@lib/constants/legal"
import { Callout, LegalShell, List, Section } from "@modules/legal/components/legal-shell"

export const metadata: Metadata = {
  alternates: { canonical: "/food-safety" },
  title: "Food Safety & Allergens",
  description:
    "Allergen information on CrossFriend, how it is collected, and important limitations if you or someone you are ordering for has a food allergy.",
}

export default function FoodSafetyPage() {
  return (
    <LegalShell
      title="Food Safety & Allergens"
      summary="Every listing must declare its ingredients and allergens before it can go on sale. Please read the limits below carefully if you are ordering for someone with a severe allergy."
    >
      <Section n={1} title="Read this first">
        <Callout>
          <strong>
            CrossFriend cannot guarantee that any product is free from a given allergen.
          </strong>{" "}
          Bakers work in kitchens where nuts, dairy, eggs, wheat and soy are handled on shared
          surfaces and equipment. Traces can transfer even when an ingredient is not in a recipe.
          <br />
          <br />
          If you or the person you are ordering for has a severe allergy or anaphylaxis, please
          contact us before ordering so we can put you in touch with the baker directly.
        </Callout>
      </Section>

      <Section n={2} title="Who is responsible for the food">
        <p>
          CrossFriend is a marketplace. The baker who prepares your order is the food business
          operator for it. They are responsible for:
        </p>
        <List
          items={[
            "holding a valid FSSAI registration or licence for their kitchen",
            "the hygiene and safety of their premises, equipment and staff",
            "the accuracy of the ingredients and allergens declared on their listings",
            "complying with the Food Safety and Standards Act, 2006 and the rules made under it",
          ]}
        />
        <p>
          CrossFriend is responsible for requiring that information, refusing to publish a listing
          without it, and acting on it when something goes wrong.
        </p>
      </Section>

      <Section n={3} title="How allergen information gets onto a listing">
        <p>
          A baker cannot publish a product on CrossFriend until they have declared what is in it. The
          platform blocks publication of any listing without ingredient and allergen information —
          this is enforced by the system, not by a reminder.
        </p>
        <p>Bakers declare against the common allergens:</p>
        <List
          items={[
            "Milk and dairy",
            "Eggs",
            "Tree nuts",
            "Peanuts",
            "Wheat and gluten",
            "Soy",
            "Sesame",
          ]}
        />
        <p>
          They can also add anything else a customer should know about, and note where a product
          contains no common allergens.
        </p>
        <Callout>
          This information comes from the baker. We require it, we display it, and we act if it is
          wrong — but we do not independently laboratory-test products.
        </Callout>
      </Section>

      <Section n={4} title="Cross-contamination">
        <p>
          Most bakeries on CrossFriend are small kitchens where the same oven, mixer, work surface
          and piping equipment are used for many products across a day.
        </p>
        <p>
          A product declared &ldquo;eggless&rdquo; means the recipe contains no egg. It does not mean
          the kitchen is egg-free. The same applies to nuts, dairy and gluten.
        </p>
      </Section>

      <Section n={5} title="If you have a serious allergy">
        <List
          items={[
            "Read the ingredients on the listing before ordering, every time — recipes change.",
            "Contact us at " + ENTITY.supportEmail + " and we will connect you with the baker to discuss their kitchen directly.",
            "Consider ordering from bakers who state that they operate a dedicated allergen-free process.",
            "Do not rely on a cake message, a note at checkout, or a phone call to the delivery partner to communicate an allergy. Tell us before you order.",
          ]}
        />
      </Section>

      <Section n={6} title="Storage and consumption">
        <p>
          Cakes are made fresh without commercial preservatives. Unless the baker says otherwise:
        </p>
        <List
          items={[
            "Refrigerate cream, mousse and cheesecake products immediately, and eat them the same day.",
            "Keep fondant cakes cool and dry rather than refrigerated uncovered.",
            "Consume within the time the baker specifies on the product.",
            "Do not eat anything that smells, looks or tastes wrong — contact us instead.",
          ]}
        />
      </Section>

      <Section n={7} title="Reporting a food safety concern">
        <p>
          Tell us immediately at{" "}
          <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
            {ENTITY.supportEmail}
          </a>{" "}
          or {ENTITY.supportPhone}. Please keep the product and its packaging, and photograph them if
          you can.
        </p>
        <p>
          We treat food safety reports as our highest priority. We investigate with the baker, and we
          suspend a baker from the platform while a serious concern is being investigated.
        </p>
        <Callout>
          If someone is having an allergic reaction, seek medical help first. Report it to us
          afterwards.
        </Callout>
        <p className="text-grey-50">
          You may also report a food safety concern to the Food Safety and Standards Authority of
          India (FSSAI) through the Food Safety Connect app or their national helpline.
        </p>
      </Section>
    </LegalShell>
  )
}
