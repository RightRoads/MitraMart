import { rupees } from "./api.js";

/** URL slug ⇄ DB subtype, plus the labels and sort options each one needs. */
export const SUBTYPES = {
  insurance: {
    subtype: "insurance",
    label: "Insurance",
    plural: "Insurance plans",
    icon: "🛡️",
    blurb: "Compare health, life and motor cover from leading insurers.",
    sorts: [
      ["premium_asc", "Premium: Low to High"],
      ["coverage_desc", "Cover: High to Low"],
      ["rating", "Top rated"],
    ],
  },
  loans: {
    subtype: "loan",
    label: "Loans",
    plural: "Loans",
    icon: "💰",
    blurb: "Personal, home, car, education and business loans from banks and NBFCs.",
    sorts: [
      ["rate_asc", "Interest rate: Low to High"],
      ["rating", "Top rated"],
    ],
  },
  "credit-cards": {
    subtype: "credit_card",
    label: "Credit Cards",
    plural: "Credit cards",
    icon: "💳",
    blurb: "Cashback, travel and premium cards — compare fees and rewards.",
    sorts: [
      ["fee_asc", "Annual fee: Low to High"],
      ["rating", "Top rated"],
    ],
  },
};

/** DB subtype → the URL slug used by /finance/:slug. */
export const SUBTYPE_PATH = {
  insurance: "insurance",
  loan: "loans",
  credit_card: "credit-cards",
};

/** Compact Indian-style money: ₹1.5 Cr, ₹40 L, ₹2,500. */
export function shortRupees(cents) {
  if (cents == null) return "—";
  const r = Number(cents) / 100;
  if (r >= 10000000) return `₹${trim(r / 10000000)} Cr`;
  if (r >= 100000) return `₹${trim(r / 100000)} L`;
  return rupees(cents);
}

function trim(n) {
  return Number(n.toFixed(2)).toString();
}

/** Render one comparison cell according to the format the API declared. */
export function formatValue(value, format) {
  if (value == null) return "—";
  switch (format) {
    case "money":
      return shortRupees(value);
    case "percent":
      return `${Number(value)}%`;
    case "months": {
      const m = Number(value);
      return m % 12 === 0 ? `${m / 12} yr` : `${m} mo`;
    }
    case "years":
      return `${value} yr`;
    default:
      return String(value);
  }
}

/** The one-line headline shown on a product card, which differs per subtype. */
export function headline(product) {
  switch (product.subtype) {
    case "loan":
      return product.interest_rate_min != null
        ? { value: `${Number(product.interest_rate_min)}% p.a.`, label: "Interest from" }
        : { value: "—", label: "Interest" };
    case "credit_card":
      return Number(product.annual_fee_cents) === 0
        ? { value: "Lifetime free", label: "Annual fee" }
        : { value: shortRupees(product.annual_fee_cents), label: "Annual fee" };
    case "insurance":
      return { value: `${shortRupees(product.premium_from_cents)}/yr`, label: "Premium from" };
    default:
      return { value: rupees(product.price_cents), label: "" };
  }
}

/** The secondary line under the headline. */
export function subline(product) {
  switch (product.subtype) {
    case "loan":
      return product.amount_max_cents ? `Up to ${shortRupees(product.amount_max_cents)}` : "";
    case "credit_card":
      return product.min_credit_score ? `Credit score ${product.min_credit_score}+` : "";
    case "insurance":
      return product.coverage_cents ? `Cover ${shortRupees(product.coverage_cents)}` : "";
    default:
      return "";
  }
}
