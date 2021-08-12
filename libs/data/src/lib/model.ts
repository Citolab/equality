/** Zelfevaluatiefase */
export interface SelfEvalPhase {
    title: string;
    sequenceNumber: number;
    description: string;
    evidenceHelp: string;
    steps: SelfEvalStep[];
}

export interface User {
    id: string;
    email: string;
    role: string;
    isAdmin: boolean;
    programs: { code: string, title: string }[]; // can access data of these programs
    courses: { code: string, title: string }[]; // has write access for these courses
}


export interface ProgramData {
    programCode: string;
    documents: Document[];
}

export interface CourseData {
    courseCode: string;
    programCode: string;
    documents: Document[];
    assessmentData: AssessmentData[];
    actieplanDitJaar: string;
    actieplanVorigJaar: string;
}

export interface AssessmentData {
    assessmentId: string;
    deliveryData: DeliveryData;
    selfEvalEvidenceTexts: SelfEvalText[];
    phaseResponses: SelfEvalStepResponse[];
}

export class DeliveryData {
    alpha?: DeliveryDataValue;
    studentCount?: DeliveryDataValue;
    itemCount?: DeliveryDataValue;
    average?: DeliveryDataValue;
    standardDeviation?: DeliveryDataValue;
    percentagePassed?: DeliveryDataValue;

    static create(): DeliveryData {
        return {
            alpha: { applicable: true, value: undefined },
            average: { applicable: true, value: undefined },
            itemCount: { applicable: true, value: undefined },
            percentagePassed: { applicable: true, value: undefined },
            standardDeviation: { applicable: true, value: undefined },
            studentCount: { applicable: true, value: undefined }
        };
    }
}

export interface DeliveryDataValue {
    applicable: boolean;
    value: number | undefined;
}

export interface SelfEvalText {
    phaseTitle: string;
    text: string;
}

export interface SelfEvalStepResponse {
    phaseTitle: string;
    category: string;
    selfEvalCode: string;
    satisfactionLevel: number;
    responseType?: SelfEvalResponseType;
}

/** Zelfevaluatiestap binnen een fase en categorie */
export interface SelfEvalStep {
    sequenceNumber: number;
    title: string;
    selfEval: SelfEval[];
}

export interface SelfEval {
    title: string;
    code: string;
    category: string;
    categorySequence: number;
}

/** Opleiding */
export interface Program {
    code: string;
    title: string;
    courseReferences: CourseReference[];
    documentTypes: string[];
}

export interface ProgramWithAssessmentDeliveryData {
    programCode: string;
    assessmentsWithDeliveryData: AssessmentWithDeliveryData[];
}

export interface AssessmentWithDeliveryData {
    assessmentId: string;
    courseCode: string;
    sequenceNumber: number;
    leerjaar: number;
    semester: number;
    blok: number;
    title: string;
    deliveryData: DeliveryData;
}

export interface ProgramWithSelfEvalCounts {
    programCode: string;
    categories: CategoryWithSelfEval[];
    coursesWithSelfEvalCountsPerCategory: CourseWithSelfEvalCountsPerCategory[];
}

export interface ProgramWithEndTermCoverage {
    programCode: string;
    endTerms: EndTerm[];
    coursesWithEndTermCoverages: CourseWithEndTermCoverage[];
}

export interface EndTerm {
    code: string;
    category: string;
    title: string;
}

export interface CourseWithEndTermCoverage {
    code: string;
    title: string;
    sequenceNumber: number;
    leerjaar: number;
    semester: number;
    blok: number;
    endTermCoverages: EndTermCoverage[];
    assessmentFormCoverage: number[];
}

export interface CourseWithSelfEvalCountsPerCategory {
    code: string;
    title: string;
    sequenceNumber: number;
    leerjaar: number;
    semester: number;
    blok: number;
    categories: CategoryWithResponseCounts[];
}

export interface CategoryWithSelfEval {
    title: string;
    evals: SelfEval[];
}


export interface CategoryWithResponseCounts {
    title: string;
    yesCount: number;
    noCount: number;
    unansweredCount: number;
}
export interface EndTermCoverage {
    code: string;
    category: string;
    covered: boolean;
    assessmentForms: AssessmentForm[];
}

export interface ProgramWithDocumentCoverage {
    programCode: string;
    documentTypes: string[];
    coursesWithDocumentCoverages: CourseWithDocumentCoverage[];
}

export interface CourseWithDocumentCoverage {
    code: string;
    title: string;
    sequenceNumber: number;
    leerjaar: number;
    semester: number;
    blok: number;
    documentCoverages: DocumentCoverage[];
}

export interface DocumentCoverage {
    documentType: string;
    documents: Document[];
}

export interface CourseReference {
    code: string;
    title: string;
    sequenceNumber: number;
    leerjaar: number;
    semester: number;
    blok: number;
}

/** Cursus */
export interface Course {
    programCode: string;
    programTitle: string;
    code: string;
    title: string;
    sequenceNumber: number;
    leerjaar: number;
    semester: number;
    blok: number;
    assessmentForms: AssessmentForm[];
    endTerms: string[];
    assessments: Assessment[];
}

export interface Evidence {
    type: string;
    documents: Document[];
}

export enum AuthenticationResultType {
    LoginSuccess,
    UnknownCredentials
}

export enum SelfEvalResponseType {
    Empty,
    No,
    Yes,
    NA
}

/** Toets */
export interface Assessment {
    id: string;
    sequenceNumber: number;
    title: string;
    form: AssessmentForm;
    endTerms: string[];
}

/** Document reference in blob storage */
export interface Document {
    id: string;
    url: string;
    filename: string;
    filepath: string;
    type: string;
}

/** Toetsvorm */
export type AssessmentForm = 'D' | 'S' | 'FT' | 'O' | 'V' | 'PRES' | 'OV' | 'WB' | 'FB';

// Digitaal tentamen, Schriftelijk tentamen, Formatieve toets,
// Opdracht, Verslag, Presentatie, Onderzoeksverslag, Werkplekbeoordeling, Feedbackgesprek

// tslint:disable-next-line: ban-comma-operator
export const AssessmentFormsToIcons: Map<AssessmentForm, { description: string, icon: string }> =
    new Map([
        ['D', { description: 'Computer based assessment', icon: 'mdi-desktop-classic' }],
        ['S', { description: 'Paper based assessment', icon: 'mdi-lead-pencil' }],
        ['FT', { description: 'Formative assessment', icon: 'mdi-face-profile' }],
        ['O', { description: 'Assignment', icon: 'mdi-clipboard-account-outline' }],
        ['V', { description: 'Report', icon: 'mdi-file-document' }],
        ['PRES', { description: 'Presentation', icon: 'mdi-presentation' }],
        ['OV', { description: 'Research report', icon: 'mdi-newspaper' }],
        ['WB', { description: 'Workplace assessment', icon: 'mdi-hand' }],
        ['FB', { description: 'Feedback', icon: 'mdi-message' }],
    ]);

export interface CourseWithUserData extends Course {
    evidenceDocuments: { type: string, documents: Document[], processing: boolean }[];
    actieplanDitJaar: string;
    actieplanVorigJaar: string;
    assessmentsWithUserData: AssessmentWithUserData[];
}

export interface AssessmentWithUserData extends Assessment {
    deliveryData: DeliveryData;
    phaseResponses: SelfEvalPhaseWithResponse[];
}

export interface SelfEvalPhaseWithResponse extends SelfEvalPhase {
    selfEvalEvidenceText: string;
    stepWithResponses: SelfEvalStepWithResponse[];
}

export interface SelfEvalStepWithResponse extends SelfEvalStep {
    selfEvalWithResponses: SelfEvalWithResponse[];
}

export interface SelfEvalWithResponse extends SelfEval {
    satisfactionLevel: number;
    responseType?: SelfEvalResponseType;
}


export interface AssessmentViewModel {
    loading: boolean;
    assessmentId: string;
    assessmentTitle: string;
    selectedAssessmentMenuTitle: string;
    selectedPhaseTitle: string;
    phases: string[];
    courseTitle: string;
}

export interface ProgramWithData extends Program {
    documents: Document[];
}