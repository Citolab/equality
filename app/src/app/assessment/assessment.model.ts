import { PhaseType } from 'src/shared/model/enums';

export class AssessmentViewModel {
    loading: boolean;
    assessmentId: string;
    assessmentTitle: string;
    selectedPhaseType: PhaseType;
    phases: PhaseDefinition[];
    courseTitle: string;
}

export class PhaseDefinition {
    id: string;
    title: string;
    type: PhaseType;
}
