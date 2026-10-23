import {
  SensitivityCategorySchema,
  type ClassificationAssistTrace,
  type SensitiveField,
  type SensitivityCategory
} from "../../contracts/src/index.js";

const FIELD_RULES: Readonly<Record<string, SensitivityCategory>> = {
  status: "PUBLIC",
  serviceName: "PUBLIC",
  recordType: "PUBLIC",
  preferredLanguage: "PERSONAL",
  eventTitle: "PERSONAL",
  attendeeName: "PERSONAL",
  contactName: "PERSONAL",
  emailAddress: "PERSONAL",
  phoneNumber: "PERSONAL",
  homeAddress: "PERSONAL",
  birthDate: "PERSONAL",
  appointmentType: "HEALTH",
  provider: "HEALTH",
  specialty: "HEALTH",
  startsAt: "PERSONAL",
  location: "HEALTH",
  notes: "HEALTH",
  diagnosis: "HEALTH",
  medication: "HEALTH",
  dosage: "HEALTH",
  labResult: "HEALTH",
  symptoms: "HEALTH",
  procedure: "HEALTH",
  amount: "FINANCIAL",
  balance: "FINANCIAL",
  accountNumber: "FINANCIAL",
  cardLastFour: "FINANCIAL",
  paymentDueDate: "FINANCIAL",
  transactionReference: "FINANCIAL",
  confirmationCode: "AUTH_SECRET",
  accessToken: "AUTH_SECRET",
  refreshToken: "AUTH_SECRET",
  password: "AUTH_SECRET",
  pin: "AUTH_SECRET",
  oneTimeCode: "AUTH_SECRET",
  sessionId: "AUTH_SECRET",
  privateUrl: "AUTH_SECRET",
  apiKey: "AUTH_SECRET"
};

export interface ClassificationResult {
  fields: SensitiveField[];
  unknownPaths: string[];
}

export interface MetadataClassificationInput {
  path: string;
  source: string;
  recordType: string;
}

export interface MetadataClassificationSuggestion {
  category: SensitivityCategory;
  confidence: number;
  provider: "AWS_BEDROCK";
  modelId: string;
}

export interface MetadataClassificationAssistant {
  classify(input: MetadataClassificationInput): Promise<MetadataClassificationSuggestion>;
}

export interface AssistedClassificationResult extends ClassificationResult {
  assistTrace: ClassificationAssistTrace;
}

export function classifyStructuredRecord(
  record: Readonly<Record<string, string>>,
  source: string
): ClassificationResult {
  const unknownPaths: string[] = [];
  const fields = Object.entries(record).map(([path, value]) => {
    // Never allow inherited object keys such as `toString` to masquerade as rules.
    const configured = Object.hasOwn(FIELD_RULES, path) ? FIELD_RULES[path] : undefined;
    const category: SensitivityCategory = configured ?? "PERSONAL";
    if (!configured) unknownPaths.push(path);
    return { path, value, category, source };
  });

  return { fields, unknownPaths };
}

/**
 * Uses an assistant only to make unknown fields more restrictive. It can never
 * downgrade an unknown field to PUBLIC, and failures retain the PERSONAL
 * fail-closed category assigned by classifyStructuredRecord.
 */
export async function classifyStructuredRecordWithAssistant(
  record: Readonly<Record<string, string>>,
  source: string,
  recordType: string,
  assistant?: MetadataClassificationAssistant
): Promise<AssistedClassificationResult> {
  const classification = classifyStructuredRecord(record, source);
  const trace: ClassificationAssistTrace = {
    used: false,
    provider: null,
    modelId: null,
    assistedPaths: [],
    failedPaths: [],
    valuesSent: false
  };

  if (!assistant) return { ...classification, assistTrace: trace };

  for (const path of classification.unknownPaths) {
    try {
      // Deliberately omit the record value: the model receives metadata only.
      const suggestion = await assistant.classify({ path, source, recordType });
      const parsedCategory = SensitivityCategorySchema.safeParse(suggestion.category);
      const acceptable =
        parsedCategory.success &&
        parsedCategory.data !== "PUBLIC" &&
        Number.isFinite(suggestion.confidence) &&
        suggestion.confidence >= 0.8;

      if (!acceptable) {
        trace.failedPaths.push(path);
        continue;
      }

      const field = classification.fields.find((candidate) => candidate.path === path);
      if (field) field.category = parsedCategory.data;
      trace.used = true;
      trace.provider = suggestion.provider;
      trace.modelId = suggestion.modelId;
      trace.assistedPaths.push(path);
    } catch {
      trace.failedPaths.push(path);
    }
  }

  return { ...classification, assistTrace: trace };
}

export function categoriesIn(fields: readonly SensitiveField[]): SensitivityCategory[] {
  return [...new Set(fields.map((field) => field.category))];
}

export function knownSensitivityRules(): Readonly<Record<string, SensitivityCategory>> {
  return FIELD_RULES;
}
