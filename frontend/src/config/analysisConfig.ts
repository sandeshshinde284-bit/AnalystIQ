/**
 * ============================================================================
 * PART 1: CONSTANTS AND CONFIGURATION
 * ============================================================================
 *
 * This file centralizes all hardcoded values, making them easy to maintain
 * and update without touching component logic.
 *
 * File: src/config/analysisConfig.ts
 */

/**
 * Startup sectors with their display labels and icons
 * Each sector can be used for filtering, analytics, or categorization
 */
export const STARTUP_SECTORS = {
  SAAS: {
    value: "saas",
    label: "SaaS & Enterprise Software",
    industry: "Software as a Service",
    icon: "💻",
    description: "Cloud-based software solutions for businesses",
  },
  FINTECH: {
    value: "fintech",
    label: "FinTech & Financial Services",
    industry: "Financial Technology",
    icon: "💰",
    description: "Financial technology and payment solutions",
  },
  HEALTHTECH: {
    value: "healthtech",
    label: "HealthTech & Medical Devices",
    industry: "Healthcare & Medical Technology",
    icon: "🏥",
    description: "Healthcare technology and medical innovations",
  },
  EDTECH: {
    value: "edtech",
    label: "EdTech & Learning Platforms",
    industry: "Education Technology",
    icon: "📚",
    description: "Education technology and online learning",
  },
  AI: {
    value: "ai",
    label: "AI/ML & Deep Tech",
    industry: "Artificial Intelligence & Machine Learning",
    icon: "🤖",
    description: "Artificial intelligence and machine learning",
  },
  ECOMMERCE: {
    value: "ecommerce",
    label: "E-Commerce & D2C Brands",
    industry: "E-Commerce & Direct-to-Consumer",
    icon: "🛒",
    description: "Online retail and direct-to-consumer brands",
  },
  MOBILITY: {
    value: "mobility",
    label: "Mobility & Transportation",
    industry: "Mobility & Transportation",
    icon: "🚗",
    description: "Transportation and mobility solutions",
  },
  CLIMATE: {
    value: "climate",
    label: "Climate Tech & Sustainability",
    industry: "Climate Technology & Sustainability",
    icon: "🌱",
    description: "Environmental and sustainability technology",
  },
  CONSUMER: {
    value: "consumer",
    label: "Consumer Apps & Services",
    industry: "Consumer Applications & Services",
    icon: "🛍️",
    description: "Consumer-facing applications and services",
  },
  OTHER: {
    value: "other",
    label: "Other Technology",
    industry: "Other Technology",
    icon: "🔧",
    description: "Other technology sectors",
  },
} as const;

/**
 * Analysis processing steps shown to user during document processing
 * Each step represents a stage in the analysis pipeline
 */
export const ANALYSIS_STEPS = [
  {
    id: "document-extraction",
    title: "Extracting text from documents",
    description: "Parsing and converting documents to text for analysis",
  },
  {
    id: "ai-analysis",
    title: "Performing AI analysis",
    description: "Using AI models to extract insights from text",
  },
  {
    id: "cross-validation",
    title: "Cross-validating data sources",
    description: "Verifying consistency across multiple documents",
  },
  {
    id: "market-benchmarking",
    title: "Benchmarking against market data",
    description: "Comparing startup metrics with market standards",
  },
  {
    id: "risk-assessment",
    title: "Performing risk assessment",
    description: "Identifying and analyzing potential risks",
  },
  {
    id: "report-generation",
    title: "Generating analysis report",
    description: "Compiling final investment recommendation",
  },
] as const;

/**
 * File size limits in bytes (used internally)
 */
export const FILE_SIZE_LIMITS = {
  PITCH_DECK: 30 * 1024 * 1024,
  FINANCIAL_MODEL: 10 * 1024 * 1024,
  FOUNDER_PROFILES: 8 * 1024 * 1024,
  MARKET_RESEARCH: 10 * 1024 * 1024,
  TRACTION_DATA: 5 * 1024 * 1024,
} as const;

/**
 * Helper function to get all sectors as array
 * Useful for dropdowns
 */
export const getAllStartupSectors = () => Object.values(STARTUP_SECTORS);

/**
 * Helper function to find startup sector by value
 */
export const getSectorByValue = (value: string) => {
  return Object.values(STARTUP_SECTORS).find((s) => s.value === value);
};
