/**
 * Entity and contact details used across every legal page.
 *
 * Defined once because these appear in six documents, and a phone number that is right in five of
 * them is worse than one that is wrong in all six — nobody notices the inconsistency until a
 * customer quotes the wrong page back at you.
 *
 * GST and CIN are placeholders pending registration. They are rendered as an explicit "to be
 * updated" line rather than silently omitted: a policy page that simply has no GST number looks
 * complete, so nobody remembers to add it. Search for LEGAL_PENDING to find every occurrence.
 */

export const LEGAL_PENDING = "To be updated"

export const ENTITY = {
  /**
   * The company behind CrossFriend. The brand is CrossFriend; the seller of record is this.
   *
   * Spelled exactly as the Certificate of Incorporation spells it, in the same case. That is not
   * fussiness: DLT operators, payment gateways and the MCA register all compare this string
   * literally, and "Pranajiva Innovations Private (OPC) Limited" - which is how it is easy to
   * mistype - matches nothing. Every surface renders from this constant so the spelling cannot
   * drift between pages.
   */
  legalName: "PRANAJIVA INNOVATIONS (OPC) PRIVATE LIMITED",
  brand: "CrossFriend",
  /**
   * The registered office, minus the flat number.
   *
   * The MCA record reads "D 1533, GAUR GLOBAL VILLAGE, Crossing Republik, Ghaziabad, Ghaziabad-
   * 201016, Uttar Pradesh". The unit number is deliberately omitted here because the registered
   * office is a home; everything else matches the record exactly, including "Crossing Republik"
   * singular, which this file previously had wrong as "Crossings".
   *
   * Understand the trade before changing it back or trimming further: Companies Act 2013 s.12(3)(c)
   * and the Consumer Protection (E-Commerce) Rules 2020 both require the registered office address
   * on the site, and a verifier comparing this against the MCA record will see a partial match.
   * That was an informed decision, not an oversight.
   */
  address: "Gaur Global Village, Crossing Republik, Ghaziabad, Uttar Pradesh 201016, India",
  /** As issued 27 March 2026. The state code really is UW, not UP - checked against the COI. */
  cin: "U21003UW2026OPC251001",
  incorporatedOn: "27 March 2026",
  gst: LEGAL_PENDING,
  supportEmail: "support@crossfriend.in",
  supportPhone: "+91 98211 01868",
  website: "crossfriend.in",
  /** Required under the Information Technology (Intermediary Guidelines) Rules, 2021. */
  grievanceOfficer: {
    name: "Pranajiva Director",
    email: "director@crossfriend.in",
  },
  jurisdiction: "Ghaziabad, Uttar Pradesh",
} as const

/**
 * Public profiles that belong to CrossFriend, emitted as `sameAs` on the Organization.
 *
 * `sameAs` is how a search or answer engine confirms that the CrossFriend on this site, the one on
 * Instagram, and the one in a Google Business Profile are a single entity rather than three
 * similarly-named businesses. Without it each mention is orphaned and none of them accumulate to
 * the same brand.
 *
 * Empty for now, and emitted only when non-empty — an Organization with `sameAs: []` asserts
 * "this brand exists nowhere else", which is worse than saying nothing. Add the real URLs
 * (Instagram, Facebook, LinkedIn, YouTube, and the Google Business Profile / Maps share link) and
 * they flow into the markup with no further change.
 */
export const SOCIAL_PROFILES: string[] = []

/**
 * One date for all documents. They were written together and are consistent with each other, so
 * dating them separately would imply a revision history that does not exist.
 */
export const LEGAL_LAST_UPDATED = "9 August 2026"

export const LEGAL_PAGES = [
  // About and Contact lead, ahead of the policies. They are the two a person actually looks for,
  // and the two that answer "who is behind this site" — which is the question a customer, a
  // verifier and an answer engine all arrive with. Burying them under six policy documents would
  // make the site look like it has policies but no operator.
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refunds & Cancellations" },
  { href: "/shipping-policy", label: "Shipping & Delivery" },
  { href: "/food-safety", label: "Food Safety & Allergens" },
  { href: "/seller-terms", label: "Baker Terms" },
] as const
