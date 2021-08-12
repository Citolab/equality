import { State, Action, StateContext, Selector, Actions, NgxsOnInit, ofActionSuccessful } from '@ngxs/store';
import { FirebaseService } from '../services/firebase.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, debounceTime, mergeMap } from 'rxjs/operators';
import {
    SelfEvalPhase, Document, CourseData, AssessmentData, SelfEvalStepResponse,
    SelfEvalText, SelfEvalResponseType, DeliveryData, SelfEvalPhaseWithResponse, CourseWithUserData, AssessmentWithUserData,
    AssessmentViewModel, SelfEvalStepWithResponse, SelfEvalWithResponse
} from '@equality/data';
import { UserService } from '../services/user.service';
import { flatten } from '@angular/compiler';
import { Injectable } from '@angular/core';

export class LoadCourseAction {
    static type = '[Course] Load';
    constructor(public courseCode: string) { }
}
export class SelectAssessmentAction {
    static type = '[Course] select assessment';
    constructor(public assessmentId: string) { }
}

export class SelectPhaseAction {
    static type = '[Course] select phase';
    constructor(public phaseTitle: string) { }
}

export class UpdateStepResponseAction {
    static type = '[Course] Update step response';
    constructor(
        public evaluationCode: string,
        public stepSequenceNumber: number,
        public responseType: SelfEvalResponseType,
        public satisfactionLevel: number
    ) { }
}

export class UpdateSelfEvalEvidenceTextAction {
    static type = '[Course] Update self eval evidence text';
    constructor(public evidenceText: string) { }
}

export class UpdateActieplanTextAction {
    static type = '[Course] Update course evidence text';
    constructor(public actieText: string) { }
}

export class UpdateDeliveryDataAction {
    static type = '[Course] Update delivery data';
    constructor(public deliveryData: DeliveryData) { }
}

export class AddEvidenceFilesAction {
    static type = '[Course] Add evidence files';
    constructor(public files: File[], public type: string) { }
}

export class DeleteEvidenceFileAction {
    static type = '[Course] Delete evidence file';
    constructor(public fileId: string, public type: string) { }
}

export interface CourseStateModel {
    loading: boolean;
    courses: [{ id: string, name: string }];
    selectedCourse: CourseWithUserData;
    selectedAssessmentId: string;
    selectedPhaseTitle: string;
    selectedAssessmentMenuTitle: string;
    phases: SelfEvalPhase[];
}

export const initialState: CourseStateModel = {
    loading: true,
    courses: null,
    selectedCourse: null,
    selectedAssessmentId: '',
    selectedPhaseTitle: '',
    selectedAssessmentMenuTitle: '',
    phases: []
};

@State<CourseStateModel>({
    name: 'courseState',
    defaults: initialState
})
@Injectable()
export class CourseState implements NgxsOnInit {
    constructor(private firebaseService: FirebaseService, private actions$: Actions, private userService: UserService) { }

    @Selector()
    static getAssessmentViewModel(state: CourseStateModel) {
        const selectedAssessment = !state.loading ?
            state.selectedCourse.assessments.find(a => a.id === state.selectedAssessmentId) : null;
        return selectedAssessment ? ({
            assessmentId: selectedAssessment.id,
            assessmentTitle: selectedAssessment.title,
            selectedPhaseTitle: state.selectedPhaseTitle,
            selectedAssessmentMenuTitle: state.selectedAssessmentMenuTitle,
            loading: state.loading,
            phases: state.phases.map(p => p.title),
            courseTitle: state.selectedCourse.title
        } as AssessmentViewModel) : ({
            assessmentId: '',
            assessmentTitle: '',
            selectedAssessmentMenuTitle: '',
            selectedPhaseTitle: '',
            loading: true,
            phases: null,
            courseTitle: ''
        }) as AssessmentViewModel;
    }

    @Selector()
    static selectedCourse(state: CourseStateModel) {
        return !state.loading ?
            state.selectedCourse : null;
    }

    @Selector()
    static selectedPhase(state: CourseStateModel): SelfEvalPhaseWithResponse {
        const selectedAssessment = !state.loading ?
            state.selectedCourse.assessmentsWithUserData.find(a => a.id === state.selectedAssessmentId) : null;
        return selectedAssessment.phaseResponses.find(p => p.title === state.selectedPhaseTitle);
    }

    @Selector()
    static deliveryData(state: CourseStateModel): DeliveryData {
        const selectedAssessment = !state.loading ?
            state.selectedCourse.assessmentsWithUserData.find(a => a.id === state.selectedAssessmentId) : null;
        return selectedAssessment.deliveryData || DeliveryData.create();
    }

    ngxsOnInit(ctx: StateContext<CourseStateModel>) {
        this.actions$.pipe(ofActionSuccessful(
            UpdateStepResponseAction,
            UpdateSelfEvalEvidenceTextAction,
            UpdateActieplanTextAction,
            UpdateDeliveryDataAction
        )).pipe(debounceTime(500)).subscribe(() => {
            this.firebaseService.updateCourseData(this.courseToCourseData(ctx.getState().selectedCourse));
        });
        this.actions$.pipe(ofActionSuccessful(
            DeleteEvidenceFileAction))
            .subscribe(() => {
                this.firebaseService.updateCourseData(this.courseToCourseData(ctx.getState().selectedCourse));
            });
    }

    @Action(LoadCourseAction)
    loadCourseAction(ctx: StateContext<CourseStateModel>, action: LoadCourseAction) {
        const state = ctx.getState();
        if (!state.selectedCourse || state.selectedCourse.code !== action.courseCode) {
            ctx.patchState({ loading: !state.selectedCourse });
            // load definitions: courses, phases
            // get User data: getDataByCode;
            return forkJoin([
                this.firebaseService.getCourseByCode(action.courseCode).pipe(
                    mergeMap(course => {
                        return this.firebaseService.getProgramByCode(course.programCode).pipe(
                            map(program => {
                                return {
                                    course,
                                    program
                                };
                            })
                        );
                    }
                    )),
                this.firebaseService.getCourseDataByCode(action.courseCode),
                this.firebaseService.selfEvalPhases()])
                .pipe(map(([courseAndProgram, courseData, phases]) => {
                    const course = courseAndProgram.course;
                    const program = courseAndProgram.program;
                    phases.sort((a, b) => (a.sequenceNumber > b.sequenceNumber) ? 1 : -1);
                    return ctx.patchState({
                        loading: false,
                        phases,
                        selectedCourse: {
                            ...course,
                            evidenceDocuments: program.documentTypes.map(type => {
                                return ({
                                    type, documents: courseData && courseData.documents ?
                                        courseData.documents.filter(d => d.type === type) : [],
                                    processing: false
                                });
                            }),
                            actieplanDitJaar: courseData ? courseData.actieplanDitJaar : '',
                            actieplanVorigJaar: courseData ? courseData.actieplanVorigJaar : '',
                            assessmentsWithUserData: course.assessments.map(a => {
                                const assessmentData = courseData ?
                                    courseData.assessmentData.find(d => d.assessmentId === a.id) : null;
                                const selfEvalEvidenceTexts = assessmentData ?
                                    assessmentData.selfEvalEvidenceTexts : null;
                                return ({
                                    ...a,
                                    deliveryData: assessmentData ? assessmentData.deliveryData : null,
                                    phaseResponses: phases.map(p => {
                                        const rs: SelfEvalStepWithResponse[] = p.steps.map(step => {
                                            return ({
                                                ...step,
                                                selfEvalWithResponses: step.selfEval.map(selfEval => {
                                                    const response = assessmentData ? assessmentData.phaseResponses.find(phaseResponse =>
                                                        phaseResponse.phaseTitle === p.title &&
                                                        phaseResponse.selfEvalCode === selfEval.code) : null;
                                                    return ({
                                                        ...selfEval,
                                                        satisfactionLevel: response ? response.satisfactionLevel : null,
                                                        responseType: response ? response.responseType : null,
                                                    } as SelfEvalWithResponse);
                                                } )
                                            });
                                        });
                                        return ({
                                            ...p,
                                            selfEvalEvidenceText: selfEvalEvidenceTexts &&
                                                selfEvalEvidenceTexts.find(pr => pr.phaseTitle === p.title) ?
                                                selfEvalEvidenceTexts.find(pr => pr.phaseTitle === p.title).text : '',
                                            stepWithResponses: rs
                                        } as SelfEvalPhaseWithResponse);
                                    })
                                }) as AssessmentWithUserData;
                            })
                        }
                    });
                }));
        }
        return of(ctx.getState());
    }



    @Action(UpdateActieplanTextAction)
    updateActieplanTextAction(ctx: StateContext<CourseStateModel>, action: UpdateActieplanTextAction) {
        const state = ctx.getState();
        // find answered question in course structure.
        const selectedCourse = {
            ...state.selectedCourse,
            actieplanDitJaar: action.actieText
        };
        ctx.patchState({ selectedCourse });
    }


    @Action(UpdateStepResponseAction)
    updateStepResponseAction(ctx: StateContext<CourseStateModel>, action: UpdateStepResponseAction) {
        const state = ctx.getState();
        const assessment = state.selectedCourse.assessments.find(assess => assess.id === state.selectedAssessmentId);
        // find answered question in course structure.
        const selectedCourse: CourseWithUserData = {
            ...state.selectedCourse, assessmentsWithUserData:
                state.selectedCourse.assessmentsWithUserData.map(a => a.id === state.selectedAssessmentId ?
                    ({
                        ...a, phaseResponses: a.phaseResponses.map(pr => pr.title === state.selectedPhaseTitle ?
                            ({
                                ...pr,
                                stepWithResponses: pr.stepWithResponses.map(sr =>
                                    sr.sequenceNumber === action.stepSequenceNumber ?
                                        {
                                            ...sr, selfEvalWithResponses:
                                                sr.selfEvalWithResponses.map(selfEval =>
                                                    selfEval.code === action.evaluationCode ?
                                                        {
                                                            ...selfEval,
                                                            responseType: action.responseType,
                                                            satisfactionLevel: action.satisfactionLevel
                                                        } : selfEval)
                                        }
                                        : sr
                                )
                            }) : pr)
                    }) as AssessmentWithUserData : a)
        };
        if (assessment) {
            ctx.patchState({ selectedCourse });
        }
    }

    @Action(UpdateSelfEvalEvidenceTextAction)
    updateSelfEvalEvidenceTextAction(ctx: StateContext<CourseStateModel>, action: UpdateSelfEvalEvidenceTextAction) {
        const state = ctx.getState();
        const assessment = state.selectedCourse.assessments.find(assess => assess.id === state.selectedAssessmentId);
        // find answered question in course structure.
        const selectedCourse: CourseWithUserData = {
            ...state.selectedCourse, assessmentsWithUserData:
                state.selectedCourse.assessmentsWithUserData.map(a => a.id === state.selectedAssessmentId ?
                    ({
                        ...a, phaseResponses: a.phaseResponses
                            .map(pr => pr.title === state.selectedPhaseTitle ?
                                ({ ...pr, selfEvalEvidenceText: action.evidenceText }) : pr
                            )
                    }) as AssessmentWithUserData : a)
        };
        if (assessment) {
            ctx.patchState({ selectedCourse });
        }
    }

    @Action(UpdateDeliveryDataAction)
    updateDeliveryDataAction(ctx: StateContext<CourseStateModel>, action: UpdateDeliveryDataAction) {
        const state = ctx.getState();
        const assessment = state.selectedCourse.assessments.find(assess => assess.id === state.selectedAssessmentId);
        // find answered question in course structure.
        const selectedCourse: CourseWithUserData = {
            ...state.selectedCourse, assessmentsWithUserData:
                state.selectedCourse.assessmentsWithUserData.map(a => a.id === state.selectedAssessmentId ?
                    ({
                        ...a, deliveryData: action.deliveryData
                    }) as AssessmentWithUserData : a)
        };
        if (assessment) {
            ctx.patchState({ selectedCourse });
        }
    }


    // uploadEvidence
    @Action(AddEvidenceFilesAction)
    addEvidenceFilesAction(ctx: StateContext<CourseStateModel>, action: AddEvidenceFilesAction) {
        const state = ctx.getState();
        // start upload
        const uploadData: { id: string, name: string, progress: Observable<number>, downloadUrl: Observable<string> }[] = [];
        for (const f of action.files) {
            const id = Math.random().toString(36).substring(2);
            uploadData.push(this.firebaseService.uploadEvidence(f, id));
        }
        // set progress so we can show a progress bar
        const courseInProgress: CourseWithUserData = {
            ...state.selectedCourse,
            evidenceDocuments: state.selectedCourse.evidenceDocuments.map(evidence =>
                evidence.type === action.type ?
                    {
                        ...evidence,
                        processing: true
                    } :
                    evidence
            )
        };
        ctx.patchState({ selectedCourse: courseInProgress });
        return forkJoin(uploadData.map(u => u.downloadUrl))
            .pipe(map((urls) => {
                const documents = urls.map((url, index) => {
                    // when the file is uploaded add the file to assessment phase
                    return {
                        id: uploadData[index].id,
                        filename: uploadData[index].name,
                        filepath: url,
                        type: action.type
                    } as Document;
                });

                const selectedCourse: CourseWithUserData = {
                    ...state.selectedCourse,
                    evidenceDocuments: state.selectedCourse.evidenceDocuments.map(evidence =>
                        evidence.type === action.type ?
                            {
                                ...evidence,
                                documents: evidence.documents ?
                                    [...evidence.documents, ...documents] :
                                    documents,
                                processing: false
                            } :
                            evidence
                    )
                };
                this.firebaseService.updateCourseData(this.courseToCourseData(selectedCourse));
                ctx.patchState({ selectedCourse });
                return selectedCourse;
            }));
    }

    @Action(DeleteEvidenceFileAction)
    deleteEvidenceFileAction(ctx: StateContext<CourseStateModel>, action: DeleteEvidenceFileAction) {
        this.firebaseService.deleteEvidence(action.fileId);
        const state = ctx.getState();
        const selectedCourse: CourseWithUserData = {
            ...state.selectedCourse,
            evidenceDocuments: state.selectedCourse.evidenceDocuments.map(evidence =>
                evidence.type === action.type ?
                    {
                        ...evidence,
                        documents: evidence.documents.filter(f => f.id !== action.fileId),
                        processing: false
                    } :
                    evidence
            )
        };
        ctx.patchState({ selectedCourse });
    }


    @Action(SelectAssessmentAction)
    selectAssessmentAction(ctx: StateContext<CourseStateModel>, action: SelectAssessmentAction) {
        ctx.patchState({ selectedAssessmentId: action.assessmentId });
    }

    @Action(SelectPhaseAction)
    selectPhaseAction(ctx: StateContext<CourseStateModel>, action: SelectPhaseAction) {
        return ctx.patchState({ selectedPhaseTitle: action.phaseTitle });
    }

    private courseToCourseData(course: CourseWithUserData): CourseData {
        const assessmentData: AssessmentData[] = course.assessmentsWithUserData.map(a => {
            const phaseResponses =
                flatten(flatten(a.phaseResponses.map(pr => pr.stepWithResponses.map(sr => sr.selfEvalWithResponses.map(selfEval => {
                    return ({
                        phaseTitle: pr.title,
                        selfEvalCode: selfEval.code,
                        satisfactionLevel: selfEval.satisfactionLevel,
                        responseType: selfEval.responseType,
                        category: selfEval.category
                    } as SelfEvalStepResponse);
                })))));
            return ({
                assessmentId: a.id,
                deliveryData: a.deliveryData,
                phaseResponses,
                selfEvalEvidenceTexts: a.phaseResponses.map(p => ({
                    phaseTitle: p.title,
                    text: p.selfEvalEvidenceText
                }) as SelfEvalText)
            });
        });

        return ({
            programCode: course.programCode,
            courseCode: course.code,
            documents: flatten(course.evidenceDocuments.map(e => e.documents)),
            actieplanDitJaar: course.actieplanDitJaar,
            actieplanVorigJaar: course.actieplanVorigJaar,
            assessmentData
        }) as CourseData;
    }
}
