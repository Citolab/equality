import { PhaseType, ClaimResponseType } from './enums';



// -- user action dispatched from store. stored in 'user_actions' collection in firebase
export class UserAction {
    userId: string;
    action: string;
    trucatedPayload: string;
    date: Date;
}



// -- user mapped from authenticated users in firebase
export class User {
    id: string;
    email: string;
    displayName: string;
}


// DOMAIN MODEL


// -- phase entity stored 'phases' collection in firebase
export class Phase {
    id: string;
    title: string;
    type: PhaseType;
    index: number;
    description: string;
    help: string;
    stages: Stage[];
}

export class Stage {
    id: string;
    title: string;
    sequenceNumber: number;
    category: string;
    evidenceDescription: string;
    claims: Claim[];
}

export class Claim {
    id: string;
    title: string;
    docs: string;
    category: string;
}

// -- course entity stored 'user_courses' collection in firebase
export class Course {
    id: string;
    title: string;
    facultyId: string;
    assessments: Assessment[];
}

export class Assessment {
    id: string;
    title: string;
    phases: AssessmentPhase[];
}

export class AssessmentPhase {
    id: string;
    title: string;
    type: PhaseType;
    description: string;
    help: string;
    stages: PhaseStage[];
}

export class PhaseStage {
    id: string;
    title: string;
    sequenceNumber: number;
    category: string;
    evidenceDescription: string;
    evidenceFiles: EvidenceFile[];
    evidenceText: string;
    claimResponses: ClaimResponse[];
}

export class ClaimResponse {
    id: string;
    claimTitle: string;
    category: string;
    satisfactionLevel: number;
    response?: ClaimResponseType;
}

export class EvidenceFile {
    id: string;
    filename: string;
    url: string;
}
