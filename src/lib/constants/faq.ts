/**
 * FAQ content, written for answer engines as much as for people.
 *
 * Two rules govern everything here:
 *
 * 1. **Every answer must be true of the system as it exists.** FAQPage markup is quoted verbatim by
 *    AI answers and search snippets, so a wrong answer here is repeated by a machine to people who
 *    never visit the site and cannot see it corrected. Where a fact was not verifiable in the code
 *    or database, the question was dropped rather than answered vaguely.
 * 2. **Specific beats fluent.** "0.5 kg to 5 kg, 1 to 4 tiers, 9 flavours" is extractable and
 *    citable. "A wide range of delicious options" is not. The numbers below were read from
 *    pricing.attribute_values, not estimated.
 *
 * These must also be RENDERED on the page. FAQPage structured data describing content a visitor
 * cannot see is invalid markup, not a shortcut.
 */

export interface FaqEntry {
  question: string
  answer: string
}

export const STUDIO_FAQ: FaqEntry[] = [
  {
    question: "What is the CrossFriend AI Cake Studio?",
    answer:
      "It is a free design tool. Describe the cake you want — the occasion, flavour, style, shape and number of tiers — and the Studio generates a cake design image for you. You can browse designs other people have made, start from one of their prompts, or write your own.",
  },
  {
    question: "Does it cost anything to design a cake?",
    answer:
      "No. Designing a cake in the Studio is free. You only pay if you decide to order one, and the price is shown before you check out.",
  },
  {
    question: "What can I customise?",
    answer:
      "Weight from 0.5 kg to 5 kg, one to four tiers, four shapes (round, square, heart and oval), and nine flavours including chocolate, red velvet, butterscotch, mango, strawberry, blueberry, lemon and salted caramel. Styles range from minimal and realistic to cartoon, kids, luxury, wedding and 3D sculpted.",
  },
  {
    question: "How much does a custom cake cost?",
    answer:
      "The price depends on weight, number of tiers, flavour, the extras you choose and your delivery pincode. The Studio shows a live estimate as you design, so you see the price before you commit to anything.",
  },
  {
    question: "Can a real baker actually make the design?",
    answer:
      "The design is a reference for the baker, not a photograph of a finished cake. AI images sometimes include detail that is difficult or impossible to reproduce in sugar, so treat the image as a clear brief for what you want rather than an exact promise of what will arrive.",
  },
  {
    question: "Which areas do you deliver to?",
    answer:
      "CrossFriend delivers where a partner baker serves your pincode. Enter your pincode in the Studio to see whether we currently cover your area and what the delivery charge is. Coverage expands as more bakers join.",
  },
  {
    question: "Can I get midnight or same-day delivery?",
    answer:
      "Midnight delivery and express delivery are available where the baker making your cake offers them, and are priced as add-ons shown before checkout. Same-day delivery depends on the baker having capacity and on you ordering before their cut-off.",
  },
  {
    question: "Can I put a message or a photo on the cake?",
    answer:
      "Yes. A message on the cake and a printed photo on the cake are both available as options, priced and shown while you design.",
  },
  {
    question: "How long does a custom cake take?",
    answer:
      "Preparation time is set by the baker who makes it, and a design with sugar work or several tiers needs more notice than a simple one. Choose your delivery date with that in mind — the available dates shown at checkout already reflect what the baker can do.",
  },
]

export const BAKERS_FAQ: FaqEntry[] = [
  {
    question: "Who makes the cakes sold on CrossFriend?",
    answer:
      "Independent local bakeries. CrossFriend is a marketplace: the baker prepares the food, holds the food licence for it, and is responsible for its quality, safety and ingredients. CrossFriend runs the platform, takes the payment and supports the order.",
  },
  {
    question: "Are the bakers verified?",
    answer:
      "Bakeries are reviewed before they can list. Verified bakeries carry a trust badge, and a blue tick marks those that have met an additional standard. Every listed product must declare its ingredients and allergens before it can go live.",
  },
  {
    question: "How does a bakery join CrossFriend?",
    answer:
      "Bakeries are invited by the CrossFriend team, area by area, as we open new pincodes. An invited bakery gets its own portal to manage its profile, products, photos and prices. If you run a bakery and want to be considered, contact support@crossfriend.in.",
  },
  {
    question: "Where does CrossFriend operate?",
    answer:
      "CrossFriend is operated from Ghaziabad, Uttar Pradesh, and serves the pincodes where partner bakeries deliver. Coverage is opened one area at a time so that every listed bakery can genuinely reach the customers who see it.",
  },
]

/**
 * Cake size calculator page.
 *
 * These answers restate the same portion conventions the calculator computes with, so the tool and
 * the structured data can never drift apart in a way a reader would notice. They are conventions,
 * not measurements from our own orders, and each answer says so rather than implying precision we
 * do not have.
 */
export const CAKE_SIZE_FAQ: FaqEntry[] = [
  {
    question: "How much cake do I need for 20 people?",
    answer:
      "For a celebration slice cut after the candles, allow about 75 g per person — roughly 1.5 kg for 20 people. If the cake is the dessert course, allow about 125 g per person, which is about 2.5 kg for 20. A square cake of the same weight serves around 25% more people than a round one, because it cuts into clean rectangles with no curved edge pieces.",
  },
  {
    question: "How many people does a 1 kg cake serve?",
    answer:
      "A 1 kg cake serves about 8 people as a dessert portion, or about 13 as a celebration slice cut after the candles. The same 1 kg in a square shape stretches further — closer to 16 celebration slices — because there is no waste at the edges.",
  },
  {
    question: "Does the shape of the cake change how many people it serves?",
    answer:
      "Yes, and it is the most commonly missed factor. A square or rectangular cake cuts into even rectangles with nothing left over, while a round cake of the same weight loses servings to curved edge pieces. The usual convention is that a square yields around 25% more servings than a round cake of identical weight.",
  },
  {
    question: "Do tiered cakes serve more people per kilogram?",
    answer:
      "Slightly, because guests take a smaller slice from a tall tiered cake than from a single round one. Allow roughly 8% more servings per kilogram for a two-tier cake and around 15% more for three tiers or higher. Tiers are usually chosen for how the cake looks rather than for the number of servings.",
  },
  {
    question: "How long can a cream cake stay out of the fridge in Delhi?",
    answer:
      "In Delhi NCR summer heat, a fresh cream or whipped cream cake should not sit out of refrigeration for more than about two hours, and less on the hottest days. Fondant and ganache finishes hold their shape far better in heat, which is why they are the usual choice for outdoor functions and long parties.",
  },
  {
    question: "Should I order extra cake?",
    answer:
      "If the headcount is not final, or you want people to take a piece home, add about 20% to the calculated weight. Bakers sell in half-kilogram steps, so the practical choice is usually to round up to the next half kilo.",
  },
]

/**
 * Two more for the size calculator, kept separate because they answer questions people type
 * verbatim into a search box rather than questions about our own service. Both are arithmetic or
 * well-established food science, not house opinion — see CAKE_FACTS in the calculator page for the
 * rest of the set and the reasoning about what was left out.
 */
export const CAKE_SIZE_EXTRA_FAQ: FaqEntry[] = [
  {
    question: "Is a 12 inch cake twice as big as a 6 inch cake?",
    answer:
      "No — it is four times as big. A round cake's area grows with the square of its radius, so doubling the diameter quadruples the amount of cake. An 8 inch round holds about 1.8 times as much as a 6 inch, and a 10 inch holds about 2.8 times as much. This is the single most common mistake when sizing a cake by inches rather than by weight.",
  },
  {
    question: "Should I keep cake in the fridge?",
    answer:
      "Refrigerate it for the frosting's safety, not for the cake's freshness. Fresh cream, custard and cheese-based frostings must be kept cold. But sponge goes stale fastest at fridge temperature — starch retrogradation runs quickest just above freezing — so a plain or fondant-covered cake keeps better in a sealed box at room temperature. If you need to store cake for more than a couple of days, freezing is better than refrigerating, because it skips past the temperature range where staling is quickest.",
  },
]
