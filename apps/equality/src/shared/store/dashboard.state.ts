import { FirebaseService } from '../services/firebase.service';
import {
    CourseReference, ProgramWithEndTermCoverage, CourseWithEndTermCoverage,
    AssessmentForm, EndTermCoverage, EndTerm, ProgramWithDocumentCoverage,
    ProgramWithAssessmentDeliveryData, AssessmentWithDeliveryData, DeliveryData,
    ProgramWithSelfEvalCounts, Document, ProgramData, ProgramWithData, GetRandomNumber
} from '@equality/data';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { map, mergeMap, tap } from 'rxjs/operators';
import { of, forkJoin, Observable } from 'rxjs';
import { flatten } from '@angular/compiler';
import { Injectable } from '@angular/core';

export class LoadCoursesAction {
    static type = '[Dashboard] load courses';
    constructor(public programCode: string) { }
}

export class FilterCoursesAction {
    static type = '[Dashboard] filter courses';
    constructor(public programCode: string, public courses: string[]) { }
}

export class LoadSelfEvaluationAction {
    static type = '[Dashboard] load serlf evaluation';
    constructor(public programCode: string) { }
}

export class LoadDocumentsAction {
    static type = '[Dashboard] load dashboard';
    constructor(public programCode: string) { }
}

export class LoadEndTermDashboardAction {
    static type = '[Dashboard] load dashboard';
    constructor(public programCode: string) { }
}

export class FilterAssessmentTypeAction {
    static type = '[Dashboard] filter assessment types';
    constructor(public assessmentTypes: AssessmentForm[]) { }
}

export class FilterGraphTypeAction {
    static type = '[Dashboard] filter graph types';
    constructor(public programCode: string, public graphTypes: string[]) { }
}

export class LoadAssessmentDeliveryDataAction {
    static type = '[Dashboard] load asessmentDeliveryData';
    constructor(public programCode: string, public fakeData = false) { }
}

export class AddVisionFilesAction {
    static type = '[Dashboard] Add vision files';
    constructor(public files: File[]) { }
}

export class DeleteVisionFileAction {
    static type = '[Dashboard] Delete vision file';
    constructor(public fileId: string) { }
}

export interface CourseWithEndTermCoverageInCategories extends CourseWithEndTermCoverage {
    categories: CategoryWithEndTermCoverages[];
}

export interface CategoryWithEndTermCoverages {
    category: string;
    endTerms: EndTermCoverage[];
}

export interface CategoryWithEndTerms {
    category: string;
    endTerms: EndTermWithTotals[];
}

export interface EndTermWithTotals extends EndTerm {
    total: number;
    covered: boolean;
}

export interface EndTermStateModel extends DashboardStateModel {
    programWithEndTermCoverage: ProgramWithEndTermCoverage;
    selectedAssessmentForms: AssessmentForm[];
}

export interface DashboardStateModel {
    program?: ProgramWithData;
    uploadingDocuments: boolean;
    loadingCourses: boolean;
    loadingDashboardData: boolean;
    courses?: CourseForFilter[];
    programWithSelfEvalCounts?: ProgramWithSelfEvalCounts;
    programWithEvidenceDocuments?: ProgramWithDocumentCoverage;
    programWithEndTermCoverage?: ProgramWithEndTermCoverage;
    programWithAssessmentDeliveryData?: ProgramWithAssessmentDeliveryData;
    selectedAssessmentForms: AssessmentForm[];
    selectedGraphTypes: string[];
}

export interface CourseForFilter extends CourseReference {
    selected: boolean;
}

export const initialState: DashboardStateModel = {
    loadingCourses: true,
    uploadingDocuments: false,
    loadingDashboardData: true,
    courses: undefined,
    program: undefined,
    programWithSelfEvalCounts: undefined,
    programWithEvidenceDocuments: undefined,
    programWithEndTermCoverage: undefined,
    programWithAssessmentDeliveryData: undefined,
    selectedAssessmentForms: ['S', 'FT', 'O', 'WB', 'PRES', 'OV', 'V', 'FB', 'D'] as AssessmentForm[],
    selectedGraphTypes: ['Betrouwbaarheid', 'Gemiddeld cijfer', 'Slagingspercentage']
};

@State<DashboardStateModel>({
    name: 'dashboardState',
    defaults: initialState
})
@Injectable()
export class DashboardState {
    constructor(protected firebaseService: FirebaseService) { }

    @Selector()
    static courses(state: DashboardStateModel): CourseForFilter[] {
        if (state.loadingCourses) {
            return [];
        }
        return state.courses || [];
    }


    @Selector()
    static visionDocumentsData(state: DashboardStateModel): { documents: Document[], isUploading: boolean } | null {
        if (state.loadingCourses || !state.program) {
            return null;
        }
        return {
            documents: state.program.documents,
            isUploading: state.uploadingDocuments
        };
    }

    @Selector()
    static program(state: DashboardStateModel): ProgramWithData|null {
        if (state.loadingCourses) {
            return null;
        }
        return state.program || null;
    }

    @Selector()
    static graphTypes(state: DashboardStateModel): string[] {
        return state.selectedGraphTypes;
    }

    @Selector()
    static assessmentDeliveryData(state: DashboardStateModel): ProgramWithAssessmentDeliveryData|null {
        if (state.loadingCourses || state.loadingDashboardData) {
            return null;
        }
        const selectedCourses = state.courses?.filter(c => c.selected).map(c => c.code);
        return {
            ...state.programWithAssessmentDeliveryData,
            assessmentsWithDeliveryData:
                state
                    .programWithAssessmentDeliveryData
                    .assessmentsWithDeliveryData
                    .filter(a => !!selectedCourses
                        .find(selectedCourse => selectedCourse === a.courseCode))

        };
    }

    @Selector()
    static selfEvalCounts(state: DashboardStateModel): ProgramWithSelfEvalCounts {
        if (state.loadingCourses || state.loadingDashboardData) {
            return null;
        }
        const selectedCourses = state.courses.filter(c => c.selected).map(c => c.code);
        return {
            ...state.programWithSelfEvalCounts,
            coursesWithSelfEvalCountsPerCategory: state.programWithSelfEvalCounts
                .coursesWithSelfEvalCountsPerCategory
                .filter(c => !!selectedCourses.find(selectedCourse => selectedCourse === c.code))
        } as ProgramWithSelfEvalCounts;
    }

    @Selector()
    static documents(state: DashboardStateModel): ProgramWithDocumentCoverage {
        if (state.loadingCourses || state.loadingDashboardData) {
            return null;
        }
        const selectedCourses = state.courses.filter(c => c.selected).map(c => c.code);
        return {
            ...state.programWithEvidenceDocuments,
            coursesWithDocumentCoverages: state.programWithEvidenceDocuments
                .coursesWithDocumentCoverages
                .filter(c => !!selectedCourses.find(selectedCourse => selectedCourse === c.code))
        };
    }

    @Selector()
    static endTerms(state: EndTermStateModel): {
        courses: CourseWithEndTermCoverageInCategories[],
        categories: CategoryWithEndTerms[],
        selectedAssessmentForms: AssessmentForm[]
    } {
        if (state.loadingCourses || state.loadingDashboardData) {
            return null;
        }
        const selectedCourses = state.courses.filter(c => c.selected).map(c => c.code);
        const coursesWithCoverage = state.programWithEndTermCoverage.coursesWithEndTermCoverages
            .filter(c => !!selectedCourses.find(sc => sc === c.code));
        const uniqueCategories = state.programWithEndTermCoverage.endTerms
            .map(e => e.category)
            .filter((x, i, a) => x && a.indexOf(x) === i);
        const courses = coursesWithCoverage.map(course => {
            return {
                ...course,
                categories: uniqueCategories.map(category => {
                    const endTermsInCategory = course.endTermCoverages.filter(endTerm => endTerm.category === category);
                    return {
                        category,
                        endTerms: endTermsInCategory.map(endTerm => {
                            return {
                                ...endTerm,
                                assessmentForms: endTerm.assessmentForms
                                    .filter(f => !!state.selectedAssessmentForms.find(sf => sf === f))
                            };
                        })
                    } as CategoryWithEndTermCoverages;
                })
            } as CourseWithEndTermCoverageInCategories;
        });
        const categories = uniqueCategories.map(category => {
            return {
                category,
                endTerms: state.programWithEndTermCoverage.endTerms
                    .filter(endTerm => endTerm.category === category)
                    .map(endTerm => {
                        const coveredCoursesForEndTerm = courses.filter(course =>
                            !!course.endTermCoverages.find(coverage => coverage.code === endTerm.code && coverage.covered));
                        return {
                            ...endTerm,
                            covered: coveredCoursesForEndTerm.length > 0,
                            total: coveredCoursesForEndTerm.length
                        } as EndTermWithTotals;
                    })
            } as CategoryWithEndTerms;
        });
        return {
            categories,
            courses,
            selectedAssessmentForms: state.selectedAssessmentForms
        };
    }

    @Action(LoadCoursesAction)
    loadCoursesAction(ctx: StateContext<DashboardStateModel>, action: LoadCoursesAction) {
        ctx.patchState({
            loadingCourses: true
        });
        const state = ctx.getState();
        const loadCourses = state.courses && state.courses.length > 0 && state.program ?
            of({ program: state.program, courses: state.courses }) :
            this.getProgramAndCourses(action.programCode);
        return loadCourses.pipe(tap((data) => {
            ctx.patchState({
                loadingCourses: false,
                courses: data.courses,
                program: data.program
            });
        }));
    }

    @Action(FilterCoursesAction)
    filterCoursesAction(ctx: StateContext<DashboardStateModel>, action: FilterCoursesAction) {
        const state = ctx.getState();
        this.storeSelectedCourses(action.programCode, action.courses);
        ctx.patchState({
            courses: state.courses.map(course => {
                const turnedOn = !!action.courses.find(c => c === course.code && !course.selected);
                const turnedOff = !turnedOn && !action.courses.find(c => c === course.code && course.selected);
                if (turnedOn) {
                    return { ...course, selected: true };
                }
                if (turnedOff) {
                    return { ...course, selected: false };
                }
                return course; // return same object if there was no change.
            })
        });
    }

    @Action(LoadDocumentsAction)
    loadDocumentsAction(ctx: StateContext<DashboardStateModel>, action: LoadDocumentsAction) {
        ctx.dispatch(new LoadCoursesAction(action.programCode));
        ctx.patchState({
            loadingDashboardData: true
        });
        const state = ctx.getState();
        const loadDocuments = state.programWithEvidenceDocuments ?
            of(state.programWithEvidenceDocuments) :
            this.firebaseService.getProgramWithDocumentCoverage(action.programCode);
        return loadDocuments.pipe(tap(programWithEvidenceDocuments => {
            ctx.patchState({
                loadingDashboardData: false,
                programWithEvidenceDocuments
            });
        }));
    }

    @Action(LoadSelfEvaluationAction)
    loadSelfEvaluationAction(ctx: StateContext<DashboardStateModel>, action: LoadSelfEvaluationAction) {
        ctx.dispatch(new LoadCoursesAction(action.programCode));
        ctx.patchState({
            loadingDashboardData: true
        });
        const state = ctx.getState();
        const loadSelfEval = state.programWithSelfEvalCounts ?
            of(state.programWithSelfEvalCounts) :
            this.firebaseService.getProgramWithSelfEvalCounts(action.programCode);
        return loadSelfEval.pipe(tap(programWithSelfEvalCounts => {
            ctx.patchState({
                loadingDashboardData: false,
                programWithSelfEvalCounts
            });
        }));
    }

    @Action(LoadEndTermDashboardAction)
    loadEndTermDashboardAction(ctx: StateContext<EndTermStateModel>, action: LoadEndTermDashboardAction) {
        ctx.dispatch(new LoadCoursesAction(action.programCode));
        ctx.patchState({
            loadingDashboardData: true
        });
        const state = ctx.getState();
        const loadEndterms = state.programWithEndTermCoverage ?
            of(state.programWithEndTermCoverage) :
            this.firebaseService.getProgramWithEndTermCoverage(action.programCode);
        return loadEndterms.pipe(tap(programWithEndTermCoverage => {
            ctx.patchState({
                loadingDashboardData: false,
                programWithEndTermCoverage,

            });
        }));
    }


    @Action(LoadAssessmentDeliveryDataAction)
    loadAssessmentDeliveryDataAction(ctx: StateContext<EndTermStateModel>, action: LoadAssessmentDeliveryDataAction) {
        ctx.dispatch(new LoadCoursesAction(action.programCode));
        ctx.patchState({
            loadingDashboardData: true
        });
        const storedGraphTypes = this.getSelectedGraphsFromLocalStorage(action.programCode);
        const selectedGraphTypes = storedGraphTypes && storedGraphTypes.length > 0 ?
            storedGraphTypes : initialState.selectedGraphTypes;
        const state = ctx.getState();
        const loadAssessmentDeliveryData = state.programWithAssessmentDeliveryData && !action.fakeData ?
            of(state.programWithAssessmentDeliveryData) :
            action.fakeData ?
                of({
                    programCode: action.programCode,
                    assessmentsWithDeliveryData: this.generateFakeAssessmentData(state.courses.map(c => c.code))
                } as ProgramWithAssessmentDeliveryData)
                : this.firebaseService.getProgramWithAssessmentDeliveryData(action.programCode);
        return loadAssessmentDeliveryData.pipe(tap(programWithAssessmentDeliveryData => {
            ctx.patchState({
                loadingDashboardData: false,
                selectedGraphTypes,
                programWithAssessmentDeliveryData
            });
        }));
    }

    @Action(FilterAssessmentTypeAction)
    filterAssessmentTypeAction(ctx: StateContext<EndTermStateModel>, action: FilterAssessmentTypeAction) {
        ctx.patchState({
            selectedAssessmentForms: action.assessmentTypes
        });
    }

    @Action(FilterGraphTypeAction)
    filterGraphTypeAction(ctx: StateContext<EndTermStateModel>, action: FilterGraphTypeAction) {
        this.storeSelectedGraphs(action.programCode, action.graphTypes);
        ctx.patchState({
            selectedGraphTypes: action.graphTypes
        });
    }

    // upload vision document
    @Action(AddVisionFilesAction)
    addVisionFilesAction(ctx: StateContext<DashboardStateModel>, action: AddVisionFilesAction) {
        const state = ctx.getState();
        // start upload
        const uploadData: { id: string, name: string, progress: Observable<number>, downloadUrl: Observable<string> }[] = [];
        for (const f of action.files) {
            const id = Math.random().toString(36).substring(2);
            uploadData.push(this.firebaseService.uploadEvidence(f, id));
        }
        ctx.patchState({ uploadingDocuments: true });
        return forkJoin(uploadData.map(u => u.downloadUrl))
            .pipe(mergeMap((urls) => {
                const documents = urls.map((url, index) => {
                    // when the file is uploaded add the file to assessment phase
                    return {
                        id: uploadData[index].id,
                        filename: uploadData[index].name,
                        filepath: url,
                        type: 'vision'
                    } as Document;
                });
                const updatedProgram: ProgramWithData = {
                    ...state.program,
                    documents: [...state.program.documents, ...documents]
                };
                ctx.patchState({
                    uploadingDocuments: false,
                    program: updatedProgram
                });
                const programData = {
                    programCode: updatedProgram.code,
                    documents: updatedProgram.documents
                } as ProgramData;
                return this.firebaseService.updateProgramData(programData).pipe(map(() => true));
            }));
    }

    @Action(DeleteVisionFileAction)
    deleteVisionFileAction(ctx: StateContext<DashboardStateModel>, action: DeleteVisionFileAction) {
        const state = ctx.getState();
        const updatedProgram: ProgramWithData = {
            ...state.program,
            documents: state.program.documents.filter(d => d.id !== action.fileId)
        };
        const programData = {
            programCode: updatedProgram.code,
            documents: updatedProgram.documents
        } as ProgramData;
        ctx.patchState({
            uploadingDocuments: false,
            program: updatedProgram
        });
        return this.firebaseService.updateProgramData(programData).pipe(map(() => true));
    }

    private getProgramAndCourses =
        (programCode: string): Observable<{ program: ProgramWithData, courses: CourseForFilter[] }> => {
            const storedCourses: string[] = this.getSelectedCoursesFromLocalStorage(programCode);
            return forkJoin([
                this.firebaseService.getProgramByCode(programCode),
                this.firebaseService.getProgramDataByCode(programCode)
            ]).pipe(
                    map(([program, programData]) => {
                        const courses = program.courseReferences.map(c => ({
                            blok: c.blok,
                            code: c.code,
                            leerjaar: c.leerjaar,
                            title: c.title,
                            selected: storedCourses && storedCourses.length > 0 ?
                                !!storedCourses.find(storedCourse => storedCourse === c.code) :
                                c.leerjaar === 1
                        } as CourseForFilter));
                        const programWithData = {
                            ...program,
                            documents: programData ? programData.documents : []
                        } as ProgramWithData;
                        return { program: programWithData, courses };
                    }));
        }

    private generateFakeAssessmentData(courses: string[]): AssessmentWithDeliveryData[] {
        if (!courses) {
            return null;
        }
        const fakeAssessments = flatten(courses.map(courseCode => {
            const assessmentCount = GetRandomNumber(1, 3, 0);
            const assessments: AssessmentWithDeliveryData[] = [];
            for (let index = 0; index < assessmentCount; index++) {
                assessments.push({
                    deliveryData: {
                        alpha: { applicable: true, value: GetRandomNumber(0.00, 1.00, 2) },
                        average: { applicable: true, value: GetRandomNumber(5.00, 8.00, 2) },
                        itemCount: { applicable: true, value: GetRandomNumber(20, 40, 0) },
                        percentagePassed: { applicable: true, value: GetRandomNumber(40, 80, 0) },
                        standardDeviation: { applicable: true, value: GetRandomNumber(0.50, 2, 2) },
                        studentCount: { applicable: true, value: GetRandomNumber(200, 400, 0) }
                    } as DeliveryData,
                    assessmentId: '123',
                    courseCode,
                    sequenceNumber: index,
                    title: `${courseCode}-${1 + index}`
                } as AssessmentWithDeliveryData);
            }
            return assessments;
        }));
        return fakeAssessments;
    }

    private storeSelectedCourses(programCode: string, courses: string[]) {
        localStorage.setItem(`${programCode}-selectedCourses`, JSON.stringify(courses));
    }

    private getSelectedCoursesFromLocalStorage(programCode: string) {
        const storedJsonCourses = localStorage.getItem(`${programCode}-selectedCourses`);
        if (storedJsonCourses) {
            try {
                const storedCourses = JSON.parse(storedJsonCourses);
                return storedCourses;
            } catch {
                return null;
            }
        }
        return null;
    }

    private storeSelectedGraphs(programCode: string, graphs: string[]) {
        localStorage.setItem(`${programCode}-selectedGraphs`, JSON.stringify(graphs));
    }

    private getSelectedGraphsFromLocalStorage(programCode: string) {
        const storedJsonGraphTypes = localStorage.getItem(`${programCode}-selectedGraphs`);
        if (storedJsonGraphTypes) {
            try {
                const storedGraphs = JSON.parse(storedJsonGraphTypes);
                return storedGraphs;
            } catch {
                return null;
            }
        }
        return null;
    }
}
