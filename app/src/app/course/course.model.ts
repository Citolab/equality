import { Phase } from 'src/shared/model/model';
import { PhaseType, ClaimResponseType } from 'src/shared/model/enums';

export class CourseDashboardViewModel {
    isLoading: boolean;
    title: string;
    phases: Phase[];
    assessments: AssessmentSummary[];
}

export class AssessmentSummary {
    id: string;
    title: string;
    phases: PhaseSummary[];
}

export class PhaseSummary {
    phaseType: PhaseType;
    responses: ClaimResponseSummary[];
}

export class ClaimResponseSummary {
    satisfactionLevel: number;
    response?: ClaimResponseType;
}
