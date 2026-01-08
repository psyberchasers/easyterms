"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Download,
  ChevronRight,
  ChevronLeft,
  Check,
  GripVertical,
  X,
  Copy,
  Eye,
  AlertTriangle
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mic01Icon,
  MusicNote01Icon,
  UserGroupIcon,
  Video01Icon,
  Globe02Icon,
  Settings03Icon,
  File01Icon,
  Edit02Icon,
  GridViewIcon,
  PlusSignIcon,
  Calendar02Icon,
  DollarCircleIcon,
  KeyIcon,
  Clock01Icon,
  SecurityCheckIcon,
  TaskDone02Icon,
  FileExportIcon,
  ChatPreviewIcon,
  LanguageSkillIcon,
  LicenseIcon,
  ShieldUserIcon,
  Agreement01Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/animate-ui/components/animate/tooltip";
import {
  contractTemplates,
  clauseLibrary,
  getTemplateById,
  getClauseById,
  generateContractText,
  ContractTemplate,
  ContractClause,
} from "@/config/contract-templates";

// Plain English explanations for each clause - shown in tooltips
const clauseExplanations: Record<string, string> = {
  "royalty-rate": "This determines how much money you earn from your music. A higher percentage means more in your pocket. The definition of what counts as 'receipts' is crucial - Net means after deductions, Gross means before.",
  "advance-payment": "Upfront money you receive before earning royalties. Remember, this isn't free money. It's an advance against future earnings that gets recouped (paid back) from your royalties.",
  "commission-rate": "The percentage your manager takes from your earnings. Industry standard is typically 15-20%, but this can vary based on experience and services provided.",
  "producer-fee": "What you pay (or receive) for production work. This usually includes a flat fee plus points (percentage of royalties) on the finished recording.",
  "license-fee": "A one-time payment for the right to use music in a specific project like a movie, TV show, or commercial.",
  "distribution-fee": "The cut taken by the company that gets your music onto streaming platforms and stores. Lower is better for you.",
  "term-duration": "How long you're locked into this contract. Shorter terms give you more flexibility, while longer terms might come with better advances.",
  "termination": "Your escape hatch. The conditions under which you or the other party can end the agreement early. Make sure you have reasonable exit options.",
  "sunset-clause": "After your contract ends, this determines how long they can still collect commission on deals made during the contract. Shorter sunset periods are better for you.",
  "rights-granted": "Exactly what you're giving away or licensing. This is crucial, so make sure you understand every right you're transferring.",
  "territory": "Where your music can be sold or used under this deal. Worldwide means everywhere, while limited territories give you more control.",
  "reversion-clause": "When and how you get your rights back. This is your safety net, so make sure there's a clear path to regaining control of your work.",
  "ownership-splits": "Who owns what percentage of the song or recording. Get this in writing to avoid disputes later.",
  "work-ownership": "In work-for-hire deals, the person paying usually owns everything. Make sure you're okay with giving up all rights.",
  "audit-rights": "Your right to check their books and verify you're being paid correctly. This is essential, so always insist on audit rights.",
  "creative-control": "How much say you have over artistic decisions. More control means your vision stays intact, while less control might mean faster releases.",
  "key-person": "If your main contact leaves the company, you can potentially exit the deal. This protects you from being stuck with people you didn't choose.",
  "most-favored-nations": "You'll get at least as good a deal as anyone else in similar situations. This protects you from being undervalued.",
  "credit-requirements": "How your name appears on releases and marketing. Proper credit builds your reputation and proves your work.",
  "delivery-schedule": "Deadlines for completing and submitting your work. Missing deadlines can have consequences, so be realistic.",
  "scope-services": "Exactly what services will be provided. Clear scope prevents misunderstandings about what's included.",
  "exclusivity": "Whether you can work with others during the contract. Exclusive deals limit your options but may come with better terms.",
  "reporting": "How and when you receive statements about your earnings. Regular, detailed reports help you track your money.",
  "warranties": "Promises you're making, like this is my original work. Breaking these can have legal consequences.",
  "indemnification": "Who's responsible if something goes wrong legally. This can expose you to liability, so understand what you're agreeing to.",
  "usage-rights": "Specifically how your music can be used in a sync deal. More restrictions mean more control over your art's context.",
  "co-publishing": "A deal where you keep some publishing rights while sharing with a publisher. Better than giving up 100% of publishing.",
  "admin-rights": "Who handles the business side, like collecting royalties and issuing licenses. Good administration means you get paid properly.",
  "payment-terms": "When and how you get paid. Net-30 or net-45 is standard, while longer waits tie up your money.",
  // New legal framework clauses
  "governing-law": "Determines which state or country's laws apply to the contract and where you'd have to go to court if there's a dispute. Pick somewhere convenient for you.",
  "dispute-resolution": "How disagreements get resolved. Arbitration is private but can be expensive. Litigation means court. Mediation tries to find middle ground first.",
  "force-majeure": "Protects both parties if something crazy happens like a pandemic, natural disaster, or war. Neither side gets blamed for things outside their control.",
  "confidentiality": "Keeps your deal terms private. Important for advances, royalty rates, and unreleased music. You don't want competitors knowing your business.",
  "assignment-transfer": "Whether the other party can sell or transfer your contract to someone else. You might end up working with a company you never chose.",
  "general-provisions": "These are the standard legal safeguards that protect both parties. Severability means if a court finds one part of this contract invalid, the rest still stands. The Entire Agreement clause confirms this document is everything - no side deals or verbal promises count unless they're written here. Amendments require both parties to sign off on any changes in writing. The Notices section specifies exactly how to send official communications (email, mail, etc.) so nobody can claim they didn't receive important messages. Waiver protects you if you let something slide once - it doesn't mean you've given up that right forever. Counterparts allows both parties to sign separate copies, and electronic signatures are legally binding.",
};

// Clause conflicts - pairs of clauses that contradict each other
const clauseConflicts: Array<{
  clauses: [string, string];
  warning: string;
}> = [
  {
    clauses: ["work-ownership", "ownership-splits"],
    warning: "Work-for-Hire transfers 100% ownership to the hiring party, but Ownership Splits divides ownership between parties. These clauses contradict each other."
  },
  {
    clauses: ["work-ownership", "co-publishing"],
    warning: "Work-for-Hire means you give up all rights, but Co-Publishing lets you keep some. You probably want one or the other, not both."
  },
  {
    clauses: ["work-ownership", "reversion-clause"],
    warning: "Work-for-Hire permanently transfers ownership, so there's nothing to revert. The Reversion Clause wouldn't apply."
  },
];

// Icon mapping
const iconMap: Record<string, any> = {
  Mic01Icon,
  MusicNote01Icon,
  UserGroupIcon,
  Video01Icon,
  Globe02Icon,
  Equalizer01Icon: Settings03Icon,
  File01Icon,
  Edit01Icon: Edit02Icon,
};

// Expanded Template Card Component (for Step 1)
const ExpandedTemplateCard = ({
  template,
  onUse
}: {
  template: ContractTemplate;
  onUse: () => void;
}) => {
  const icon = iconMap[template.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-2xl p-5 hover:border-purple-500/30 transition-all"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          {icon && <HugeiconsIcon icon={icon} size={24} className="text-purple-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-0.5">{template.name}</h3>
          <p className="text-sm text-muted-foreground">
            {template.parties.party1} ↔ {template.parties.party2}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {template.description}
      </p>

      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Included Clauses</h4>
        <div className="flex flex-wrap gap-1.5">
          {template.defaultClauses.slice(0, 8).map((clauseId) => {
            const clause = getClauseById(clauseId);
            return clause ? (
              <Badge key={clauseId} variant="secondary" className="text-xs">
                {clause.name}
              </Badge>
            ) : null;
          })}
          {template.defaultClauses.length > 8 && (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              +{template.defaultClauses.length - 8} more
            </Badge>
          )}
        </div>
      </div>

      <Button
        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
        onClick={onUse}
      >
        Use This Template
      </Button>
    </motion.div>
  );
};

// Clause Item Component
const ClauseItem = ({
  clause,
  isSelected,
  onToggle,
  isDragging,
}: {
  clause: ContractClause;
  isSelected: boolean;
  onToggle: () => void;
  isDragging?: boolean;
}) => {
  const importanceTextColors = {
    critical: "text-red-400",
    important: "text-amber-400",
    standard: "text-muted-foreground",
  };

  const explanation = clauseExplanations[clause.id] || clause.description;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
            isSelected
              ? "border-purple-500/50 bg-purple-500/10"
              : "border-border hover:border-border hover:bg-muted/50",
            isDragging && "opacity-50"
          )}
          onClick={onToggle}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
              isSelected ? "bg-purple-500 border-purple-500" : "border-muted-foreground/30"
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{clause.name}</span>
              {clause.importance !== "standard" && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className={cn("text-[10px] font-medium uppercase tracking-wide", importanceTextColors[clause.importance])}>
                    {clause.importance}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{clause.description}</p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm !bg-purple-500 !text-white" arrowClassName="!fill-purple-500">
        <p className="text-xs font-medium leading-relaxed">{explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
};

// Helper function to format date values for preview
const formatDateForPreview = (dateValue: string): string => {
  if (!dateValue) return '';
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(dateValue)) {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateValue.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return dateValue;
};

// Helper to parse date string as local date (avoids timezone shift)
const parseLocalDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Get icon for clause category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "financial":
      return DollarCircleIcon;
    case "rights":
      return LicenseIcon;
    case "term":
      return Clock01Icon;
    case "protection":
      return ShieldUserIcon;
    case "obligations":
      return TaskDone02Icon;
    case "general":
    default:
      return Agreement01Icon;
  }
};

// Generate plain English summary of contract
const generatePlainEnglishSummary = (
  selectedClauses: string[],
  clauseValues: Record<string, Record<string, string>>,
  partyNames: { party1: string; party2: string },
  templateParties?: { party1: string; party2: string }
): string => {
  const party1 = partyNames.party1 || templateParties?.party1 || "Party 1";
  const party2 = partyNames.party2 || templateParties?.party2 || "Party 2";

  const summaryParts: string[] = [];

  // Helper to get value from user input or default
  const getValue = (clauseId: string, variableId: string) => {
    const clause = getClauseById(clauseId);
    const values = clauseValues[clauseId] || {};
    return values[variableId] || clause?.variables.find(v => v.id === variableId)?.default || "";
  };

  selectedClauses.forEach((clauseId) => {
    switch (clauseId) {
      case "royalty-rate": {
        const rate = getValue(clauseId, "royaltyPercentage");
        const basis = getValue(clauseId, "royaltyBase");
        if (rate) {
          const basisExplain = basis.toLowerCase().includes("gross")
            ? "gross receipts (total income before any deductions)"
            : "net receipts (income after standard industry costs are deducted)";
          summaryParts.push(`${party1} earns ${rate}% royalties on ${basisExplain}.`);
        }
        break;
      }
      case "advance-payment": {
        const amount = getValue(clauseId, "advanceAmount");
        const schedule = getValue(clauseId, "advanceSchedule");
        const recoupment = getValue(clauseId, "recoupmentSource");
        if (amount) {
          let text = `${party1} receives an upfront advance of ${amount} (${schedule || "upon signing"})`;
          text += `. This advance is recoupable, meaning it gets paid back from ${party1}'s future royalty earnings before ${party1} sees additional payments`;
          summaryParts.push(text + ".");
        }
        break;
      }
      case "commission-rate": {
        const rate = getValue(clauseId, "commissionRate");
        const sunsetRate = getValue(clauseId, "sunsetRate");
        const sunsetPeriod = getValue(clauseId, "sunsetPeriod");
        if (rate) {
          let text = `Management takes ${rate}% of ${party1}'s earnings`;
          if (sunsetRate && sunsetPeriod) text += `. After the contract ends, they still collect ${sunsetRate}% for ${sunsetPeriod} on deals made during the contract (this is called a "sunset" provision)`;
          summaryParts.push(text + ".");
        }
        break;
      }
      case "term-duration": {
        const duration = getValue(clauseId, "initialTerm");
        if (duration) summaryParts.push(`The contract lasts ${duration}.`);
        break;
      }
      case "rights-granted": {
        const grantType = getValue(clauseId, "grantType");
        const exclusivity = getValue(clauseId, "exclusivity");
        const rights = getValue(clauseId, "specificRights");
        if (rights) {
          const exclusiveExplain = exclusivity === "exclusive"
            ? "exclusive (only they can do this, no one else)"
            : "non-exclusive (others can also be granted these rights)";
          summaryParts.push(`${party1} gives ${party2} ${exclusiveExplain} rights to ${rights}.`);
        }
        break;
      }
      case "territory": {
        const territory = getValue(clauseId, "territory");
        if (territory) {
          const explain = territory === "the Universe" ? " (everywhere, including digital/streaming worldwide)" : "";
          summaryParts.push(`These rights apply in ${territory}${explain}.`);
        }
        break;
      }
      case "exclusivity": {
        const terms = getValue(clauseId, "exclusivityTerms");
        if (terms) {
          const isExclusive = !terms.toLowerCase().includes("non-exclusive");
          summaryParts.push(isExclusive
            ? `This is an exclusive deal, meaning ${party1} cannot work with other parties for similar services during the contract.`
            : `This is non-exclusive, so ${party1} can work with others simultaneously.`);
        }
        break;
      }
      case "termination": {
        const notice = getValue(clauseId, "noticePeriod");
        const cure = getValue(clauseId, "curePeriod");
        if (notice) summaryParts.push(`Either party can end the contract with ${notice} days written notice. If there's a problem, the other party gets ${cure} days to fix it (the "cure period") before termination takes effect.`);
        break;
      }
      case "audit-rights": {
        const frequency = getValue(clauseId, "auditFrequency");
        if (frequency) summaryParts.push(`${party1} has the right to hire an accountant to review ${party2}'s financial records ${frequency} to verify payments are accurate.`);
        break;
      }
      case "creative-control": {
        const level = getValue(clauseId, "approvalLevel");
        const matters = getValue(clauseId, "approvalMatters");
        if (level && matters) {
          const levelExplain = level === "mutual approval"
            ? "both parties must agree"
            : level === "sole approval"
            ? `${party1} has final say`
            : level;
          summaryParts.push(`For creative decisions like ${matters}, ${levelExplain}.`);
        }
        break;
      }
      case "credit-requirements": {
        const credit = getValue(clauseId, "creditText");
        if (credit) summaryParts.push(`${party1} must be credited as "${credit}" on all releases and marketing.`);
        break;
      }
      case "confidentiality": {
        const duration = getValue(clauseId, "confidentialityPeriod");
        if (duration) summaryParts.push(`Both parties must keep deal terms and business information private for ${duration}.`);
        break;
      }
      case "dispute-resolution": {
        const method = getValue(clauseId, "resolutionMethod");
        const location = getValue(clauseId, "resolutionLocation");
        if (method) {
          const methodExplain = method.toLowerCase().includes("arbitration")
            ? "arbitration (private resolution with a neutral third party, not public court)"
            : method.toLowerCase().includes("mediation")
            ? "mediation (trying to reach agreement with a mediator's help)"
            : method.toLowerCase();
          summaryParts.push(`If there's a dispute, it's resolved through ${methodExplain}${location ? ` in ${location}` : ""}.`);
        }
        break;
      }
      case "governing-law": {
        const jurisdiction = getValue(clauseId, "governingState");
        if (jurisdiction) summaryParts.push(`The contract follows ${jurisdiction} law, and any legal proceedings would happen there.`);
        break;
      }
      case "payment-terms": {
        const timing = getValue(clauseId, "paymentTiming");
        const method = getValue(clauseId, "paymentMethod");
        if (timing) summaryParts.push(`Payments are due ${timing.toLowerCase()}${method ? ` via ${method.toLowerCase()}` : ""}.`);
        break;
      }
      case "reporting": {
        const frequency = getValue(clauseId, "reportingFrequency");
        const deadline = getValue(clauseId, "reportingDeadline");
        if (frequency) summaryParts.push(`${party2} must send detailed earnings statements ${frequency}${deadline ? `, within ${deadline} days of each period ending` : ""}.`);
        break;
      }
      case "reversion-clause": {
        const period = getValue(clauseId, "exploitationPeriod");
        if (period) summaryParts.push(`If ${party2} doesn't release or use the work within ${period}, all rights automatically return to ${party1}.`);
        break;
      }
      case "ownership-splits": {
        const party1Share = getValue(clauseId, "party1Share");
        const party2Share = getValue(clauseId, "party2Share");
        if (party1Share && party2Share) summaryParts.push(`Ownership is split: ${party1} owns ${party1Share}% and ${party2} owns ${party2Share}% of the work and its earnings.`);
        break;
      }
      case "producer-fee": {
        const fee = getValue(clauseId, "producerFee");
        const points = getValue(clauseId, "royaltyPoints");
        if (fee) {
          let text = `Producer receives a flat fee of ${fee}`;
          if (points) text += ` plus ${points} "points" (percentage points of royalties, meaning ${points}% of sales revenue goes to the producer)`;
          summaryParts.push(text + ".");
        }
        break;
      }
      case "license-fee": {
        const fee = getValue(clauseId, "licenseFee");
        if (fee) summaryParts.push(`A one-time license fee of ${fee} is paid for the usage rights.`);
        break;
      }
      case "distribution-fee": {
        const fee = getValue(clauseId, "distributionFee");
        const artistShare = getValue(clauseId, "artistShare");
        if (fee && artistShare) summaryParts.push(`The distributor keeps ${fee}% of revenue as their fee, and ${party1} receives the remaining ${artistShare}%.`);
        break;
      }
      case "sunset-clause": {
        const schedule = getValue(clauseId, "sunsetSchedule");
        if (schedule) summaryParts.push(`After the contract ends, ${party2}'s commission on existing deals gradually decreases over time rather than stopping immediately.`);
        break;
      }
      case "key-person": {
        const person = getValue(clauseId, "keyPerson");
        if (person && person !== "[Manager Name]") summaryParts.push(`If ${person} leaves ${party2}'s company, ${party1} can exit the contract (this protects ${party1} from being stuck with unfamiliar people).`);
        break;
      }
      case "most-favored-nations": {
        summaryParts.push(`${party1} is guaranteed terms at least as good as anyone else in similar deals (if ${party2} offers someone better terms, ${party1} automatically gets the same).`);
        break;
      }
      case "work-ownership": {
        summaryParts.push(`This is a "work-for-hire" arrangement, meaning ${party2} owns everything ${party1} creates under this contract, including all copyrights. ${party1} gives up ownership rights.`);
        break;
      }
      case "indemnification": {
        summaryParts.push(`Each party agrees to protect the other from legal claims arising from their own actions or breaches.`);
        break;
      }
      case "warranties": {
        summaryParts.push(`${party1} guarantees the work is original, doesn't infringe on others' rights, and that ${party1} has the authority to enter this agreement.`);
        break;
      }
      default:
        break;
    }
  });

  if (summaryParts.length === 0) {
    return "This contract includes standard terms and protections. See the Clauses tab for full details on each provision.";
  }

  // Break into paragraphs every 4-5 sentences, but don't leave a single sentence alone
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  summaryParts.forEach((sentence, index) => {
    currentParagraph.push(sentence);
    const remaining = summaryParts.length - index - 1;

    // Create paragraph break at 4-5 sentences, but not if it would leave 1 sentence alone
    if (currentParagraph.length >= 4 && remaining !== 1) {
      paragraphs.push(currentParagraph.join(" "));
      currentParagraph = [];
    }
  });

  // Add any remaining sentences
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  return paragraphs.join("\n\n");
};

// Date Picker Field with auto-close
const DatePickerField = ({
  value,
  onChange,
  placeholder = "Select date",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full h-9 flex items-center justify-between border-0 border-b-2 border-border bg-transparent px-0 text-sm text-left focus:outline-none focus:border-purple-500 transition-colors",
            !value && "text-muted-foreground"
          )}
        >
          {value ? format(parseLocalDate(value)!, "PPP") : placeholder}
          <HugeiconsIcon icon={Calendar02Icon} size={16} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" side="bottom">
        <Calendar
          mode="single"
          selected={parseLocalDate(value)}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

// Clause Editor Component
const ClauseEditor = ({
  clause,
  values,
  onChange,
  partyNames,
}: {
  clause: ContractClause;
  values: Record<string, string>;
  onChange: (variableId: string, value: string) => void;
  partyNames: { party1: string; party2: string };
}) => {
  // Preview the clause with current values
  const previewText = useMemo(() => {
    let text = clause.template;
    clause.variables.forEach((variable) => {
      let value = values[variable.id] || variable.default || `[${variable.name}]`;
      // Format date values nicely in the preview
      if (variable.type === 'date' && value && value !== `[${variable.name}]`) {
        value = formatDateForPreview(value);
      }
      text = text.replace(new RegExp(`{{${variable.id}}}`, "g"), value);
    });
    text = text.replace(/{{party1}}/g, partyNames.party1 || "[Party 1]");
    text = text.replace(/{{party2}}/g, partyNames.party2 || "[Party 2]");
    return text;
  }, [clause, values, partyNames]);

  return (
    <div className="space-y-4">
      {clause.variables.length > 0 && (
        <div className="grid gap-5 overflow-hidden">
          {clause.variables.map((variable) => (
            <div key={variable.id} className="space-y-2 overflow-hidden">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{variable.name}</Label>
              {variable.type === "select" && variable.options ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "w-full max-w-full h-9 flex items-center justify-between gap-2 border-0 border-b-2 border-border bg-transparent px-0 text-sm text-left focus:outline-none focus:border-purple-500 transition-colors overflow-hidden",
                        !values[variable.id] && "text-muted-foreground"
                      )}
                    >
                      <span>
                        {(() => {
                          const text = values[variable.id] || variable.default || "Select option";
                          return text.length > 130 ? text.substring(0, 130) + "..." : text;
                        })()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[500px] max-h-[300px] overflow-y-auto">
                    <DropdownMenuRadioGroup
                      value={values[variable.id] || variable.default || ""}
                      onValueChange={(value) => onChange(variable.id, value)}
                    >
                      {variable.options.map((option) => (
                        <DropdownMenuRadioItem key={option} value={option} className="whitespace-normal">
                          {option}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : variable.type === "date" ? (
                <DatePickerField
                  value={values[variable.id] || ""}
                  onChange={(value) => onChange(variable.id, value)}
                />
              ) : (
                <Input
                  type={variable.type === "number" || variable.type === "percentage" ? "number" : "text"}
                  placeholder={variable.placeholder}
                  value={values[variable.id] || variable.default || ""}
                  onChange={(e) => onChange(variable.id, e.target.value)}
                  className="h-9 border-0 border-b-2 border-border rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-purple-500 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted rounded-lg border border-border overflow-hidden">
        <p className="text-xs text-muted-foreground px-3 py-2 border-b border-dashed border-border flex items-center gap-2">
          <HugeiconsIcon icon={ChatPreviewIcon} size={14} />
          Preview
        </p>
        <p className="text-sm leading-relaxed p-3">{previewText}</p>
      </div>

      <div className="bg-muted rounded-lg border border-border overflow-hidden">
        <p className="text-xs text-muted-foreground px-3 py-2 border-b border-dashed border-border flex items-center gap-2">
          <HugeiconsIcon icon={LanguageSkillIcon} size={14} />
          In Plain English
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground p-3">{clauseExplanations[clause.id] || clause.description}</p>
      </div>
    </div>
  );
};

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [initialTemplateHandled, setInitialTemplateHandled] = useState(false);

  // Builder state - Step 1 is template selection
  const [builderStep, setBuilderStep] = useState(1);
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [clauseValues, setClauseValues] = useState<Record<string, Record<string, string>>>({});
  const [partyNames, setPartyNames] = useState({ party1: "", party2: "" });
  const [contractTitle, setContractTitle] = useState("");
  const [contractDate, setContractDate] = useState("");

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filter state for clauses
  const [clauseFilter, setClauseFilter] = useState<string>("all");

  // Current clause index for Step 3 stepper
  const [currentClauseIndex, setCurrentClauseIndex] = useState(0);
  // Direction of navigation for animations (1 = forward, -1 = backward)
  const [navigationDirection, setNavigationDirection] = useState(1);

  // Start builder with a template - goes directly to Step 2
  const startWithTemplate = useCallback((template: ContractTemplate) => {
    setSelectedTemplate(template);
    setSelectedClauses(template.defaultClauses);
    setContractTitle(template.name);
    setPartyNames({ party1: "", party2: "" });
    setContractDate("");
    setClauseValues({});
    setPdfUrl(null);
    setBuilderStep(2); // Go directly to Step 2 (Select Clauses)
  }, []);

  // Handle template query parameter from command menu
  useEffect(() => {
    if (initialTemplateHandled) return;

    const templateId = searchParams.get("template");
    if (templateId) {
      const template = contractTemplates.find(t => t.id === templateId);
      if (template) {
        startWithTemplate(template);
        setInitialTemplateHandled(true);
      }
    }
  }, [searchParams, startWithTemplate, initialTemplateHandled]);

  // Toggle clause selection
  const toggleClause = (clauseId: string) => {
    setSelectedClauses((prev) =>
      prev.includes(clauseId)
        ? prev.filter((id) => id !== clauseId)
        : [...prev, clauseId]
    );
  };

  // Update clause values
  const updateClauseValue = (clauseId: string, variableId: string, value: string) => {
    setClauseValues((prev) => ({
      ...prev,
      [clauseId]: {
        ...(prev[clauseId] || {}),
        [variableId]: value,
      },
    }));
  };

  // Get effective clause values (with contract date auto-populated)
  const getEffectiveClauseValues = () => {
    const values = { ...clauseValues };
    // Auto-populate effectiveDate in term-duration clause with contract date
    if (contractDate && selectedClauses.includes("term-duration")) {
      values["term-duration"] = {
        ...(values["term-duration"] || {}),
        effectiveDate: values["term-duration"]?.effectiveDate || contractDate,
      };
    }
    return values;
  };

  // Detect conflicting clauses
  const activeConflicts = useMemo(() => {
    return clauseConflicts.filter(conflict =>
      selectedClauses.includes(conflict.clauses[0]) &&
      selectedClauses.includes(conflict.clauses[1])
    );
  }, [selectedClauses]);

  // Generate contract text
  const contractText = useMemo(() => {
    if (!selectedTemplate) return "";
    return generateContractText(
      selectedTemplate,
      selectedClauses,
      getEffectiveClauseValues(),
      partyNames,
      contractDate
    );
  }, [selectedTemplate, selectedClauses, clauseValues, partyNames, contractDate]);

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractText);
  };

  // Generate PDF blob
  const generatePdfBlob = async (): Promise<Blob> => {
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const fontSize = 11;
    const titleSize = 16;
    const lineHeight = fontSize * 1.4;
    const margin = 72; // 1 inch
    const pageWidth = 612; // Letter size
    const pageHeight = 792;
    const maxWidth = pageWidth - margin * 2;

    // Sanitize text to remove characters that WinAnsi can't encode
    const sanitizeText = (text: string): string => {
      return text
        .replace(/[\u2500-\u257F]/g, '-') // Box drawing characters → dash
        .replace(/[\u2018\u2019]/g, "'")  // Smart quotes → straight quote
        .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes → straight quote
        .replace(/\u2026/g, '...')        // Ellipsis → three dots
        .replace(/[\u2013\u2014]/g, '-')  // En/em dash → hyphen
        .replace(/[^\x00-\x7F]/g, '');    // Remove any other non-ASCII
    };

    // Split text into lines that fit the page width
    const wrapText = (text: string, font: any, size: number, maxW: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, size);

        if (width > maxW && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Split contract into paragraphs (sanitize text first)
    const paragraphs = sanitizeText(contractText).split('\n');
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        y -= lineHeight;
        continue;
      }

      // Check if it's a title/header (all caps or numbered section)
      const isHeader = paragraph === paragraph.toUpperCase() && paragraph.length < 60;
      const isNumberedHeader = /^\d+\.\s+[A-Z]/.test(paragraph);
      const font = isHeader || isNumberedHeader ? timesRomanBold : timesRoman;
      const size = isHeader && !isNumberedHeader ? titleSize : fontSize;

      const lines = wrapText(paragraph, font, size, maxWidth);

      for (const line of lines) {
        // Check if we need a new page
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        page.drawText(line, {
          x: margin,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }

      // Add extra space after paragraphs
      if (isHeader || isNumberedHeader) {
        y -= lineHeight * 0.5;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  };

  // Generate PDF preview when entering step 4
  const generatePdfPreview = async () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setIsGeneratingPdf(true);
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Failed to generate PDF preview:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download as PDF
  const downloadContract = async () => {
    const blob = await generatePdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contractTitle || "contract"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate PDF preview when entering step 4
  useEffect(() => {
    if (builderStep === 4 && contractText) {
      generatePdfPreview();
    }
    // Cleanup on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [builderStep, contractText]);

  // Filtered clauses
  const filteredClauses = useMemo(() => {
    if (clauseFilter === "all") return clauseLibrary;
    return clauseLibrary.filter((c) => c.category === clauseFilter);
  }, [clauseFilter]);

  // Clause categories
  const clauseCategories = [
    { id: "all", label: "All", icon: GridViewIcon },
    { id: "financial", label: "Financial", icon: DollarCircleIcon },
    { id: "rights", label: "Rights", icon: KeyIcon },
    { id: "term", label: "Term", icon: Clock01Icon },
    { id: "protection", label: "Protection", icon: SecurityCheckIcon },
    { id: "obligations", label: "Obligations", icon: TaskDone02Icon },
    { id: "general", label: "General", icon: FileExportIcon },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Breadcrumb Stepper - Always visible */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { step: 1, label: "Choose Template" },
          { step: 2, label: "Select Clauses" },
          { step: 3, label: "Customize" },
          { step: 4, label: "Review & Export" },
        ].map((item, index) => (
          <div key={item.step} className="flex items-center">
            <button
              onClick={() => {
                // Can only go back to Step 1 if no template selected, or go to previous completed steps
                if (item.step === 1) {
                  setBuilderStep(1);
                  setSelectedTemplate(null);
                } else if (item.step <= builderStep) {
                  setBuilderStep(item.step);
                }
              }}
              disabled={item.step > builderStep && item.step !== 1}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors",
                builderStep === item.step
                  ? "bg-purple-500 text-white"
                  : builderStep > item.step
                  ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                builderStep > item.step ? "bg-purple-500/30" : ""
              )}>
                {builderStep > item.step ? <Check className="w-3 h-3" /> : item.step}
              </span>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
            {index < 3 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 mx-0.5" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Template */}
      {builderStep === 1 && (
        <div className="grid md:grid-cols-2 gap-4">
          {contractTemplates.map((template) => (
            <ExpandedTemplateCard
              key={template.id}
              template={template}
              onUse={() => startWithTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Steps 2-4: Builder Flow */}
      {builderStep >= 2 && (
        <>
          {/* Step 2: Select Clauses */}
          {builderStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Select Clauses</h2>
                <div className="flex items-center gap-2">
                  {clauseCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setClauseFilter(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5",
                        clauseFilter === cat.id
                          ? "bg-purple-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <HugeiconsIcon icon={cat.icon} size={14} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conflict Warnings */}
              <AnimatePresence>
                {activeConflicts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {activeConflicts.map((conflict, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            Potential Conflict Detected
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conflict.warning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <TooltipProvider>
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredClauses.map((clause) => (
                    <ClauseItem
                      key={clause.id}
                      clause={clause}
                      isSelected={selectedClauses.includes(clause.id)}
                      onToggle={() => toggleClause(clause.id)}
                    />
                  ))}
                </div>
              </TooltipProvider>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setBuilderStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="text-sm text-muted-foreground">
                  {selectedClauses.length} clauses selected
                </div>
                <Button
                  onClick={() => {
                    setCurrentClauseIndex(0);
                    setBuilderStep(3);
                  }}
                  disabled={selectedClauses.length === 0}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Customize */}
          {builderStep === 3 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
                layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
              }}
              className="rounded-xl overflow-hidden flex flex-col border border-dashed border-border"
              style={{ backgroundColor: "var(--background)" }}
            >
              {/* Header */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentClauseIndex === 0 ? (
                      <>
                        <HugeiconsIcon icon={File01Icon} size={18} className="text-purple-500" />
                        <span className="text-sm font-medium">Contract Details</span>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={getCategoryIcon(getClauseById(selectedClauses[currentClauseIndex - 1])?.category || "")}
                          size={18}
                          className="text-purple-500"
                        />
                        <span className="text-sm font-medium">
                          {getClauseById(selectedClauses[currentClauseIndex - 1])?.name}
                        </span>
                        <span className="text-muted-foreground/40 text-sm">·</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {getClauseById(selectedClauses[currentClauseIndex - 1])?.category}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {currentClauseIndex === 0
                      ? <><span className="clause-number-pill">{selectedClauses.length}</span> clauses to customize</>
                      : <>Clause <span className="clause-number-pill">{currentClauseIndex}</span> of <span className="clause-number-pill">{selectedClauses.length}</span></>
                    }
                  </span>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-1 mt-3">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all",
                      currentClauseIndex === 0 ? "bg-purple-500 flex-[0.5]" : "bg-purple-500/30 flex-[0.5]"
                    )}
                  />
                  {selectedClauses.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all",
                        idx + 1 <= currentClauseIndex
                          ? "bg-purple-500"
                          : "bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto border-t border-dashed border-border">
                <div className="p-6">
                  {currentClauseIndex === 0 ? (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {selectedTemplate?.parties.party1 || "Party 1"} Name
                        </Label>
                        <Input
                          placeholder={`Enter ${selectedTemplate?.parties.party1 || "Party 1"} name`}
                          value={partyNames.party1}
                          onChange={(e) => setPartyNames((p) => ({ ...p, party1: e.target.value }))}
                          className="border-0 border-b border-muted-foreground/30 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-purple-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {selectedTemplate?.parties.party2 || "Party 2"} Name
                        </Label>
                        <Input
                          placeholder={`Enter ${selectedTemplate?.parties.party2 || "Party 2"} name`}
                          value={partyNames.party2}
                          onChange={(e) => setPartyNames((p) => ({ ...p, party2: e.target.value }))}
                          className="border-0 border-b border-muted-foreground/30 rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-purple-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Contract Date
                        </Label>
                        <DatePickerField
                          value={contractDate}
                          onChange={setContractDate}
                        />
                      </div>
                    </div>
                  ) : (() => {
                    const clauseId = selectedClauses[currentClauseIndex - 1];
                    const clause = getClauseById(clauseId);
                    if (!clause) return null;

                    return (
                      <ClauseEditor
                        key={clauseId}
                        clause={clause}
                        values={clauseValues[clauseId] || {}}
                        onChange={(variableId, value) =>
                          updateClauseValue(clauseId, variableId, value)
                        }
                        partyNames={{
                          party1: partyNames.party1 || selectedTemplate?.parties.party1 || "Party 1",
                          party2: partyNames.party2 || selectedTemplate?.parties.party2 || "Party 2",
                        }}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 flex items-center justify-between border-t border-dashed border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNavigationDirection(-1);
                    if (currentClauseIndex === 0) {
                      setBuilderStep(2);
                    } else {
                      setCurrentClauseIndex(currentClauseIndex - 1);
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {currentClauseIndex === 0 ? "Back to Clauses" : "Previous"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setNavigationDirection(1);
                    if (currentClauseIndex < selectedClauses.length) {
                      setCurrentClauseIndex(currentClauseIndex + 1);
                    } else {
                      setBuilderStep(4);
                    }
                  }}
                  className="group bg-white text-black hover:bg-purple-500 hover:text-white hover:border-purple-500 border-white transition-colors"
                >
                  {currentClauseIndex < selectedClauses.length ? "Next Clause" : "Review Contract"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Export */}
          {builderStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Review Your Contract</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button size="sm" onClick={downloadContract} className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Side by side: PDF + Breakdown */}
              <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[600px]">
                {/* Left: PDF Preview */}
                <div className="flex-1 border border-border rounded-xl overflow-hidden bg-muted/30">
                  {isGeneratingPdf ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
                      </div>
                    </div>
                  ) : pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#navpanes=0&scrollbar=1&zoom=67`}
                      className="w-full h-full"
                      title="Contract Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Failed to generate preview</p>
                    </div>
                  )}
                </div>

                {/* Right: Contract Breakdown */}
                <div className="w-[400px] border border-dashed border-border rounded-xl overflow-hidden flex flex-col bg-card">
                  <div className="px-4 py-3 border-b border-dashed border-border bg-purple-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={FileExportIcon} size={16} className="text-purple-400" />
                        <h3 className="text-sm font-medium">Contract Breakdown</h3>
                      </div>
                      <span className="clause-number-pill text-xs">{selectedClauses.length} clauses</span>
                    </div>
                  </div>

                  {/* Tabs for Summary / Clauses */}
                  <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="w-full rounded-none border-b border-dashed border-border bg-transparent h-auto p-0">
                      <TabsTrigger value="summary" className="flex-1 rounded-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 py-2 text-xs">
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="clauses" className="flex-1 rounded-none border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 py-2 text-xs">
                        Clauses
                      </TabsTrigger>
                    </TabsList>

                    {/* Summary Tab */}
                    <TabsContent value="summary" className="flex-1 overflow-auto m-0 scrollbar-hide">
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-3">{contractTitle || selectedTemplate?.name}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                            This agreement is between <span className="text-foreground font-medium">{partyNames.party1 || selectedTemplate?.parties.party1}</span> and <span className="text-foreground font-medium">{partyNames.party2 || selectedTemplate?.parties.party2}</span>
                            {contractDate && <>, effective as of <span className="text-foreground font-medium">{format(parseLocalDate(contractDate)!, "MMMM d, yyyy")}</span></>}.
                          </p>
                        </div>

                        <div className="border-t border-dashed border-border pt-4">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <HugeiconsIcon icon={LanguageSkillIcon} size={12} />
                            In Plain English
                          </p>
                          <div className="text-xs text-muted-foreground leading-relaxed space-y-3">
                            {generatePlainEnglishSummary(
                              selectedClauses,
                              clauseValues,
                              partyNames,
                              selectedTemplate?.parties
                            ).split("\n\n").map((paragraph, idx) => (
                              <p key={idx}>{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Clauses Tab */}
                    <TabsContent value="clauses" className="flex-1 overflow-auto m-0 scrollbar-hide">
                      <div className="pb-8 space-y-4">
                        {/* Contract Overview */}
                        <div className="px-4 pt-4 pb-4 border-b border-dashed border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Overview</span>
                          </div>
                          <p className="text-sm font-medium mb-1">{contractTitle || selectedTemplate?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Agreement between <span className="text-foreground">{partyNames.party1 || selectedTemplate?.parties.party1}</span> and <span className="text-foreground">{partyNames.party2 || selectedTemplate?.parties.party2}</span>
                            {contractDate && <> dated <span className="text-foreground">{format(parseLocalDate(contractDate)!, "MMMM d, yyyy")}</span></>}
                          </p>
                        </div>

                        {/* Selected Clauses Breakdown */}
                        {selectedClauses.map((clauseId, index) => {
                          const clause = getClauseById(clauseId);
                          if (!clause) return null;
                          const explanation = clauseExplanations[clauseId] || clause.description;
                          const importanceTextColors = {
                            critical: "text-red-400",
                            important: "text-amber-400",
                            standard: "text-muted-foreground",
                          };

                          return (
                            <div key={clauseId} className={cn("px-4 pb-4", index < selectedClauses.length - 1 && "border-b border-dashed border-border")}>
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground/60 mt-0.5">{index + 1}.</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{clause.name}</span>
                                    {clause.importance !== "standard" && (
                                      <>
                                        <span className="text-muted-foreground/40">·</span>
                                        <span className={cn("text-[10px] font-medium uppercase tracking-wide", importanceTextColors[clause.importance])}>
                                          {clause.importance}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>

                                  {/* Show all values (user-set or defaults) */}
                                  {clause.variables.length > 0 && (
                                    <div className="mt-2 pl-3 border-l-2 border-purple-500/30">
                                      <p className="text-[10px] font-medium text-purple-400 uppercase tracking-wide mb-1">Values</p>
                                      <div className="space-y-0.5">
                                        {clause.variables.map((variable) => {
                                          const value = clauseValues[clauseId]?.[variable.id] || variable.default;
                                          if (!value) return null;
                                          const displayValue = variable.type === 'date' ? formatDateForPreview(value) : value;
                                          return (
                                            <p key={variable.id} className="text-xs text-muted-foreground">
                                              <span className="text-foreground">{variable.name}:</span> {displayValue.length > 80 ? displayValue.slice(0, 80) + "..." : displayValue}
                                            </p>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div className="flex items-center pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setBuilderStep(3)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
