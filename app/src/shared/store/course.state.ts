import { State, Action, StateContext, Selector, Actions, NgxsOnInit, ofActionSuccessful } from '@ngxs/store';
import { Course, Phase, Stage } from '../model/model';
import { CourseService } from '../services/course.service';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, map, debounceTime } from 'rxjs/operators';
import { PhaseType, ClaimResponseType } from '../model/enums';
import { AssessmentViewModel } from 'src/app/assessment/assessment.model';
import { CourseDashboardViewModel } from 'src/app/course/course.model';
import { flatten } from '@angular/compiler';

export class LoadCourseAction {
    static type = '[Course] Load';
    constructor() { }
}

export class AddAssessmentAction {
    static type = '[Course] Add assessment';
    constructor(public assessmentName: string) { }
}

export class DeleteAssessmentAction {
    static type = '[Course] delete assessment';
    constructor(public assessmentId: string) { }
}

export class SelectAssessmentAction {
    static type = '[Course] select assessment';
    constructor(public assessmentId: string) { }
}

export class SelectPhaseAction {
    static type = '[Course] select phase';
    constructor(public phaseType: PhaseType) { }
}

export class SelectStageAction {
    static type = '[Course] select stage';
    constructor(public stageSequenceNumber: number) { }
}


export class UpdateAssessmentNameAction {
    static type = '[Course] Update assessment name';
    constructor(
        public assessmentId: string,
        public assessmentName: string
    ) { }
}

export class UpdateClaimResponseAction {
    static type = '[Course] Update claim response';
    constructor(
        public claimId: string,
        public claimResponseType: ClaimResponseType,
        public satisfactionLevel: number
    ) { }
}

export class UpdateStageEvidenceTextAction {
    static type = '[Course] Update stage evidence text';
    constructor(public evidenceText: string, public stageSequenceNumber: number) { }
}

export class AddEvidenceFileAction {
    static type = '[Course] Add evidence file';
    constructor(public file: File, public stageSequenceNumber: number) { }
}

export class DeleteEvidenceFileAction {
    static type = '[Course] Delete evidence file';
    constructor(public fileId: string, public stageSequenceNumber: number) { }
}

export interface CourseStateModel {
    loading: boolean;
    course: Course; // maps user_course entry from firebase
    isUploading: boolean;
    progress: Observable<number>;
    selectedAssessmentId: string;
    selectedPhase: PhaseType;
    selectedStageSequenceNumber: number;
    phases: Phase[];
}

export const initialState = {
    loading: true,
    course: null,
    isUploading: false,
    progress: null,
    selectedAssessmentId: '',
    selectedStageSequenceNumber: null,
    selectedPhase: PhaseType.Design,
    phases: []
};

@State<CourseStateModel>({
    name: 'courseState',
    defaults: initialState
})
export class CourseState implements NgxsOnInit {
    constructor(private courseService: CourseService, private actions$: Actions) { }

    @Selector()
    static getAssessmentViewModel(state: CourseStateModel) {
        const selectedAssessment = !state.loading ?
            state.course.assessments.find(a => a.id === state.selectedAssessmentId) : null;
        const phases = selectedAssessment ? selectedAssessment.phases
            .sort((a, b) => (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0)) : null;
        return selectedAssessment ? <AssessmentViewModel>({
            assessmentId: selectedAssessment.id,
            assessmentTitle: selectedAssessment.title,
            selectedPhaseType: state.selectedPhase,
            loading: state.loading,
            phases: phases
                .map(p => ({
                    id: p.id,
                    title: p.title,
                    type: p.type
                })),
            courseTitle: state.course.title
        }) : <AssessmentViewModel>({
            assessmentId: '',
            assessmentTitle: '',
            selectedPhaseType: 0,
            loading: true,
            phases: null,
            courseTitle: ''
        });
    }

    // assessment.phases.sort((a, b) => (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0))

    @Selector()
    static getCourseDashboardViewModel(state: CourseStateModel) {
        const phases = state.course ?
            state.phases.sort((a, b) => (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0)) : null;
        return !state.loading && state.course ? <CourseDashboardViewModel>({
            isLoading: false,
            phases: phases,
            title: state.course.title,
            assessments: state.course.assessments.map(assessment =>
                ({
                    id: assessment.id,
                    title: assessment.title,
                    phases: phases.map(phase => {
                        const matchingPase = assessment.phases.find(p => p.type === phase.type);
                        return {
                            phaseType: phase.type,
                            responses: flatten(matchingPase.stages.map(s => s.claimResponses.map(c => ({
                                satisfactionLevel: c.satisfactionLevel,
                                response: c.response,
                                claimId: c.id,
                                claimText: c.claimTitle
                            }))))
                        };
                    })
                })
            )
        }) : <CourseDashboardViewModel>({
            isLoading: true,
            title: '',
            phases: [],
            assessments: []
        });
    }

    @Selector()
    static uploadProgress(state: CourseStateModel) {
        return ({
            isUploading: state.isUploading,
            progress: state.progress
        });
    }


    @Selector()
    static selectedPhase(state: CourseStateModel) {
        const selectedAssessment = !state.loading ?
            state.course.assessments.find(a => a.id === state.selectedAssessmentId) : null;
        return selectedAssessment.phases.find(p => p.type === state.selectedPhase);
    }

    @Selector()
    static selectedStage(state: CourseStateModel) {
        const selectedAssessment = !state.loading ?
            state.course.assessments.find(a => a.id === state.selectedAssessmentId) : null;
        const selectedPhase = selectedAssessment.phases.find(p => p.type === state.selectedPhase);
        return selectedPhase ? selectedPhase.stages.find(s => s.sequenceNumber === state.selectedStageSequenceNumber) : null;
    }

    ngxsOnInit(ctx: StateContext<CourseStateModel>) {
        this.actions$.pipe(ofActionSuccessful(
            UpdateClaimResponseAction,
        )).pipe(debounceTime(500)).subscribe(() => {
            this.courseService.update(ctx.getState().course);
        });
        this.actions$.pipe(ofActionSuccessful(
            DeleteAssessmentAction,
            UpdateAssessmentNameAction,
            AddEvidenceFileAction,
            DeleteEvidenceFileAction,
            UpdateStageEvidenceTextAction))
            .subscribe(() => {
                this.courseService.update(ctx.getState().course);
            });
    }

    @Action(LoadCourseAction)
    loadCourseAction(ctx: StateContext<CourseStateModel>) {
        const state = ctx.getState();
        if (state.course === null) {
            ctx.patchState({ loading: true });
            return forkJoin(
                this.courseService.get(),
                this.courseService.phases())
                .pipe(map(([course, phases]) => {
                    return ctx.patchState({
                        loading: false,
                        phases: phases,
                        course: course,
                        selectedAssessmentId: state.selectedAssessmentId ? state.selectedAssessmentId :
                            course.assessments && course.assessments.length > 0 ?
                                course.assessments[0].id : null,
                        selectedPhase: course.assessments && course.assessments.length > 0 ?
                            course.assessments[0].phases[0].type : null
                    });
                }));
        }
    }

    @Action(AddAssessmentAction)
    addAssessmentAction(ctx: StateContext<CourseStateModel>, action: AddAssessmentAction) {
        return this.courseService.addAssessment(action.assessmentName).pipe(
            map(course => {
                return ctx.patchState({ course: course, selectedAssessmentId: course.id });
            })
        );
    }

    @Action(DeleteAssessmentAction)
    deleteAssessmentAction(ctx: StateContext<CourseStateModel>, action: DeleteAssessmentAction) {
        // HERE WE COULD DELETE THE UPLOADED FILES.
        const currentCourse = ctx.getState().course;
        const newCourse = { ...currentCourse, assessments: currentCourse.assessments.filter(a => a.id !== action.assessmentId) };
        ctx.patchState({
            course: newCourse,
            selectedAssessmentId: currentCourse.assessments.length > 0 ? currentCourse[0] : ''
        });
    }

    @Action(UpdateAssessmentNameAction)
    updateAssessmentNameAction(ctx: StateContext<CourseStateModel>, action: UpdateAssessmentNameAction) {
        const state = ctx.getState();
        const assessment = state.course.assessments.find(a => a.id === action.assessmentId);
        // find assessment course structure and change the name.
        const course = {
            ...state.course, assessments:
                state.course.assessments.map(a => a.id === action.assessmentId ?
                    { ...a, title: action.assessmentName } : a)
        };
        if (assessment) {
            ctx.patchState({ course: course });
        }
    }

    @Action(UpdateStageEvidenceTextAction)
    UpdatePhaseEvidenceTextAction(ctx: StateContext<CourseStateModel>, action: UpdateStageEvidenceTextAction) {
        const state = ctx.getState();
        const assessment = state.course.assessments.find(a => a.id === state.selectedAssessmentId);
        // find answered question in course structure.
        const course = {
            ...state.course, assessments:
                state.course.assessments.map(a => a.id === state.selectedAssessmentId ?
                    {
                        ...a, phases: a.phases.map(p => p.type === state.selectedPhase ?
                            {
                                ...p, stages: p.stages.map(s => s.sequenceNumber === action.stageSequenceNumber
                                    ? { ...s, evidenceText: action.evidenceText } : s)
                            } : p)
                    } : a)
        };
        if (assessment) {
            ctx.patchState({ course: course });
        }
    }


    @Action(UpdateClaimResponseAction)
    updateValidityAnswerAction(ctx: StateContext<CourseStateModel>, action: UpdateClaimResponseAction) {
        const state = ctx.getState();
        const assessment = state.course.assessments.find(a => a.id === state.selectedAssessmentId);
        // find answered question in course structure.
        const course = {
            ...state.course, assessments:
                state.course.assessments.map(a => a.id === state.selectedAssessmentId ?
                    {
                        ...a, phases: a.phases.map(p => p.type === state.selectedPhase ?
                            {
                                ...p, stages: p.stages.map(s => s.claimResponses.find(c => c.id === action.claimId) ?
                                    {
                                        ...s, claimResponses: s.claimResponses.map(c => c.id === action.claimId ?
                                            {
                                                ...c, satisfactionLevel: action.satisfactionLevel,
                                                response: action.claimResponseType
                                            } : c)
                                    } : s)
                            }
                            : p)
                    } : a)
        };
        if (assessment) {
            ctx.patchState({ course: course });
        }
    }

    // uploadEvidence
    @Action(AddEvidenceFileAction)
    addEvidenceFileAction(ctx: StateContext<CourseStateModel>, action: AddEvidenceFileAction) {
        const state = ctx.getState();
        // start upload
        const id = Math.random().toString(36).substring(2);
        const uploadData = this.courseService.uploadEvidence(action.file, id);
        // set progress so we can show a progress bar
        ctx.patchState({ isUploading: true, progress: uploadData.progress });
        return uploadData.downloadUrl.pipe(map(url => {
            // when the file is uploaded add the file to assessment phase
            const course: Course = {
                ...state.course, assessments:
                    state.course.assessments.map(a => a.id === state.selectedAssessmentId ?
                        {
                            ...a, phases: a.phases.map(p => p.type === state.selectedPhase ?
                                {
                                    ...p, stages: p.stages.map(s =>
                                        s.sequenceNumber === action.stageSequenceNumber ?
                                            {
                                                ...s, evidenceFiles: [...s.evidenceFiles, {
                                                    id: id,
                                                    filename: action.file.name,
                                                    url: url
                                                }]
                                            } : s)
                                } : p)
                        } : a)
            };
            ctx.patchState({ course: course, isUploading: false, progress: of(null) });
            return course;
        }));
    }

    @Action(DeleteEvidenceFileAction)
    deleteEvidenceFileAction(ctx: StateContext<CourseStateModel>, action: DeleteEvidenceFileAction) {
        const state = ctx.getState();
        const course: Course = {
            ...state.course, assessments:
                state.course.assessments.map(a => a.id === state.selectedAssessmentId ?
                    {
                        ...a, phases: a.phases.map(p => p.type === state.selectedPhase ?
                            {
                                ...p, stages: p.stages.map(s =>
                                    s.sequenceNumber === action.stageSequenceNumber ?
                                        {
                                            ...s, evidenceFiles: s.evidenceFiles.filter(f => f.id !== action.fileId)
                                        } : s)
                            } : p)
                    } : a)
        };
        ctx.patchState({ course: course, isUploading: false, progress: of(null) });
    }

    @Action(SelectAssessmentAction)
    selectAssessmentAction(ctx: StateContext<CourseStateModel>, action: SelectAssessmentAction) {
        ctx.patchState({ selectedAssessmentId: action.assessmentId });
    }

    @Action(SelectPhaseAction)
    selectPhaseAction(ctx: StateContext<CourseStateModel>, action: SelectPhaseAction) {
        ctx.patchState({ selectedPhase: action.phaseType });
    }

    @Action(SelectStageAction)
    selectStageAction(ctx: StateContext<CourseStateModel>, action: SelectStageAction) {
        ctx.patchState({ selectedStageSequenceNumber: action.stageSequenceNumber });
    }
}
