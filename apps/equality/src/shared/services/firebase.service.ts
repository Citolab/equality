import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import {
    Course, SelfEvalPhase, CourseData, Program, ProgramWithEndTermCoverage,
    ProgramWithDocumentCoverage, ProgramWithAssessmentDeliveryData,
    ProgramWithSelfEvalCounts, CourseWithSelfEvalCountsPerCategory, CourseWithDocumentCoverage, AssessmentWithDeliveryData, ProgramData
} from '@equality/data';
import { take, map, mergeMap } from 'rxjs/operators';
import { from, Observable } from 'rxjs';
import { flatten } from '@angular/compiler';


@Injectable()
export class FirebaseService {

    constructor(private afstg: AngularFireStorage, private afs: AngularFirestore) {
    }

    getAllDocumentForProgram = (programCode: string) => {
        return this.afs.collection<CourseData>('course_data', ref => ref.where('programCode', '==', programCode))
            .valueChanges().pipe(
                take(1),
                map(data => {
                    return data;
                }));
    }

    getProgramWithEndTermCoverage = (programCode: string) => {
        return this.afs.doc<ProgramWithEndTermCoverage>(`programs_with_endterm_coverages/${programCode}`)
            .valueChanges().pipe(
                take(1),
                map(data => {
                    return data;
                }));
    }
    getProgramWithAssessmentDeliveryData = (programCode: string): Observable<ProgramWithAssessmentDeliveryData> => {
        return this.afs.collection<{ assessments: Array<AssessmentWithDeliveryData> }>
            (`programs_with_assessment_delivery_data/${programCode}/courses`).valueChanges().pipe(
                mergeMap(assessmentData => {
                    return this.afs.doc<ProgramWithAssessmentDeliveryData>(`programs_with_assessment_delivery_data/${programCode}`)
                        .valueChanges().pipe(map(program => {
                            return {
                                ...program,
                                assessmentsWithDeliveryData: flatten(assessmentData.map(a => a.assessments))
                            } as ProgramWithAssessmentDeliveryData;
                        }));
                })
            );
    }

    getProgramWithDocumentCoverage = (programCode: string): Observable<ProgramWithDocumentCoverage> =>
        this.afs.collection<CourseWithDocumentCoverage>(`programs_with_document_coverages/${programCode}/courses`).valueChanges().pipe(
            mergeMap(coursesWithDocumentCoverages => {
                return this.afs.doc<ProgramWithDocumentCoverage>(`programs_with_document_coverages/${programCode}`)
                    .valueChanges()
                    .pipe(map((program) => {
                        return { ...program, coursesWithDocumentCoverages };
                    }));
            })
        )

    getProgramWithSelfEvalCounts = (programCode: string): Observable<ProgramWithSelfEvalCounts> =>
        this.afs.collection<CourseWithSelfEvalCountsPerCategory>
            (`programs_with_selfeval_counts/${programCode}/courses`).valueChanges().pipe(
                mergeMap(coursesWithSelfEvalCountsPerCategory => {
                    return this.afs.doc<ProgramWithSelfEvalCounts>(`programs_with_selfeval_counts/${programCode}`)
                        .valueChanges()
                        .pipe(map((program) => {
                            return { ...program, coursesWithSelfEvalCountsPerCategory };
                        }));
                })
            )

    getCourseByCode = (courseCode: string) =>
        this.afs.doc<Course>(`courses/${courseCode}`)
            .valueChanges()
            .pipe(take(1))

    getCoursesByProgramCode = (programCode: string) =>
        this.afs.collection<Course>('courses', ref => ref.where('programCode', '==', programCode))
            .valueChanges().pipe(take(1))

    getCourseDataByCode = (courseCode: string) => from(this.afs.doc<CourseData>(`course_data/${courseCode}`)
        .valueChanges()
        .pipe(take(1)))


    updateCourseData = (courseData: CourseData) => from(this.afs.doc<CourseData>(`course_data/${courseData.courseCode}`)
        .update(courseData)
        .catch(_ => {
            this.afs.doc<CourseData>(`course_data/${courseData.courseCode}`).set(courseData);
        }))

    updateProgramData = (programData: ProgramData) => from(this.afs.doc<ProgramData>(`program_data/${programData.programCode}`)
        .update(programData)
        .catch(_ => {
            this.afs.doc<ProgramData>(`program_data/${programData.programCode}`).set(programData);
        }))

    selfEvalPhases = () => this.afs.collection<SelfEvalPhase>(`selfevalphases`)
        .valueChanges()
        .pipe(take(1))

    // tslint:disable-next-line:max-line-length
    uploadEvidence = (file: File, id: string): { id: string, name: string, progress: Observable<number>, downloadUrl: Observable<string> } => {
        const ref = this.afstg.ref(id);
        const uploadTask = ref.put(file);
        return {
            id,
            name: file.name,
            progress: uploadTask.percentageChanges(), // return observable with progress changes
            downloadUrl: from(uploadTask).pipe(mergeMap(_ => ref.getDownloadURL()))
            // when the download is finished, the download url can be retrieved.
            // if this is done before the upload task resolves it will result in an error
        };
    }

    getPrograms = (): Observable<Program[]> => this.afs.collection<Program>('programs').valueChanges();

    getProgramByCode = (code: string): Observable<Program> =>
        this.afs.doc<Program>(`programs/${code}`)
            .valueChanges()
            .pipe(take(1))

    getProgramDataByCode = (code: string): Observable<ProgramData> =>
        this.afs.doc<ProgramData>(`program_data/${code}`)
            .valueChanges()
            .pipe(take(1))

    getProgramByCourseCode = (courseCode: string) =>
        this.getCourseByCode(courseCode).pipe(
            mergeMap(course => this.getProgramByCode(course.programCode))
        )

    deleteEvidence = (id: string) => {
        // TODO, delete actual file. code below gives 403

        // const ref = this.afstg.ref(id);
        // return ref.delete().subscribe();

    }
}
