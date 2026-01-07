// Contract Templates and Clause Library

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: "recording" | "publishing" | "management" | "sync" | "distribution" | "producer" | "other";
  icon: string;
  defaultClauses: string[];
  parties: {
    party1: string;
    party2: string;
  };
}

export interface ContractClause {
  id: string;
  name: string;
  category: "financial" | "rights" | "term" | "protection" | "obligations" | "general";
  description: string;
  importance: "critical" | "important" | "standard";
  template: string;
  variables: ClauseVariable[];
}

export interface ClauseVariable {
  id: string;
  name: string;
  type: "text" | "number" | "percentage" | "date" | "select" | "currency";
  placeholder: string;
  options?: string[];
  default?: string;
}

// Pre-made Contract Templates
export const contractTemplates: ContractTemplate[] = [
  {
    id: "recording-agreement",
    name: "Recording Agreement",
    description: "Standard recording contract between an artist and a record label for the production and distribution of recorded music.",
    category: "recording",
    icon: "Mic01Icon",
    defaultClauses: ["term-duration", "royalty-rate", "advance-payment", "rights-granted", "territory", "audit-rights", "termination", "creative-control"],
    parties: { party1: "Artist", party2: "Record Label" }
  },
  {
    id: "publishing-deal",
    name: "Publishing Agreement",
    description: "Music publishing contract for songwriters to assign or license their compositions to a publisher.",
    category: "publishing",
    icon: "MusicNote01Icon",
    defaultClauses: ["term-duration", "royalty-rate", "advance-payment", "rights-granted", "territory", "audit-rights", "reversion-clause", "co-publishing"],
    parties: { party1: "Songwriter", party2: "Publisher" }
  },
  {
    id: "management-contract",
    name: "Management Contract",
    description: "Agreement between an artist and their manager defining representation, commission, and responsibilities.",
    category: "management",
    icon: "UserGroupIcon",
    defaultClauses: ["term-duration", "commission-rate", "scope-services", "exclusivity", "termination", "sunset-clause", "key-person"],
    parties: { party1: "Artist", party2: "Manager" }
  },
  {
    id: "sync-license",
    name: "Sync License Agreement",
    description: "License for using music in visual media such as film, TV, commercials, or video games.",
    category: "sync",
    icon: "Video01Icon",
    defaultClauses: ["license-fee", "usage-rights", "territory", "term-duration", "credit-requirements", "most-favored-nations"],
    parties: { party1: "Rights Holder", party2: "Licensee" }
  },
  {
    id: "distribution-agreement",
    name: "Distribution Agreement",
    description: "Contract for the distribution of recorded music through various channels and platforms.",
    category: "distribution",
    icon: "Globe02Icon",
    defaultClauses: ["term-duration", "distribution-fee", "territory", "rights-granted", "reporting", "termination", "exclusivity"],
    parties: { party1: "Artist/Label", party2: "Distributor" }
  },
  {
    id: "producer-agreement",
    name: "Producer Agreement",
    description: "Contract between an artist and producer for the production of recorded music.",
    category: "producer",
    icon: "Equalizer01Icon",
    defaultClauses: ["producer-fee", "royalty-points", "credit-requirements", "rights-granted", "delivery-schedule", "advance-payment"],
    parties: { party1: "Artist", party2: "Producer" }
  },
  {
    id: "work-for-hire",
    name: "Work-for-Hire Agreement",
    description: "Agreement where the hiring party owns all rights to the work created.",
    category: "other",
    icon: "File01Icon",
    defaultClauses: ["payment-terms", "work-ownership", "delivery-schedule", "warranties", "indemnification"],
    parties: { party1: "Hiring Party", party2: "Creator" }
  },
  {
    id: "songwriter-session",
    name: "Songwriter Session Agreement",
    description: "Agreement for collaborative songwriting sessions with shared ownership and publishing rights.",
    category: "publishing",
    icon: "Edit01Icon",
    defaultClauses: ["ownership-splits", "royalty-rate", "credit-requirements", "admin-rights", "term-duration"],
    parties: { party1: "Songwriter", party2: "Co-Writer/Publisher" }
  }
];

// Clause Library
export const clauseLibrary: ContractClause[] = [
  // Financial Clauses
  {
    id: "royalty-rate",
    name: "Royalty Rate",
    category: "financial",
    description: "Defines the percentage of revenue paid to the artist/songwriter",
    importance: "critical",
    template: `ROYALTY RATE. {{party2}} shall pay {{party1}} a royalty equal to {{royaltyPercentage}}% of {{royaltyBase}} received by {{party2}} from the exploitation of the Works, payable {{paymentFrequency}}. For purposes of this Agreement, "{{royaltyBase}}" shall mean {{royaltyDefinition}}`,
    variables: [
      { id: "royaltyPercentage", name: "Royalty Percentage", type: "percentage", placeholder: "15", default: "15" },
      { id: "royaltyBase", name: "Royalty Base", type: "select", placeholder: "Select base", options: ["Net Receipts", "Gross Receipts", "Net Sales", "Gross Sales"], default: "Net Receipts" },
      { id: "royaltyDefinition", name: "Definition", type: "select", placeholder: "Select definition", options: [
        "all income actually received by {{party2}} from the exploitation of the Works, less only reasonable and customary third-party costs including mechanical royalties, distribution fees, and collection society fees.",
        "all income actually received by {{party2}} from the exploitation of the Works, without any deductions whatsoever.",
        "all income received from the sale, license, or other exploitation of the Works, less manufacturing costs, distribution fees, returns, and third-party royalties.",
        "the total amount received from all sources for the exploitation of the Works before any deductions."
      ], default: "all income actually received by {{party2}} from the exploitation of the Works, less only reasonable and customary third-party costs including mechanical royalties, distribution fees, and collection society fees." },
      { id: "paymentFrequency", name: "Payment Frequency", type: "select", placeholder: "Select frequency", options: ["quarterly", "semi-annually", "annually"], default: "semi-annually" }
    ]
  },
  {
    id: "advance-payment",
    name: "Advance Payment",
    category: "financial",
    description: "Upfront payment recoupable against future royalties",
    importance: "critical",
    template: `ADVANCE. {{party2}} shall pay {{party1}} a non-refundable but recoupable advance in the amount of {{advanceAmount}}, payable {{advanceSchedule}}. This advance shall be recoupable from {{recoupmentSource}}. For purposes of this Agreement, "recoupable" means that {{party2}} may deduct the advance from royalties otherwise payable to {{party1}} until the advance is fully recovered; however, {{party1}} shall not be required to repay any unrecouped portion of the advance.`,
    variables: [
      { id: "advanceAmount", name: "Advance Amount", type: "currency", placeholder: "$50,000", default: "$50,000" },
      { id: "advanceSchedule", name: "Payment Schedule", type: "select", placeholder: "Select schedule", options: ["upon execution", "50% upon execution, 50% upon delivery", "in equal monthly installments"], default: "upon execution" },
      { id: "recoupmentSource", name: "Recoupment Source", type: "select", placeholder: "Select source", options: ["all royalties due", "artist's share of royalties only", "specific revenue streams"], default: "all royalties due" }
    ]
  },
  {
    id: "commission-rate",
    name: "Commission Rate",
    category: "financial",
    description: "Manager's percentage of artist's gross earnings",
    importance: "critical",
    template: `COMMISSION. {{party1}} shall pay {{party2}} a commission equal to {{commissionRate}}% of {{party1}}'s Gross Earnings in the entertainment industry during the Term, and {{sunsetRate}}% for {{sunsetPeriod}} following termination on contracts procured during the Term.`,
    variables: [
      { id: "commissionRate", name: "Commission Rate", type: "percentage", placeholder: "15", default: "15" },
      { id: "sunsetRate", name: "Sunset Rate", type: "percentage", placeholder: "10", default: "10" },
      { id: "sunsetPeriod", name: "Sunset Period", type: "text", placeholder: "2 years", default: "2 years" }
    ]
  },
  {
    id: "producer-fee",
    name: "Producer Fee",
    category: "financial",
    description: "Flat fee and/or royalty points for producer services",
    importance: "critical",
    template: `PRODUCER COMPENSATION. {{party1}} shall pay {{party2}}: (a) a flat fee of {{producerFee}} per master recording, payable upon delivery of the completed master; and (b) {{royaltyPoints}} royalty points ({{pointsPercentage}}% of the applicable royalty rate) on all sales and streams of recordings embodying the Masters. For purposes of this Agreement, "royalty points" means a percentage of the artist's royalty rate such that if the artist receives a 15% royalty and the producer has 3 points, the producer receives 3% and the artist receives 12%. Producer royalties shall be calculated on the same royalty base as artist royalties and shall be payable after recoupment of recording costs unless otherwise specified.`,
    variables: [
      { id: "producerFee", name: "Producer Fee", type: "currency", placeholder: "$5,000", default: "$5,000" },
      { id: "royaltyPoints", name: "Royalty Points", type: "number", placeholder: "3", default: "3" },
      { id: "pointsPercentage", name: "Points Percentage", type: "percentage", placeholder: "3", default: "3" }
    ]
  },
  {
    id: "license-fee",
    name: "License Fee",
    category: "financial",
    description: "One-time or recurring fee for sync license",
    importance: "critical",
    template: `LICENSE FEE. {{party2}} shall pay {{party1}} a license fee of {{licenseFee}} for the rights granted herein. {{additionalFees}}`,
    variables: [
      { id: "licenseFee", name: "License Fee", type: "currency", placeholder: "$10,000", default: "$10,000" },
      { id: "additionalFees", name: "Additional Terms", type: "text", placeholder: "Additional usage fees apply for...", default: "" }
    ]
  },
  {
    id: "distribution-fee",
    name: "Distribution Fee",
    category: "financial",
    description: "Percentage retained by distributor",
    importance: "critical",
    template: `DISTRIBUTION FEE. {{party2}} shall retain {{distributionFee}}% of all revenues received from the distribution of the Works ("Distribution Fee"). The remaining {{artistShare}}% shall be paid to {{party1}} within {{paymentWindow}} days of receipt. For purposes of this Agreement, "revenues" shall mean all income actually received by {{party2}} from digital service providers, streaming platforms, download stores, and any other distribution channels, without any additional deductions other than the Distribution Fee specified herein.`,
    variables: [
      { id: "distributionFee", name: "Distribution Fee", type: "percentage", placeholder: "15", default: "15" },
      { id: "artistShare", name: "Artist Share", type: "percentage", placeholder: "85", default: "85" },
      { id: "paymentWindow", name: "Payment Window (days)", type: "number", placeholder: "45", default: "45" }
    ]
  },

  // Term Clauses
  {
    id: "term-duration",
    name: "Term & Duration",
    category: "term",
    description: "Length of the agreement and renewal options",
    importance: "critical",
    template: `TERM. The initial term of this Agreement shall commence on {{effectiveDate}} and continue for a period of {{initialTerm}}. {{renewalTerms}}`,
    variables: [
      { id: "effectiveDate", name: "Effective Date", type: "date", placeholder: "Select date", default: "" },
      { id: "initialTerm", name: "Initial Term", type: "text", placeholder: "1 year", default: "1 year" },
      { id: "renewalTerms", name: "Renewal Terms", type: "select", placeholder: "Select renewal", options: [
        "This Agreement shall automatically renew for successive one-year periods unless either party provides written notice of termination at least 90 days prior to the end of the then-current term.",
        "{{party2}} shall have the option to extend this Agreement for up to two additional one-year periods upon written notice.",
        "This Agreement shall not automatically renew and shall terminate at the end of the initial term."
      ], default: "This Agreement shall automatically renew for successive one-year periods unless either party provides written notice of termination at least 90 days prior to the end of the then-current term." }
    ]
  },
  {
    id: "termination",
    name: "Termination Rights",
    category: "term",
    description: "Conditions under which the agreement can be terminated",
    importance: "critical",
    template: `TERMINATION. Either party may terminate this Agreement: (a) upon {{noticePeriod}} days written notice to the other party; (b) immediately upon material breach by the other party that remains uncured for {{curePeriod}} days after written notice; or (c) {{additionalTermination}}`,
    variables: [
      { id: "noticePeriod", name: "Notice Period (days)", type: "number", placeholder: "30", default: "30" },
      { id: "curePeriod", name: "Cure Period (days)", type: "number", placeholder: "30", default: "30" },
      { id: "additionalTermination", name: "Additional Termination Rights", type: "text", placeholder: "upon bankruptcy or insolvency of either party", default: "upon bankruptcy or insolvency of either party" }
    ]
  },
  {
    id: "sunset-clause",
    name: "Sunset Clause",
    category: "term",
    description: "Decreasing commission after contract termination",
    importance: "important",
    template: `SUNSET PROVISIONS. Following termination, {{party2}}'s commission on agreements procured during the Term shall decrease as follows: {{sunsetSchedule}}`,
    variables: [
      { id: "sunsetSchedule", name: "Sunset Schedule", type: "text", placeholder: "Year 1: 15%, Year 2: 10%, Year 3: 5%, thereafter: 0%", default: "Year 1: 15%, Year 2: 10%, Year 3: 5%, thereafter: 0%" }
    ]
  },

  // Rights Clauses
  {
    id: "rights-granted",
    name: "Rights Granted",
    category: "rights",
    description: "Specific rights being licensed or assigned",
    importance: "critical",
    template: `GRANT OF RIGHTS. {{party1}} hereby {{grantType}} to {{party2}} the {{exclusivity}} right to {{specificRights}} throughout the Territory during the Term.`,
    variables: [
      { id: "grantType", name: "Grant Type", type: "select", placeholder: "Select type", options: ["grants", "assigns", "licenses"], default: "grants" },
      { id: "exclusivity", name: "Exclusivity", type: "select", placeholder: "Select exclusivity", options: ["exclusive", "non-exclusive"], default: "exclusive" },
      { id: "specificRights", name: "Specific Rights", type: "text", placeholder: "manufacture, distribute, sell, and exploit the Masters", default: "manufacture, distribute, sell, and exploit the Masters" }
    ]
  },
  {
    id: "territory",
    name: "Territory",
    category: "rights",
    description: "Geographic scope of the agreement",
    importance: "important",
    template: `TERRITORY. The rights granted herein shall extend to {{territory}}.`,
    variables: [
      { id: "territory", name: "Territory", type: "select", placeholder: "Select territory", options: ["the Universe", "Worldwide", "North America", "United States and Canada", "United States only", "European Union", "specific territories as listed in Exhibit A"], default: "the Universe" }
    ]
  },
  {
    id: "reversion-clause",
    name: "Reversion Clause",
    category: "rights",
    description: "Conditions under which rights revert to the creator",
    importance: "critical",
    template: `REVERSION OF RIGHTS. All rights granted hereunder shall revert to {{party1}} upon: (a) expiration or termination of this Agreement; (b) {{party2}}'s failure to commercially exploit the Works within {{exploitationPeriod}}; or (c) {{additionalReversion}}`,
    variables: [
      { id: "exploitationPeriod", name: "Exploitation Period", type: "text", placeholder: "18 months", default: "18 months" },
      { id: "additionalReversion", name: "Additional Reversion Terms", type: "text", placeholder: "upon full recoupment of all advances", default: "upon full recoupment of all advances" }
    ]
  },
  {
    id: "ownership-splits",
    name: "Ownership Splits",
    category: "rights",
    description: "Division of ownership between collaborators",
    importance: "critical",
    template: `OWNERSHIP. The parties agree that ownership of the Works shall be divided as follows: {{party1}}: {{party1Share}}%, {{party2}}: {{party2Share}}%. Each party shall be entitled to their respective share of all income derived from the Works.`,
    variables: [
      { id: "party1Share", name: "Party 1 Share", type: "percentage", placeholder: "50", default: "50" },
      { id: "party2Share", name: "Party 2 Share", type: "percentage", placeholder: "50", default: "50" }
    ]
  },
  {
    id: "work-ownership",
    name: "Work-for-Hire Ownership",
    category: "rights",
    description: "Full ownership transfer to hiring party",
    importance: "critical",
    template: `OWNERSHIP. {{party2}} acknowledges and agrees that all Work Product created hereunder shall be considered "work made for hire" as defined by the Copyright Act. {{party1}} shall own all right, title, and interest in and to the Work Product, including all intellectual property rights therein.`,
    variables: []
  },

  // Protection Clauses
  {
    id: "audit-rights",
    name: "Audit Rights",
    category: "protection",
    description: "Right to examine financial records",
    importance: "critical",
    template: `AUDIT RIGHTS. {{party1}} shall have the right, upon {{noticePeriod}} days prior written notice and no more than {{auditFrequency}}, to audit {{party2}}'s books and records relating to this Agreement. If any audit reveals an underpayment of more than {{discrepancyThreshold}}%, {{party2}} shall bear the cost of such audit.`,
    variables: [
      { id: "noticePeriod", name: "Notice Period (days)", type: "number", placeholder: "30", default: "30" },
      { id: "auditFrequency", name: "Audit Frequency", type: "select", placeholder: "Select frequency", options: ["once per calendar year", "twice per calendar year", "once every two years"], default: "once per calendar year" },
      { id: "discrepancyThreshold", name: "Discrepancy Threshold", type: "percentage", placeholder: "5", default: "5" }
    ]
  },
  {
    id: "creative-control",
    name: "Creative Control",
    category: "protection",
    description: "Artist's approval rights over creative decisions",
    importance: "important",
    template: `CREATIVE CONTROL. {{party1}} shall have {{approvalLevel}} over: {{approvalMatters}}. {{party2}} shall provide {{party1}} with {{reviewPeriod}} to review and approve such matters.`,
    variables: [
      { id: "approvalLevel", name: "Approval Level", type: "select", placeholder: "Select level", options: ["sole approval", "mutual approval", "consultation rights", "final approval"], default: "mutual approval" },
      { id: "approvalMatters", name: "Approval Matters", type: "text", placeholder: "album artwork, marketing materials, single selection, and music videos", default: "album artwork, marketing materials, single selection, and music videos" },
      { id: "reviewPeriod", name: "Review Period", type: "text", placeholder: "5 business days", default: "5 business days" }
    ]
  },
  {
    id: "key-person",
    name: "Key Person Clause",
    category: "protection",
    description: "Right to terminate if key individual leaves",
    importance: "important",
    template: `KEY PERSON. If {{keyPerson}} ceases to be actively involved in {{party2}}'s representation of {{party1}}, {{party1}} shall have the right to terminate this Agreement upon {{noticePeriod}} days written notice.`,
    variables: [
      { id: "keyPerson", name: "Key Person Name", type: "text", placeholder: "[Manager Name]", default: "[Manager Name]" },
      { id: "noticePeriod", name: "Notice Period (days)", type: "number", placeholder: "30", default: "30" }
    ]
  },
  {
    id: "most-favored-nations",
    name: "Most Favored Nations",
    category: "protection",
    description: "Equal treatment clause for sync licenses",
    importance: "important",
    template: `MOST FAVORED NATIONS. The fees and terms granted to {{party1}} hereunder shall be no less favorable than those granted to any other party for similar uses in connection with the Production. If {{party2}} grants more favorable terms to any third party, such terms shall automatically apply to {{party1}}.`,
    variables: []
  },

  // Obligations Clauses
  {
    id: "credit-requirements",
    name: "Credit Requirements",
    category: "obligations",
    description: "How parties must be credited",
    importance: "important",
    template: `CREDIT. {{party2}} shall accord {{party1}} credit as "{{creditText}}" on all {{creditLocations}}. Credit shall be in a size and placement {{creditPlacement}}.`,
    variables: [
      { id: "creditText", name: "Credit Text", type: "text", placeholder: "Produced by [Name]", default: "Produced by [Name]" },
      { id: "creditLocations", name: "Credit Locations", type: "text", placeholder: "physical and digital releases, marketing materials, and public performances", default: "physical and digital releases, marketing materials, and public performances" },
      { id: "creditPlacement", name: "Credit Placement", type: "select", placeholder: "Select placement", options: ["no less prominent than any other credit", "as mutually agreed", "in {{party2}}'s sole discretion"], default: "no less prominent than any other credit" }
    ]
  },
  {
    id: "delivery-schedule",
    name: "Delivery Schedule",
    category: "obligations",
    description: "Timeline for deliverables",
    importance: "important",
    template: `DELIVERY. {{party1}} shall deliver {{deliverables}} to {{party2}} on or before {{deliveryDate}}. Time is of the essence with respect to delivery obligations.`,
    variables: [
      { id: "deliverables", name: "Deliverables", type: "text", placeholder: "the completed Masters, along with all relevant metadata and artwork", default: "the completed Masters, along with all relevant metadata and artwork" },
      { id: "deliveryDate", name: "Delivery Date", type: "date", placeholder: "Select date", default: "" }
    ]
  },
  {
    id: "scope-services",
    name: "Scope of Services",
    category: "obligations",
    description: "Manager's duties and responsibilities",
    importance: "important",
    template: `SERVICES. {{party2}} agrees to render the following services on behalf of {{party1}}: {{services}}. {{party2}} shall use reasonable good faith efforts to advance {{party1}}'s career in the entertainment industry.`,
    variables: [
      { id: "services", name: "Services", type: "text", placeholder: "advise and counsel regarding professional matters, negotiate agreements, coordinate promotional activities, and oversee financial planning", default: "advise and counsel regarding professional matters, negotiate agreements, coordinate promotional activities, and oversee financial planning" }
    ]
  },
  {
    id: "exclusivity",
    name: "Exclusivity",
    category: "obligations",
    description: "Exclusive relationship requirements",
    importance: "critical",
    template: `EXCLUSIVITY. During the Term, {{exclusivityTerms}}`,
    variables: [
      { id: "exclusivityTerms", name: "Exclusivity Terms", type: "select", placeholder: "Select terms", options: [
        "{{party1}} shall render services exclusively for {{party2}} and shall not perform similar services for any third party without {{party2}}'s prior written consent.",
        "{{party2}} shall be {{party1}}'s exclusive representative in the Territory for the services described herein.",
        "This Agreement is non-exclusive and either party may enter into similar arrangements with third parties."
      ], default: "{{party2}} shall be {{party1}}'s exclusive representative in the Territory for the services described herein." }
    ]
  },
  {
    id: "reporting",
    name: "Reporting & Accounting",
    category: "obligations",
    description: "Statement and payment schedule",
    importance: "important",
    template: `ACCOUNTING. {{party2}} shall provide {{party1}} with detailed royalty statements {{reportingFrequency}}, within {{reportingDeadline}} days following the end of each accounting period. Statements shall include {{reportingDetails}}.`,
    variables: [
      { id: "reportingFrequency", name: "Reporting Frequency", type: "select", placeholder: "Select frequency", options: ["quarterly", "semi-annually", "annually"], default: "semi-annually" },
      { id: "reportingDeadline", name: "Reporting Deadline (days)", type: "number", placeholder: "45", default: "45" },
      { id: "reportingDetails", name: "Reporting Details", type: "text", placeholder: "units sold, revenue received, deductions taken, and net amounts payable", default: "units sold, revenue received, deductions taken, and net amounts payable" }
    ]
  },

  // General Clauses
  {
    id: "warranties",
    name: "Warranties & Representations",
    category: "general",
    description: "Guarantees made by each party",
    importance: "standard",
    template: `WARRANTIES. {{party1}} represents and warrants that: (a) {{party1}} has the full right and authority to enter into this Agreement; (b) the Works are original and do not infringe upon any third party's rights; (c) {{additionalWarranties}}`,
    variables: [
      { id: "additionalWarranties", name: "Additional Warranties", type: "text", placeholder: "there are no existing agreements that conflict with this Agreement", default: "there are no existing agreements that conflict with this Agreement" }
    ]
  },
  {
    id: "indemnification",
    name: "Indemnification",
    category: "general",
    description: "Protection against third-party claims",
    importance: "standard",
    template: `INDEMNIFICATION. Each party shall indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, and expenses (including reasonable attorneys' fees) arising out of any breach of this Agreement or any warranty, representation, or obligation hereunder.`,
    variables: []
  },
  {
    id: "usage-rights",
    name: "Usage Rights (Sync)",
    category: "rights",
    description: "Specific usage permissions for sync licenses",
    importance: "critical",
    template: `USAGE. The license granted herein permits {{party2}} to use the Composition in {{productionTitle}} (the "Production") for the following purposes: {{usageTypes}}. The license {{additionalRestrictions}}`,
    variables: [
      { id: "productionTitle", name: "Production Title", type: "text", placeholder: "[Film/TV Show Title]", default: "[Film/TV Show Title]" },
      { id: "usageTypes", name: "Usage Types", type: "text", placeholder: "theatrical release, television broadcast, streaming platforms, and home video", default: "theatrical release, television broadcast, streaming platforms, and home video" },
      { id: "additionalRestrictions", name: "Additional Terms", type: "text", placeholder: "does not include rights for advertising, trailers, or promotional materials without additional compensation", default: "does not include rights for advertising, trailers, or promotional materials without additional compensation" }
    ]
  },
  {
    id: "co-publishing",
    name: "Co-Publishing Terms",
    category: "rights",
    description: "Split publishing arrangement",
    importance: "critical",
    template: `CO-PUBLISHING. {{party1}} and {{party2}} shall co-own the publishing rights to the Works as follows: {{party1}} shall retain {{writerShare}}% of the writer's share and {{party1PubShare}}% of the publisher's share, and {{party2}} shall receive {{party2PubShare}}% of the publisher's share. For purposes of this Agreement, the "writer's share" means the portion of performance royalties paid directly to the songwriter by performing rights organizations (ASCAP, BMI, SESAC, or their equivalents), and the "publisher's share" means all other publishing income including the publisher's portion of performance royalties, mechanical royalties, synchronization fees, and print royalties.`,
    variables: [
      { id: "writerShare", name: "Writer's Share", type: "percentage", placeholder: "100", default: "100" },
      { id: "party1PubShare", name: "Creator's Publishing Share", type: "percentage", placeholder: "50", default: "50" },
      { id: "party2PubShare", name: "Publisher's Share", type: "percentage", placeholder: "50", default: "50" }
    ]
  },
  {
    id: "admin-rights",
    name: "Administration Rights",
    category: "rights",
    description: "Rights to administer and collect royalties",
    importance: "important",
    template: `ADMINISTRATION. {{party2}} shall have the {{adminScope}} right to administer the Works, including the right to register the Works with performing rights organizations, issue licenses, and collect all income derived therefrom.`,
    variables: [
      { id: "adminScope", name: "Administration Scope", type: "select", placeholder: "Select scope", options: ["exclusive worldwide", "exclusive in the Territory", "non-exclusive"], default: "exclusive worldwide" }
    ]
  },
  {
    id: "payment-terms",
    name: "Payment Terms",
    category: "financial",
    description: "General payment structure",
    importance: "critical",
    template: `PAYMENT. {{party1}} shall pay {{party2}} the sum of {{totalAmount}}, payable as follows: {{paymentSchedule}}. Payment shall be made via {{paymentMethod}}.`,
    variables: [
      { id: "totalAmount", name: "Total Amount", type: "currency", placeholder: "$10,000", default: "$10,000" },
      { id: "paymentSchedule", name: "Payment Schedule", type: "text", placeholder: "50% upon execution, 50% upon completion", default: "50% upon execution, 50% upon completion" },
      { id: "paymentMethod", name: "Payment Method", type: "select", placeholder: "Select method", options: ["wire transfer", "check", "ACH direct deposit"], default: "wire transfer" }
    ]
  },

  // Legal Framework Clauses (High Priority)
  {
    id: "governing-law",
    name: "Governing Law & Venue",
    category: "general",
    description: "Which jurisdiction's laws apply and where disputes are resolved",
    importance: "critical",
    template: `GOVERNING LAW AND VENUE. This Agreement shall be governed by and construed in accordance with the laws of the State of {{governingState}}, without regard to its conflict of laws principles. Any legal action or proceeding arising under this Agreement shall be brought exclusively in the {{courtType}} courts located in {{venue}}, and the parties hereby consent to personal jurisdiction and venue therein.`,
    variables: [
      { id: "governingState", name: "Governing State", type: "text", placeholder: "California", default: "California" },
      { id: "courtType", name: "Court Type", type: "select", placeholder: "Select court", options: ["state and federal", "state", "federal"], default: "state and federal" },
      { id: "venue", name: "Venue (City/County)", type: "text", placeholder: "Los Angeles County, California", default: "Los Angeles County, California" }
    ]
  },
  {
    id: "dispute-resolution",
    name: "Dispute Resolution",
    category: "general",
    description: "How disputes will be handled (arbitration, mediation, or litigation)",
    importance: "critical",
    template: `DISPUTE RESOLUTION. {{disputeMethod}}`,
    variables: [
      { id: "disputeMethod", name: "Resolution Method", type: "select", placeholder: "Select method", options: [
        "Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by JAMS in accordance with its Comprehensive Arbitration Rules. The arbitration shall take place in the city where {{party2}} maintains its principal place of business. The arbitrator's decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction.",
        "The parties agree to first attempt to resolve any dispute through good-faith mediation. If mediation fails within 30 days, either party may pursue binding arbitration under AAA Commercial Arbitration Rules. Each party shall bear its own costs, with arbitration fees split equally.",
        "Any dispute shall be resolved exclusively through litigation in the courts specified in the Governing Law provision. THE PARTIES HEREBY WAIVE ANY RIGHT TO A JURY TRIAL in any action arising out of this Agreement.",
        "The parties agree to resolve disputes through the following steps: (1) direct negotiation for 15 days; (2) mediation for 30 days; (3) if unresolved, binding arbitration. The prevailing party shall be entitled to recover reasonable attorneys' fees."
      ], default: "Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by JAMS in accordance with its Comprehensive Arbitration Rules. The arbitration shall take place in the city where {{party2}} maintains its principal place of business. The arbitrator's decision shall be final and binding, and judgment may be entered in any court of competent jurisdiction." }
    ]
  },
  {
    id: "force-majeure",
    name: "Force Majeure",
    category: "protection",
    description: "Protection when performance becomes impossible due to extraordinary events",
    importance: "critical",
    template: `FORCE MAJEURE. Neither party shall be liable for any failure or delay in performing their obligations under this Agreement if such failure or delay results from circumstances beyond the reasonable control of that party, including but not limited to: acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, epidemics or pandemics, strikes, {{additionalEvents}}. The affected party shall provide prompt notice and use reasonable efforts to mitigate the impact. If the force majeure event continues for more than {{maxDuration}} days, either party may terminate this Agreement without liability.`,
    variables: [
      { id: "additionalEvents", name: "Additional Events", type: "text", placeholder: "platform outages, or government-mandated shutdowns", default: "platform outages, or government-mandated shutdowns" },
      { id: "maxDuration", name: "Max Duration (days)", type: "number", placeholder: "90", default: "90" }
    ]
  },
  {
    id: "confidentiality",
    name: "Confidentiality",
    category: "protection",
    description: "Protects sensitive business information and deal terms",
    importance: "critical",
    template: `CONFIDENTIALITY. Each party agrees to keep confidential all non-public information disclosed by the other party in connection with this Agreement, including but not limited to: {{confidentialItems}}. This obligation shall survive termination of this Agreement for a period of {{confidentialityPeriod}}. Confidential information may be disclosed if required by law, provided the disclosing party gives prompt notice to allow the other party to seek protective measures.`,
    variables: [
      { id: "confidentialItems", name: "Confidential Items", type: "text", placeholder: "financial terms, advance amounts, royalty rates, unreleased works, and business strategies", default: "financial terms, advance amounts, royalty rates, unreleased works, and business strategies" },
      { id: "confidentialityPeriod", name: "Confidentiality Period", type: "select", placeholder: "Select period", options: ["2 years", "3 years", "5 years", "indefinitely"], default: "3 years" }
    ]
  },
  {
    id: "assignment-transfer",
    name: "Assignment & Transfer",
    category: "general",
    description: "Whether the contract can be assigned to another party",
    importance: "critical",
    template: `ASSIGNMENT. {{assignmentTerms}}`,
    variables: [
      { id: "assignmentTerms", name: "Assignment Terms", type: "select", placeholder: "Select terms", options: [
        "Neither party may assign or transfer this Agreement or any rights hereunder without the prior written consent of the other party, which consent shall not be unreasonably withheld. Any attempted assignment without such consent shall be void.",
        "{{party2}} may freely assign this Agreement to any affiliate, successor, or purchaser of substantially all of its assets. {{party1}} may not assign this Agreement without {{party2}}'s prior written consent.",
        "{{party1}} may not assign this Agreement without prior written consent. {{party2}} may assign this Agreement upon written notice to {{party1}}, provided the assignee assumes all obligations hereunder.",
        "This Agreement is personal to the parties and may not be assigned by either party without the written consent of the other. Notwithstanding the foregoing, either party may assign this Agreement to a successor in connection with a merger, acquisition, or sale of substantially all assets."
      ], default: "Neither party may assign or transfer this Agreement or any rights hereunder without the prior written consent of the other party, which consent shall not be unreasonably withheld. Any attempted assignment without such consent shall be void." }
    ]
  },

  // General Provisions Bundle
  {
    id: "general-provisions",
    name: "General Provisions",
    category: "general",
    description: "Standard legal provisions including severability, entire agreement, amendments, and notices",
    importance: "important",
    template: `GENERAL PROVISIONS.

(a) Severability. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

(b) Entire Agreement. This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof and supersedes all prior agreements, understandings, negotiations, and discussions, whether oral or written.

(c) Amendments. This Agreement may not be amended or modified except by a written instrument signed by both parties.

(d) Notices. All notices required or permitted under this Agreement shall be in writing and shall be deemed delivered when: (i) delivered personally; (ii) sent by confirmed email to {{party1Email}} for {{party1}} and {{party2Email}} for {{party2}}; or (iii) three (3) business days after being sent by certified mail, return receipt requested.

(e) Waiver. The failure of either party to enforce any provision of this Agreement shall not constitute a waiver of that party's right to enforce that provision or any other provision in the future.

(f) Counterparts. This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures shall be deemed valid and binding.`,
    variables: [
      { id: "party1Email", name: "Party 1 Email", type: "text", placeholder: "artist@email.com", default: "" },
      { id: "party2Email", name: "Party 2 Email", type: "text", placeholder: "company@email.com", default: "" }
    ]
  }
];

// Helper function to get clauses by category
export const getClausesByCategory = (category: ContractClause["category"]) => {
  return clauseLibrary.filter(clause => clause.category === category);
};

// Helper function to get template by ID
export const getTemplateById = (id: string) => {
  return contractTemplates.find(template => template.id === id);
};

// Helper function to get clause by ID
export const getClauseById = (id: string) => {
  return clauseLibrary.find(clause => clause.id === id);
};

// Helper function to format date values nicely
const formatDateValue = (dateValue: string): string => {
  if (!dateValue) return '';
  // Check if it's a valid date string (YYYY-MM-DD format from date input)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateValue)) {
    return new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return dateValue;
};

// Helper function to generate key terms summary
const generateKeyTermsSummary = (
  template: ContractTemplate,
  selectedClauses: string[],
  clauseValues: Record<string, Record<string, string>>
): string => {
  const summaryItems: string[] = [];

  // Extract key terms from selected clauses
  selectedClauses.forEach(clauseId => {
    const values = clauseValues[clauseId] || {};

    switch (clauseId) {
      case 'term-duration':
        if (values.initialTerm) {
          summaryItems.push(`Term: ${values.initialTerm}`);
        }
        break;
      case 'royalty-rate':
        if (values.royaltyPercentage && values.royaltyBase) {
          summaryItems.push(`Royalty: ${values.royaltyPercentage}% of ${values.royaltyBase}`);
        }
        break;
      case 'advance-payment':
        if (values.advanceAmount) {
          summaryItems.push(`Advance: ${values.advanceAmount} (recoupable)`);
        }
        break;
      case 'commission-rate':
        if (values.commissionRate) {
          summaryItems.push(`Commission: ${values.commissionRate}%`);
        }
        break;
      case 'distribution-fee':
        if (values.distributionFee && values.artistShare) {
          summaryItems.push(`Distribution Split: ${values.artistShare}% to Artist / ${values.distributionFee}% to Distributor`);
        }
        break;
      case 'producer-fee':
        if (values.producerFee || values.royaltyPoints) {
          const parts = [];
          if (values.producerFee) parts.push(values.producerFee);
          if (values.royaltyPoints) parts.push(`${values.royaltyPoints} points`);
          summaryItems.push(`Producer Compensation: ${parts.join(' + ')}`);
        }
        break;
      case 'license-fee':
        if (values.licenseFee) {
          summaryItems.push(`License Fee: ${values.licenseFee}`);
        }
        break;
      case 'territory':
        if (values.territory) {
          summaryItems.push(`Territory: ${values.territory}`);
        }
        break;
      case 'rights-granted':
        if (values.exclusivity) {
          summaryItems.push(`Rights: ${values.exclusivity.charAt(0).toUpperCase() + values.exclusivity.slice(1)}`);
        }
        break;
      case 'ownership-splits':
        if (values.party1Share && values.party2Share) {
          summaryItems.push(`Ownership: ${values.party1Share}% / ${values.party2Share}%`);
        }
        break;
      case 'co-publishing':
        if (values.writerShare && values.party1PubShare) {
          summaryItems.push(`Publishing: ${values.writerShare}% writer's share + ${values.party1PubShare}% publisher's share to Creator`);
        }
        break;
    }
  });

  if (summaryItems.length === 0) {
    return '';
  }

  let summary = `KEY TERMS SUMMARY\n`;
  summary += `─────────────────────────────────────────────────────────\n`;
  summaryItems.forEach(item => {
    summary += `• ${item}\n`;
  });
  summary += `─────────────────────────────────────────────────────────\n`;
  summary += `Note: This summary is provided for convenience only. The binding terms are set forth in the Agreement below.\n\n`;

  return summary;
};

// Generate contract text from selected clauses and values
export const generateContractText = (
  template: ContractTemplate,
  selectedClauses: string[],
  clauseValues: Record<string, Record<string, string>>,
  partyNames: { party1: string; party2: string },
  contractDate?: string
): string => {
  // Format the date nicely
  const formattedDate = contractDate
    ? new Date(contractDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '[DATE]';

  // Get party display names with fallbacks
  const party1DisplayName = partyNames.party1?.trim() || `[${template.parties.party1} Name]`;
  const party2DisplayName = partyNames.party2?.trim() || `[${template.parties.party2} Name]`;

  let contractText = `${template.name.toUpperCase()}\n\n`;
  contractText += `This Agreement ("Agreement") is entered into as of ${formattedDate}, by and between:\n\n`;
  contractText += `${party1DisplayName} ("${template.parties.party1}")\n`;
  contractText += `and\n`;
  contractText += `${party2DisplayName} ("${template.parties.party2}")\n\n`;

  contractText += `RECITALS\n\n`;
  contractText += `WHEREAS, ${template.parties.party1} and ${template.parties.party2} desire to enter into this Agreement upon the terms and conditions set forth herein.\n\n`;
  contractText += `NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the parties agree as follows:\n\n`;

  selectedClauses.forEach((clauseId, index) => {
    const clause = getClauseById(clauseId);
    if (clause) {
      let clauseText = clause.template;
      const values = clauseValues[clauseId] || {};

      // Replace variables
      clause.variables.forEach(variable => {
        let value = values[variable.id] || variable.default || `[${variable.name}]`;

        // Format date type variables nicely
        if (variable.type === 'date' && value && value !== `[${variable.name}]`) {
          value = formatDateValue(value);
        }

        clauseText = clauseText.replace(new RegExp(`{{${variable.id}}}`, 'g'), value);
      });

      // Replace party placeholders (including those that may be in select option values)
      clauseText = clauseText.replace(/{{party1}}/g, template.parties.party1);
      clauseText = clauseText.replace(/{{party2}}/g, template.parties.party2);

      contractText += `${index + 1}. ${clause.name.toUpperCase()}\n\n`;
      contractText += `${clauseText}\n\n`;
    }
  });

  contractText += `IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.\n\n`;
  contractText += `_______________________________\n${party1DisplayName}\n${template.parties.party1}\n\n`;
  contractText += `_______________________________\n${party2DisplayName}\n${template.parties.party2}\n`;

  return contractText;
};
