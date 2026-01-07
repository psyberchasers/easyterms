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
} from "@hugeicons-pro/core-stroke-rounded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  "general-provisions": "Standard legal housekeeping: what happens if part of the contract is invalid, how to send official notices, and that this is the complete agreement.",
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

// Template Card Component
const TemplateCard = ({
  template,
  onSelect,
  onUse
}: {
  template: ContractTemplate;
  onSelect: () => void;
  onUse: () => void;
}) => {
  const icon = iconMap[template.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group border border-border rounded-xl p-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
          {icon && <HugeiconsIcon icon={icon} size={20} className="text-purple-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1">{template.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] bg-muted">
            {template.parties.party1}
          </Badge>
          <span className="text-muted-foreground/40">↔</span>
          <Badge variant="secondary" className="text-[10px] bg-muted">
            {template.parties.party2}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
        >
          Use Template
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
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
  const importanceColors = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    important: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    standard: "bg-muted text-muted-foreground border-border",
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
              <Badge variant="outline" className={cn("text-[10px]", importanceColors[clause.importance])}>
                {clause.importance}
              </Badge>
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
    return new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return dateValue;
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
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{clause.name}</h4>
        <Badge variant="outline" className="text-[10px]">
          {clause.category}
        </Badge>
      </div>

      {clause.variables.length > 0 && (
        <div className="grid gap-5">
          {clause.variables.map((variable) => (
            <div key={variable.id} className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{variable.name}</Label>
              {variable.type === "select" && variable.options ? (
                <select
                  value={values[variable.id] || variable.default || ""}
                  onChange={(e) => onChange(variable.id, e.target.value)}
                  className="w-full h-9 px-0 border-0 border-b-2 border-border rounded-none bg-transparent text-sm focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {variable.options.map((option) => (
                    <option key={option} value={option}>
                      {option.length > 60 ? option.substring(0, 60) + "..." : option}
                    </option>
                  ))}
                </select>
              ) : variable.type === "date" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full h-9 flex items-center justify-between border-0 border-b-2 border-border bg-transparent px-0 text-sm text-left focus:outline-none focus:border-purple-500 transition-colors",
                        !values[variable.id] && "text-muted-foreground"
                      )}
                    >
                      {values[variable.id] ? format(new Date(values[variable.id]), "PPP") : "Select date"}
                      <HugeiconsIcon icon={Calendar02Icon} size={16} className="text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    <Calendar
                      mode="single"
                      selected={values[variable.id] ? new Date(values[variable.id]) : undefined}
                      onSelect={(date) => onChange(variable.id, date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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

      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <p className="text-xs text-muted-foreground mb-1">Preview</p>
        <p className="text-sm leading-relaxed">{previewText}</p>
      </div>
    </div>
  );
};

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"browse" | "builder">("browse");
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [initialTemplateHandled, setInitialTemplateHandled] = useState(false);

  // Builder state
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

  // Start builder with a template
  const startWithTemplate = useCallback((template: ContractTemplate) => {
    setSelectedTemplate(template);
    setSelectedClauses(template.defaultClauses);
    setContractTitle(template.name);
    setPartyNames({ party1: "", party2: "" });
    setContractDate("");
    setClauseValues({});
    setPdfUrl(null);
    setBuilderStep(1);
    setActiveTab("builder");
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

    // Split contract into paragraphs
    const paragraphs = contractText.split('\n');
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
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "browse" | "builder")}>
        <div className="flex items-center justify-between mb-6">
          {/* Breadcrumbs - Left side (only in builder mode) */}
          {activeTab === "builder" ? (
            <div className="flex items-center gap-1">
              {[
                { step: 1, label: "Choose Template" },
                { step: 2, label: "Select Clauses" },
                { step: 3, label: "Customize" },
                { step: 4, label: "Review & Export" },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <button
                    onClick={() => setBuilderStep(item.step)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-colors",
                      builderStep === item.step
                        ? "bg-purple-500 text-white"
                        : builderStep > item.step
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-muted text-muted-foreground"
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
          ) : (
            <div /> /* Empty spacer when not in builder mode */
          )}

          {/* Tabs - Right side */}
          <TabsList>
            <TabsTrigger value="browse" className="gap-2">
              <HugeiconsIcon icon={GridViewIcon} className="w-4 h-4" />
              Browse Templates
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-2">
              <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />
              Contract Builder
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Browse Templates Tab */}
        <TabsContent value="browse" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => setSelectedTemplate(template)}
                onUse={() => startWithTemplate(template)}
              />
            ))}
          </div>

          {/* Template Detail Modal */}
          <AnimatePresence>
            {selectedTemplate && activeTab === "browse" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                onClick={() => setSelectedTemplate(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-background border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        {iconMap[selectedTemplate.icon] && (
                          <HugeiconsIcon
                            icon={iconMap[selectedTemplate.icon]}
                            size={24}
                            className="text-purple-400"
                          />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedTemplate.parties.party1} ↔ {selectedTemplate.parties.party2}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedTemplate.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Included Clauses</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.defaultClauses.map((clauseId) => {
                        const clause = getClauseById(clauseId);
                        return clause ? (
                          <Badge key={clauseId} variant="secondary" className="text-xs">
                            {clause.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => startWithTemplate(selectedTemplate)}
                    >
                      Use This Template
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Contract Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          {/* Step 1: Choose Template */}
          {builderStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Choose a Starting Template</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      // Only reset if changing to a different template
                      if (selectedTemplate?.id !== template.id) {
                        setSelectedTemplate(template);
                        setSelectedClauses(template.defaultClauses);
                        setContractTitle(template.name);
                      }
                    }}
                    className={cn(
                      "border rounded-xl p-4 cursor-pointer transition-all",
                      selectedTemplate?.id === template.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border hover:border-purple-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        {iconMap[template.icon] && (
                          <HugeiconsIcon
                            icon={iconMap[template.icon]}
                            size={20}
                            className="text-purple-400"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{template.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {template.defaultClauses.length} clauses
                        </p>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <Check className="w-5 h-5 text-purple-500 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setBuilderStep(2)}
                  disabled={!selectedTemplate}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{ minHeight: "500px", border: "1px solid var(--step3-border)", backgroundColor: "var(--step3-header)" }}
            >
              {/* Header */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentClauseIndex === 0 ? (
                      <span className="text-sm font-medium">Contract Details</span>
                    ) : (
                      <>
                        <span className="text-sm font-medium">
                          {getClauseById(selectedClauses[currentClauseIndex - 1])?.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {getClauseById(selectedClauses[currentClauseIndex - 1])?.category}
                        </Badge>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {currentClauseIndex === 0
                      ? `${selectedClauses.length} clauses to customize`
                      : `Clause ${currentClauseIndex} of ${selectedClauses.length}`
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
              <div className="flex-1 overflow-auto rounded-t-xl" style={{ backgroundColor: "var(--step3-content)", borderTop: "1px solid var(--step3-border)" }}>
                <div className="p-6">
                <AnimatePresence mode="wait">
                  {currentClauseIndex === 0 ? (
                    <motion.div
                      key="contract-details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="grid md:grid-cols-3 gap-6"
                    >
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "w-full h-9 flex items-center justify-between border-0 border-b border-muted-foreground/30 bg-transparent px-0 text-sm text-left focus:outline-none focus:border-purple-500 transition-colors",
                                !contractDate && "text-muted-foreground"
                              )}
                            >
                              {contractDate ? format(new Date(contractDate), "PPP") : "Select date"}
                              <HugeiconsIcon icon={Calendar02Icon} size={16} className="text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end" side="bottom">
                            <Calendar
                              mode="single"
                              selected={contractDate ? new Date(contractDate) : undefined}
                              onSelect={(date) => setContractDate(date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </motion.div>
                  ) : (() => {
                    const clauseId = selectedClauses[currentClauseIndex - 1];
                    const clause = getClauseById(clauseId);
                    if (!clause) return null;

                    return (
                      <motion.div
                        key={clauseId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ClauseEditor
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
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--step3-border)" }}>
                <Button
                  variant="outline"
                  onClick={() => {
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
                  <Button size="sm" onClick={downloadContract} className="bg-purple-500 hover:bg-purple-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="border border-border rounded-xl overflow-hidden bg-muted/30">
                {isGeneratingPdf ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[600px]"
                    title="Contract Preview"
                  />
                ) : (
                  <div className="h-[600px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Failed to generate preview</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setBuilderStep(3)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Edit
                </Button>
                <Button onClick={downloadContract} className="bg-purple-500 hover:bg-purple-600">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
