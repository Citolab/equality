import * as admin from 'firebase-admin';
import {
    SelfEvalPhase, CourseWithDocumentCoverage, CourseData, AssessmentWithDeliveryData, Course,
    SelfEvalResponseType, ProgramWithSelfEvalCounts, ProgramWithDocumentCoverage,
    Program, DocumentCoverage, ProgramWithAssessmentDeliveryData, DeliveryData,
    CourseWithSelfEvalCountsPerCategory, CategoryWithResponseCounts, CategoryWithSelfEval
} from '@equality/data';
// tslint:disable-next-line:no-implicit-dependencies
import { flatten } from 'lodash';

export default class UpdatesProcessor {


    async updateDeliveryData(courseCode: string, programCode: string, newCourse: CourseData | null) {
        let pwdc = await admin.firestore().doc(`/programs_with_assessment_delivery_data/${programCode}`).get();
        if (!pwdc.exists) {
            await admin.firestore().collection(`/programs_with_assessment_delivery_data`)
                .doc(programCode)
                .set({
                    programCode
                } as ProgramWithAssessmentDeliveryData);
            pwdc = await admin.firestore().doc(`/programs_with_assessment_delivery_data/${programCode}`).get();
        }

        const courseRef = await admin.firestore().doc(`/programs_with_assessment_delivery_data/${programCode}/courses/${courseCode}`).get();
        const assessmentsWithDeliveryData: AssessmentWithDeliveryData[] = courseRef.exists ?
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (courseRef.data() as any).assessments as AssessmentWithDeliveryData[] :
            await this.createAssessmentData(courseCode);

        for (const assessmentWithDeliveryData of assessmentsWithDeliveryData) {
            assessmentWithDeliveryData.deliveryData = {};
            if (newCourse && newCourse.assessmentData) {
                const assessmentData = newCourse.assessmentData.find(a => a.assessmentId === assessmentWithDeliveryData.assessmentId);
                if (assessmentData) {
                    assessmentWithDeliveryData.deliveryData = assessmentData.deliveryData
                }
            }
        }
        return admin.firestore()
            .doc(`/programs_with_assessment_delivery_data/${programCode}/courses/${courseCode}`)
            .set(
                { assessments: assessmentsWithDeliveryData }
            )
    }

    async updateDocumentCoverages(courseCode: string, programCode: string, newCourse: CourseData | null) {
        let pwdc = await admin.firestore().doc(`/programs_with_document_coverages/${programCode}`).get();
        //const courseData = await admin.firestore().doc(`/course_data/${courseCode}`).get();
        // create if not exists
        if (!pwdc.exists) {
            const programRef = await admin.firestore().collection(`/programs`).doc(programCode).get();
            const programDef = programRef.data() as Program;
            await admin.firestore().collection(`/programs_with_document_coverages`)
                .doc(programCode)
                .set({
                    programCode,
                    documentTypes: programDef.documentTypes,
                } as ProgramWithDocumentCoverage);
            pwdc = await admin.firestore().doc(`/programs_with_document_coverages/${programCode}`).get();
        }
        const courseRef = await admin.firestore().doc(`/programs_with_document_coverages/${programCode}/courses/${courseCode}`).get();
        const courseWithDocumentCoverage: CourseWithDocumentCoverage = courseRef.exists ?
            courseRef.data() as CourseWithDocumentCoverage :
            await this.createNewCourseWithDocumentCoverage(courseCode);

        for (const documentCoverage of courseWithDocumentCoverage.documentCoverages) {
            documentCoverage.documents = newCourse && newCourse.documents ?
                newCourse.documents.filter(d => d.type === documentCoverage.documentType) :
                [];
        };
        return admin.firestore()
            .doc(`/programs_with_document_coverages/${programCode}/courses/${courseCode}`)
            .set(
                courseWithDocumentCoverage
            )

    }

    async updateSelfEvaluate(courseCode: string, programCode: string, newCourse: CourseData | null) {
        let pwdc = await admin.firestore().doc(`/programs_with_selfeval_counts/${programCode}`).get();
        // create if not exists
        if (!pwdc.exists) {
            const selfevalphases = admin.firestore().collection(`/selfevalphases`);
            const allSelfevalphasesRef = await selfevalphases.get();
            const evals =
                flatten(flatten(allSelfevalphasesRef.docs.map(d => d.data() as SelfEvalPhase)
                    .map(phase => phase.steps.map(step => step.selfEval))));
            evals.sort((a, b) => (a.categorySequence > b.categorySequence) ? 1 : -1);
            const uniqueCategoriesWithSteps = evals
                .map(s => s.category)
                .filter((v, i, a) => a.indexOf(v) === i)
                .map(c => {
                    return {
                        title: c,
                        evals: evals.filter(e => e.category === c)
                    } as CategoryWithSelfEval
                });
            await admin.firestore().collection(`/programs_with_selfeval_counts`)
                .doc(programCode)
                .set({
                    programCode,
                    categories: uniqueCategoriesWithSteps
                } as ProgramWithSelfEvalCounts);
            pwdc = await admin.firestore().doc(`/programs_with_selfeval_counts/${programCode}`).get();
        }
        const program = pwdc.data() as ProgramWithSelfEvalCounts;
        const courseRef = await admin.firestore().doc(`/programs_with_selfeval_counts/${programCode}/courses/${courseCode}`).get();
        const courseWithSelfEval: CourseWithSelfEvalCountsPerCategory = courseRef.exists ?
            courseRef.data() as CourseWithSelfEvalCountsPerCategory :
            await this.createNewCourseWithSelfEval(courseCode, program.categories);
        courseWithSelfEval.categories = courseWithSelfEval.categories.map(s => {
            const total = s.noCount + s.yesCount + s.unansweredCount;
            let yesCount = 0;
            let noCount = 0;
            let unansweredCount = total;
            if (newCourse && newCourse.assessmentData) {
                newCourse.assessmentData.forEach(assessmentData => {
                    const phaseData = assessmentData.phaseResponses.filter(p => p.category === s.title);
                    if (phaseData) {
                        yesCount += phaseData.filter(p => p.responseType === SelfEvalResponseType.Yes).length;
                        noCount += phaseData.filter(p => p.responseType === SelfEvalResponseType.No).length;
                    }
                });
                unansweredCount = total - (yesCount + noCount);
            }
            return {
                ...s,
                noCount,
                yesCount,
                unansweredCount
            }
        });
        return admin.firestore()
            .doc(`/programs_with_selfeval_counts/${programCode}/courses/${courseCode}`)
            .set(
                courseWithSelfEval
            )
    }

    async createAssessmentData(courseCode: string): Promise<AssessmentWithDeliveryData[]> {
        const courseDefRef = await admin.firestore().collection(`/courses`).doc(courseCode).get();
        const courseDef = courseDefRef.data() as Course;
        return courseDef.assessments.map(assessment => {
            return {
                assessmentId: assessment.id,
                blok: courseDef.blok,
                courseCode: courseCode,
                deliveryData: {} as DeliveryData,
                leerjaar: courseDef.leerjaar,
                semester: courseDef.semester,
                sequenceNumber: assessment.sequenceNumber,
                title: assessment.title
            } as AssessmentWithDeliveryData;
        })
    }


    async createNewCourseWithDocumentCoverage(courseCode: string): Promise<CourseWithDocumentCoverage> {
        const courseDefRef = await admin.firestore().collection(`/courses`).doc(courseCode).get();
        const courseDef = courseDefRef.data() as Course;
        const programRef = await admin.firestore().collection(`/programs`).doc(courseDef.programCode).get();
        const programDef = programRef.data() as Program;
        return {
            code: courseCode,
            leerjaar: courseDef.leerjaar,
            semester: courseDef.semester,
            sequenceNumber: courseDef.sequenceNumber,
            title: courseDef.title,
            blok: courseDef.blok,
            documentCoverages: programDef.documentTypes.map(d => {
                return {
                    documentType: d,
                    documents: []
                } as DocumentCoverage
            })
        } as CourseWithDocumentCoverage
    }

    async createNewCourseWithSelfEval(courseCode: string, categories: CategoryWithSelfEval[]): Promise<CourseWithSelfEvalCountsPerCategory> {
        const courseDefRef = await admin.firestore().collection(`/courses`).doc(courseCode).get();
        const courseDef = courseDefRef.data() as Course;
        const categoriesWithCounts = categories.map(category => {
            return {
                title: category.title,
                unansweredCount: category.evals.length * courseDef.assessments.length,
                noCount: 0,
                yesCount: 0
            } as CategoryWithResponseCounts
        });
        return {
            blok: courseDef.blok,
            code: courseDef.code,
            leerjaar: courseDef.leerjaar,
            semester: courseDef.semester,
            sequenceNumber: courseDef.sequenceNumber,
            title: courseDef.title,
            categories: categoriesWithCounts
        } as CourseWithSelfEvalCountsPerCategory;
    }
}