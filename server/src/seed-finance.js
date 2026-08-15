/**
 * Seed data for financial products (insurance, loans, credit cards).
 *
 * IMPORTANT: rates, fees and premiums below are ILLUSTRATIVE DEMO DATA modelled on
 * publicly advertised ranges. They are not live rate cards and must be replaced with
 * the real figures from each provider agreement before this is shown to customers.
 *
 * Money is written in rupees here and converted to paise on insert.
 */

export const financeCategories = [
  { name: "Insurance", slug: "insurance", kind: "financial", icon: "🛡️" },
  { name: "Loans", slug: "loans", kind: "financial", icon: "💰" },
  { name: "Credit Cards", slug: "credit-cards", kind: "financial", icon: "💳" },
];

export const providers = [
  { name: "HDFC Bank", slug: "hdfc-bank", kind: "bank" },
  { name: "ICICI Bank", slug: "icici-bank", kind: "bank" },
  { name: "State Bank of India", slug: "sbi", kind: "bank" },
  { name: "Axis Bank", slug: "axis-bank", kind: "bank" },
  { name: "Bajaj Finserv", slug: "bajaj-finserv", kind: "nbfc" },
  { name: "LIC of India", slug: "lic", kind: "insurer" },
  { name: "Star Health Insurance", slug: "star-health", kind: "insurer" },
  { name: "HDFC ERGO", slug: "hdfc-ergo", kind: "insurer" },
  { name: "HDFC Life", slug: "hdfc-life", kind: "insurer" },
  { name: "ICICI Lombard", slug: "icici-lombard", kind: "insurer" },
];

/**
 * Each entry: catalog fields + the financial_products row.
 * `price` is the indicative headline cost shown on cards (annual fee / starting premium);
 * loans have no meaningful single price so they use 0.
 */
export const financialProducts = [
  // ----------------------------- Loans -----------------------------
  {
    name: "HDFC Personal Loan",
    category: "loans",
    provider: "hdfc-bank",
    subtype: "loan",
    description:
      "Unsecured personal loan for weddings, travel, medical costs or debt consolidation, with no collateral and quick disbursal.",
    price: 0,
    rating: 4.4,
    interest_rate_min: 10.5, interest_rate_max: 21.0,
    tenure_min_months: 12, tenure_max_months: 60,
    amount_min: 50000, amount_max: 4000000,
    processing_fee_pct: 2.5,
    min_age: 21, max_age: 60, min_income: 300000, min_credit_score: 720,
    commission_pct: 1.5,
    key_benefits: [
      "Disbursal in as little as 24 hours",
      "No collateral or guarantor required",
      "Part-prepayment allowed after 12 EMIs",
    ],
    exclusions: ["Not available to applicants with an active default on any loan"],
    features: { prepayment_charges_pct: 4, insta_approval: true },
  },
  {
    name: "SBI Home Loan",
    category: "loans",
    provider: "sbi",
    subtype: "loan",
    description:
      "Home loan for purchase, construction or renovation, with one of the lowest interest rates and no hidden charges.",
    price: 0,
    rating: 4.6,
    interest_rate_min: 8.5, interest_rate_max: 9.65,
    tenure_min_months: 60, tenure_max_months: 360,
    amount_min: 500000, amount_max: 50000000,
    processing_fee_pct: 0.35,
    min_age: 18, max_age: 70, min_income: 300000, min_credit_score: 700,
    commission_pct: 0.6,
    key_benefits: [
      "Interest calculated on daily reducing balance",
      "No prepayment penalty on floating rate loans",
      "Concession of 0.05% for women borrowers",
    ],
    exclusions: ["Property must have clear and marketable title"],
    features: { balance_transfer: true, overdraft_option: true },
  },
  {
    name: "ICICI Car Loan",
    category: "loans",
    provider: "icici-bank",
    subtype: "loan",
    description:
      "Finance up to 100% of the on-road price for new cars, with flexible repayment over up to 7 years.",
    price: 0,
    rating: 4.3,
    interest_rate_min: 9.1, interest_rate_max: 12.5,
    tenure_min_months: 12, tenure_max_months: 84,
    amount_min: 100000, amount_max: 10000000,
    processing_fee_pct: 1.0,
    min_age: 23, max_age: 65, min_income: 300000, min_credit_score: 720,
    commission_pct: 1.0,
    key_benefits: ["Up to 100% on-road funding", "Doorstep documentation", "Loan on used cars too"],
    exclusions: ["Commercial vehicle purchases are not covered"],
    features: { max_funding_pct: 100 },
  },
  {
    name: "Bajaj Finserv Business Loan",
    category: "loans",
    provider: "bajaj-finserv",
    subtype: "loan",
    description:
      "Collateral-free working capital for small businesses, with a flexi facility that lets you draw and repay as needed.",
    price: 0,
    rating: 4.1,
    interest_rate_min: 14.0, interest_rate_max: 26.0,
    tenure_min_months: 12, tenure_max_months: 48,
    amount_min: 100000, amount_max: 5000000,
    processing_fee_pct: 2.0,
    min_age: 24, max_age: 70, min_income: 600000, min_credit_score: 685,
    commission_pct: 2.0,
    key_benefits: ["Flexi loan — pay interest only on what you use", "Money in account in 48 hours"],
    exclusions: ["Business must be at least 3 years old with audited financials"],
    features: { flexi_facility: true, itr_required_years: 2 },
  },
  {
    name: "Axis Education Loan",
    category: "loans",
    provider: "axis-bank",
    subtype: "loan",
    description:
      "Funds tuition, living costs and travel for higher studies in India or abroad, with repayment starting after the course.",
    price: 0,
    rating: 4.2,
    interest_rate_min: 11.25, interest_rate_max: 14.5,
    tenure_min_months: 12, tenure_max_months: 180,
    amount_min: 50000, amount_max: 7500000,
    processing_fee_pct: 1.0,
    min_age: 18, max_age: 35, min_income: 250000, min_credit_score: 700,
    commission_pct: 1.0,
    key_benefits: [
      "Moratorium until 12 months after course completion",
      "Tax deduction on interest under Section 80E",
      "No collateral up to ₹7.5 lakh",
    ],
    exclusions: ["Course must be at a recognised institution"],
    features: { moratorium_months: 12, section_80e: true },
  },

  // -------------------------- Credit cards --------------------------
  {
    name: "HDFC Regalia Gold Credit Card",
    category: "credit-cards",
    provider: "hdfc-bank",
    subtype: "credit_card",
    description:
      "Premium travel and lifestyle card with airport lounge access, accelerated reward points and complimentary memberships.",
    price: 2500,
    rating: 4.5,
    interest_rate_min: 42.36, interest_rate_max: 42.36,
    joining_fee: 2500, annual_fee: 2500,
    min_age: 21, max_age: 60, min_income: 1200000, min_credit_score: 750,
    commission_pct: 2.0,
    key_benefits: [
      "12 complimentary domestic + 6 international lounge visits a year",
      "5X reward points at Myntra, Nykaa, Reliance Digital and Marks & Spencer",
      "Annual fee waived on spends of ₹4 lakh",
    ],
    exclusions: ["Reward points not earned on fuel, rent or wallet loads"],
    features: { reward_rate_per_150: 4, lounge_access: true, fee_waiver_spend: 400000, forex_markup_pct: 2 },
  },
  {
    name: "Amazon Pay ICICI Credit Card",
    category: "credit-cards",
    provider: "icici-bank",
    subtype: "credit_card",
    description:
      "Lifetime-free cashback card that returns up to 5% on Amazon and 1% everywhere else, credited straight to Amazon Pay balance.",
    price: 0,
    rating: 4.7,
    interest_rate_min: 42.0, interest_rate_max: 42.0,
    joining_fee: 0, annual_fee: 0,
    min_age: 18, max_age: 65, min_income: 300000, min_credit_score: 730,
    commission_pct: 2.5,
    key_benefits: [
      "5% back on Amazon for Prime members, 3% for others",
      "Lifetime free — no joining or annual fee",
      "1% back on all other spends, with no cap",
    ],
    exclusions: ["No cashback on EMI transactions, gold or gift cards"],
    features: { cashback_amazon_prime_pct: 5, cashback_others_pct: 1, lifetime_free: true, fuel_surcharge_waiver: true },
  },
  {
    name: "SBI Cashback Credit Card",
    category: "credit-cards",
    provider: "sbi",
    subtype: "credit_card",
    description:
      "Flat 5% cashback on every online spend with no merchant restrictions, auto-credited to your statement.",
    price: 999,
    rating: 4.4,
    interest_rate_min: 42.0, interest_rate_max: 42.0,
    joining_fee: 999, annual_fee: 999,
    min_age: 21, max_age: 65, min_income: 480000, min_credit_score: 740,
    commission_pct: 2.0,
    key_benefits: [
      "5% cashback on all online spends, capped at ₹5,000 a month",
      "1% cashback offline",
      "Annual fee reversed on spends of ₹2 lakh",
    ],
    exclusions: ["Rent, wallet loads, insurance and utilities excluded from 5% cashback"],
    features: { cashback_online_pct: 5, monthly_cashback_cap: 5000, fee_waiver_spend: 200000 },
  },
  {
    name: "Axis Bank Magnus Credit Card",
    category: "credit-cards",
    provider: "axis-bank",
    subtype: "credit_card",
    description:
      "Super-premium card with unlimited lounge access, a milestone travel voucher and concierge service for high spenders.",
    price: 12500,
    rating: 4.2,
    interest_rate_min: 42.58, interest_rate_max: 42.58,
    joining_fee: 12500, annual_fee: 12500,
    min_age: 21, max_age: 70, min_income: 1800000, min_credit_score: 750,
    commission_pct: 2.0,
    key_benefits: [
      "Unlimited domestic and international lounge access",
      "₹10,000 travel voucher on joining",
      "25 EDGE reward points per ₹200 on spends above ₹1.5 lakh a month",
    ],
    exclusions: ["Milestone benefits excluded on rent and government payments"],
    features: { lounge_access: true, unlimited_lounge: true, concierge: true, forex_markup_pct: 2 },
  },

  // ---------------------------- Insurance ----------------------------
  {
    name: "HDFC Life Click 2 Protect Super",
    category: "insurance",
    provider: "hdfc-life",
    subtype: "insurance",
    description:
      "Pure term life cover that pays your family a lump sum if something happens to you, at a low annual premium.",
    price: 9500,
    rating: 4.6,
    premium_from: 9500, coverage: 10000000, policy_term_years: 40,
    amount_min: 2500000, amount_max: 200000000,
    min_age: 18, max_age: 65, min_income: 300000,
    commission_pct: 15.0,
    key_benefits: [
      "Cover up to ₹20 crore with a term as long as 40 years",
      "Return of premium option available",
      "Premiums qualify for deduction under Section 80C",
    ],
    exclusions: ["Suicide within 12 months of policy start", "Death due to pre-existing undisclosed illness"],
    features: { claim_settlement_ratio: 99.5, riders: ["accidental death", "critical illness"], medical_test: true },
  },
  {
    name: "Star Health Family Health Optima",
    category: "insurance",
    provider: "star-health",
    subtype: "insurance",
    description:
      "Family floater health cover for hospitalisation, day-care procedures and pre/post hospitalisation expenses.",
    price: 11500,
    rating: 4.3,
    premium_from: 11500, coverage: 500000, policy_term_years: 1,
    amount_min: 300000, amount_max: 2500000,
    min_age: 18, max_age: 65,
    commission_pct: 12.5,
    key_benefits: [
      "One sum insured covers the whole family",
      "Cashless treatment at 14,000+ network hospitals",
      "Automatic restoration of sum insured after a claim",
    ],
    exclusions: [
      "Pre-existing diseases for the first 36 months",
      "Cosmetic and dental treatment unless from an accident",
    ],
    features: { network_hospitals: 14000, waiting_period_months: 36, room_rent_capped: false, no_claim_bonus_pct: 50 },
  },
  {
    name: "HDFC ERGO Optima Secure",
    category: "insurance",
    provider: "hdfc-ergo",
    subtype: "insurance",
    description:
      "Health plan that effectively multiplies your cover 4x from day one at no extra premium, with no room-rent limits.",
    price: 13400,
    rating: 4.5,
    premium_from: 13400, coverage: 1000000, policy_term_years: 1,
    amount_min: 500000, amount_max: 20000000,
    min_age: 18, max_age: 65,
    commission_pct: 12.5,
    key_benefits: [
      "4x cover from day one at no extra cost",
      "No sub-limits on room rent or treatment",
      "Covers consumables that most plans exclude",
    ],
    exclusions: ["Pre-existing diseases for the first 36 months", "Treatment outside India"],
    features: { network_hospitals: 13000, waiting_period_months: 36, consumables_covered: true, restore_benefit: true },
  },
  {
    name: "Star Health Senior Citizens Red Carpet",
    category: "insurance",
    provider: "star-health",
    subtype: "insurance",
    description:
      "Health cover designed for people aged 60 and above, issued without a pre-policy medical test.",
    price: 22000,
    rating: 4.0,
    premium_from: 22000, coverage: 500000, policy_term_years: 1,
    amount_min: 100000, amount_max: 2500000,
    min_age: 60, max_age: 75,
    commission_pct: 12.5,
    key_benefits: [
      "No pre-insurance medical screening",
      "Pre-existing conditions covered after 12 months",
      "Outpatient consultations covered",
    ],
    exclusions: ["30% co-payment on every claim", "Non-allopathic treatment"],
    features: { copay_pct: 30, waiting_period_months: 12, medical_test: false },
  },
  {
    name: "LIC Jeevan Anand",
    category: "insurance",
    provider: "lic",
    subtype: "insurance",
    description:
      "Endowment plan combining life cover with savings — pays a maturity amount if you survive the term, and cover continues for life.",
    price: 12000,
    rating: 4.1,
    premium_from: 12000, coverage: 1000000, policy_term_years: 25,
    amount_min: 100000, amount_max: 10000000,
    min_age: 18, max_age: 50,
    commission_pct: 10.0,
    key_benefits: [
      "Guaranteed maturity benefit plus bonuses",
      "Life cover continues even after maturity payout",
      "Loan facility available against the policy",
    ],
    exclusions: ["Suicide within 12 months of commencement"],
    features: { participating: true, loan_against_policy: true, bonus_declared: true },
  },
  {
    name: "ICICI Lombard Car Insurance",
    category: "insurance",
    provider: "icici-lombard",
    subtype: "insurance",
    description:
      "Comprehensive motor cover for own damage and third-party liability, with cashless repairs at network garages.",
    price: 3200,
    rating: 4.2,
    premium_from: 3200, coverage: 750000, policy_term_years: 1,
    amount_min: 100000, amount_max: 5000000,
    min_age: 18, max_age: 75,
    commission_pct: 15.0,
    key_benefits: [
      "Cashless repair at 4,000+ garages",
      "Zero-depreciation and engine protect add-ons",
      "Up to 50% no-claim bonus",
    ],
    exclusions: ["Driving without a valid licence or under the influence of alcohol", "Normal wear and tear"],
    features: { network_garages: 4000, addons: ["zero depreciation", "engine protect", "roadside assistance"] },
  },
];
