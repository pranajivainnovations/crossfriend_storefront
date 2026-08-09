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
  /** The company behind CrossFriend. The brand is CrossFriend; the seller of record is this. */
  legalName: "Pranajiva Innovations (OPC) Private Limited",
  brand: "CrossFriend",
  address: "Gaur Global Village, Crossings Republik, Ghaziabad, Uttar Pradesh 201016, India",
  gst: LEGAL_PENDING,
  cin: LEGAL_PENDING,
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
 * One date for all documents. They were written together and are consistent with each other, so
 * dating them separately would imply a revision history that does not exist.
 */
export const LEGAL_LAST_UPDATED = "9 August 2026"

export const LEGAL_PAGES = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refunds & Cancellations" },
  { href: "/shipping-policy", label: "Shipping & Delivery" },
  { href: "/food-safety", label: "Food Safety & Allergens" },
  { href: "/seller-terms", label: "Baker Terms" },
] as const
