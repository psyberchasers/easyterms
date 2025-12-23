// Industry-specific analysis prompts for AI contract analysis

import { IndustryType } from "./industries";

const BASE_PROMPT = `You are an expert contract analyst. Analyze the following contract and provide a comprehensive breakdown in JSON format.

Your analysis should be thorough, accurate, and helpful for individuals who may not have legal expertise. Focus on:
1. Identifying the type of contract
2. Extracting all financial terms and key metrics
3. Identifying rights and ownership clauses
4. Spotting potentially problematic clauses
5. Providing actionable recommendations
6. Breaking down complex language into plain English`;

const MUSIC_PROMPT = `${BASE_PROMPT}

INDUSTRY CONTEXT: Music Industry
Pay special attention to:
- Royalty rates and structures (streaming, mechanical, sync, performance)
- Advance amounts and recoupment terms
- Rights ownership (masters, publishing, songwriter)
- Territory and exclusivity scope
- 360 deal provisions (touring, merch, endorsements)
- Option periods and album commitments
- Cross-collateralization between albums/projects
- Controlled composition clauses
- Perpetual vs. term-limited rights

RED FLAGS TO IDENTIFY:
- Perpetual ownership of masters
- Unfair royalty splits (below 15% for artists)
- Cross-collateralization across unrelated projects
- Hidden deductions from royalties
- Excessive option periods (more than 5-6 albums)
- 360 deal taking more than 10-15% of non-recording income`;

const NIL_PROMPT = `${BASE_PROMPT}

INDUSTRY CONTEXT: NIL (Name, Image, Likeness) for College Athletes
Pay special attention to:
- Total compensation and payment schedule
- Time commitment requirements (appearances, posts, events)
- Calculate effective hourly rate
- Exclusivity clauses (brand categories, competitors)
- Usage rights duration and scope
- Social media posting requirements
- Morality/conduct clauses
- Termination conditions

COMPLIANCE CONSIDERATIONS:
- NCAA rules on NIL activities
- State-specific NIL laws
- University-specific policies
- Academic schedule conflicts
- Practice/competition schedule conflicts

RED FLAGS TO IDENTIFY:
- Activities that could affect NCAA eligibility
- Excessive time demands during season
- Perpetual usage rights
- Broad exclusivity preventing other deals
- Vague "reasonable efforts" obligations
- Pay-for-play implications`;

const CREATOR_PROMPT = `${BASE_PROMPT}

INDUSTRY CONTEXT: Creator Economy (YouTubers, Streamers, Influencers)
Pay special attention to:
- Rate per deliverable (post, video, story)
- Usage rights duration and scope
- Whitelisting/paid promotion rights
- Content ownership and raw footage rights
- Exclusivity period and scope
- Revision limits and approval process
- FTC disclosure requirements
- Content calendar and posting schedule

RED FLAGS TO IDENTIFY:
- Perpetual whitelisting rights
- Unlimited usage rights after campaign
- Brand owns your content/footage
- Excessive exclusivity (more than campaign duration)
- Unlimited revisions requirement
- Hidden ad spend requirements from creator
- Below-market rates for follower count`;

const ESPORTS_PROMPT = `${BASE_PROMPT}

INDUSTRY CONTEXT: Esports & Professional Gaming
Pay special attention to:
- Base salary and payment schedule
- Prize pool split percentages
- Streaming revenue share
- Content creation obligations
- Housing and benefits
- Buyout clause amount
- Contract term length
- Transfer/loan provisions

RED FLAGS TO IDENTIFY:
- "Streaming jail" clauses (org takes streaming revenue)
- Unfair prize splits (org taking more than 20-30%)
- Bench pay reduction or elimination
- Excessive buyout amounts
- Content restrictions on personal channels
- Broad non-compete after leaving
- No guaranteed salary`;

const FREELANCE_PROMPT = `${BASE_PROMPT}

INDUSTRY CONTEXT: Freelance & Consulting
Pay special attention to:
- Rate structure (hourly, project, retainer)
- Payment terms (net 30, net 60, milestones)
- IP ownership and work product rights
- Scope of work definition
- Revision/change order process
- Termination notice period
- Non-compete and non-solicit clauses
- Confidentiality scope

RED FLAGS TO IDENTIFY:
- IP assignment for work done off-clock
- Side project ownership claims
- Delayed payment terms (net 60+)
- Vague scope enabling scope creep
- Broad non-competes (location, duration)
- Unlimited revisions requirement
- No kill fee for cancelled projects`;

const REAL_ESTATE_PROMPT = `${BASE_PROMPT}

INDUSTRY CONTEXT: Residential Real Estate (Tenant Perspective)
Pay special attention to:
- Monthly rent and payment terms
- Security deposit amount
- Lease term and renewal options
- Late fee structure
- Pet policies and fees
- Maintenance responsibilities
- Entry/inspection rights
- Termination and break lease terms

RED FLAGS TO IDENTIFY:
- Potentially unenforceable clauses under state/local law
- Excessive security deposit (check state limits)
- Unreasonable late fees
- Waiver of habitability rights
- Excessive landlord entry rights
- Hidden fees and charges
- Unfair termination penalties`;

export const getAnalysisPrompt = (industry: IndustryType): string => {
  const prompts: Record<IndustryType, string> = {
    music: MUSIC_PROMPT,
    nil: NIL_PROMPT,
    creator: CREATOR_PROMPT,
    esports: ESPORTS_PROMPT,
    freelance: FREELANCE_PROMPT,
    "real-estate": REAL_ESTATE_PROMPT,
  };
  
  return prompts[industry] || MUSIC_PROMPT;
};

// JSON schema for structured output based on industry
export const getOutputSchema = (industry: IndustryType): string => {
  const baseSchema = `{
  "summary": "A 2-3 paragraph executive summary in plain English",
  "contractType": "The specific type of contract",
  "parties": {
    "individual": "The talent/individual party",
    "company": "The company/organization party",
    "other": ["Any other parties"]
  },
  "effectiveDate": "Contract effective date if mentioned",
  "termLength": "Duration of the contract",
  "keyTerms": [
    {
      "title": "Term name",
      "content": "Contract language",
      "riskLevel": "high|medium|low",
      "explanation": "Plain English explanation",
      "originalText": "Exact quote from contract",
      "actionItems": ["Specific question or action for this term", "Another specific thing to verify or negotiate", "Third actionable item"]
    }
  ],`;

  const industrySpecificSchema: Record<IndustryType, string> = {
    music: `
  "financialTerms": {
    "advanceAmount": "Advance payment amount",
    "royaltyRate": "Royalty percentage",
    "recoupment": "Recoupment terms",
    "paymentSchedule": "Payment timing"
  },
  "rightsAndOwnership": {
    "masterOwnership": "Who owns masters",
    "publishingRights": "Publishing split",
    "territorialRights": "Geographic scope",
    "exclusivity": "Exclusivity terms"
  },`,
    nil: `
  "compensation": {
    "totalValue": "Total contract value",
    "paymentSchedule": "Payment timing",
    "bonuses": "Performance bonuses"
  },
  "timeCommitment": {
    "totalHours": "Estimated total hours",
    "appearances": "Number of appearances",
    "socialPosts": "Number of posts required",
    "effectiveHourlyRate": "Calculated hourly rate"
  },
  "compliance": {
    "ncaaRisks": ["Potential NCAA issues"],
    "stateSpecific": "State law considerations"
  },`,
    creator: `
  "compensation": {
    "ratePerDeliverable": "Rate per post/video",
    "totalValue": "Total contract value",
    "paymentTerms": "Payment schedule"
  },
  "usageRights": {
    "duration": "How long brand can use content",
    "whitelistingTerms": "Ad account access terms",
    "contentOwnership": "Who owns the content"
  },
  "deliverables": {
    "posts": "Number of posts",
    "videos": "Number of videos",
    "stories": "Number of stories",
    "revisionLimit": "Revision limits"
  },`,
    esports: `
  "compensation": {
    "baseSalary": "Monthly/annual salary",
    "prizePoolSplit": "Prize money percentage",
    "streamingRevShare": "Streaming revenue share",
    "signingBonus": "Signing bonus"
  },
  "benefits": {
    "housing": "Housing provided",
    "equipment": "Equipment provided",
    "travel": "Travel coverage"
  },
  "restrictions": {
    "streamingRights": "Personal streaming limitations",
    "contentRights": "Content creation restrictions",
    "buyoutAmount": "Contract buyout cost"
  },`,
    freelance: `
  "compensation": {
    "rate": "Hourly/project rate",
    "paymentTerms": "Payment timing (net 30, etc.)",
    "expenses": "Expense reimbursement"
  },
  "scope": {
    "deliverables": "What you're delivering",
    "revisions": "Revision limits",
    "timeline": "Project timeline"
  },
  "ipRights": {
    "workProduct": "Who owns the work",
    "sideProjects": "Side project restrictions",
    "priorWork": "Prior work exclusions"
  },`,
    "real-estate": `
  "rent": {
    "monthlyAmount": "Monthly rent",
    "securityDeposit": "Security deposit amount",
    "lateFee": "Late payment fee",
    "otherFees": "Other fees"
  },
  "terms": {
    "leaseDuration": "Lease term",
    "renewalTerms": "Renewal options",
    "terminationNotice": "Notice required to leave"
  },
  "policies": {
    "pets": "Pet policy",
    "guests": "Guest policy",
    "modifications": "Modification rights"
  },
  "illegalClauses": ["Potentially unenforceable clauses"],`,
  };

  const closingSchema = `
  "potentialConcerns": ["List of concerns"],
  "concernSnippets": ["Exact quotes for concerns"],
  "recommendations": [
    {
      "advice": "Specific actionable recommendation",
      "rationale": "Why this matters for this contract, citing industry standards",
      "priority": "high|medium|low",
      "howToImplement": "Concrete steps to take"
    }
  ],
  "overallRiskAssessment": "high|medium|low",
  "confidenceScore": 0.85,
  "benchmarkValues": {
    "extractedMetrics": {}
  }
}`;

  return baseSchema + industrySpecificSchema[industry] + closingSchema;
};

