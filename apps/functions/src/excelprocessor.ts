import * as Excel from 'exceljs';
import * as admin from 'firebase-admin';
import {
    Program, Course, AssessmentForm, Assessment, SelfEvalStep, SelfEvalPhase, User, SelfEval, CourseReference,
    EndTerm, ProgramWithEndTermCoverage, CourseWithEndTermCoverage, EndTermCoverage, CourseData, AssessmentFormsToIcons, onlyUnique
} from '@equality/data';
import { UserRecord } from 'firebase-functions/lib/providers/auth';
import UpdatesProcessor from './updatesprocessor';

export default class Excelprocessor {
    private collectionPrefix: string;

    constructor(collectionPrefix = '') {
        this.collectionPrefix = collectionPrefix;
    }
    async addUsers(filepath: string) {
        console.log('adding users..');
        const workbook = new Excel.Workbook();
        const programs: string[] = [];
        const users: User[] = [];
        await workbook.xlsx.readFile(filepath);
        const sheet = workbook.getWorksheet('Assessments');
        sheet.eachRow(async (row, index) => {
            const userMails = row.getCell('J').text.trim().toLowerCase().split(';'); // cursusleiders
            userMails.forEach(userMail => {
                // const userMail = row.getCell('K').text; //email
                if (index === 1 || !userMail) return;
                const program = row.getCell('A').text.trim(); // OPLEIDING
                const courseCode = row.getCell('E').text.trim(); // CURSUSCODE
                const courseTitle = row.getCell('F').text.trim(); // Cursusnaam (VAKNAAM)
                let newUser = users.find(u => u.email === userMail)
                if (!newUser) {
                    newUser = {
                        email: userMail,
                        id: '',
                        role: 'cursusleider',
                        isAdmin: false,
                        programs: [],
                        courses: []
                    };
                    users.push(newUser)
                }
                if (!newUser.programs.find(p => p.code === program)) {
                    newUser.programs.push({ code: program, title: program });
                }
                if (!programs.find(p => p === program)) {
                    programs.push(program);
                }
                if (!newUser.courses.find(c => c.code === courseCode)) {
                    newUser.courses.push({ code: courseCode, title: courseTitle });
                }
            });
        });
        users.forEach(async newUser => {
            let dbUser: UserRecord;
            try {
                dbUser = await admin.auth().getUserByEmail(newUser.email)
            } catch {
                dbUser = await admin.auth().createUser({
                    email: newUser.email,
                    disabled: false,
                    password: 'secretpassword',
                    emailVerified: true
                });
            }
            newUser.id = dbUser.uid;
            await admin.firestore().collection('users').doc(newUser.email).set(newUser);
        })
        programs.forEach(async program => {
            const email = `examencommissie_${program}@mymail.com`.trim().toLowerCase();
            let dbUser: UserRecord;
            try {
                dbUser = await admin.auth().getUserByEmail(email)
            } catch {
                dbUser = await admin.auth().createUser({
                    email: email,
                    disabled: false,
                    password: 'secretpassword',
                    emailVerified: true
                });
            }
            const newUser = {
                email: dbUser.email,
                id: dbUser.uid,
                role: 'examencommissie',
                isAdmin: false,
                programs: [({ code: program, title: program })],
                courses: []
            };
            await admin.firestore().collection('users').doc(email).set(newUser);
        });
    }

    async process_programs_courses_endTerms(programTitle: string, filepath: string) {
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filepath);
        const { programs, courses }: { programs: Program[]; courses: Course[]; } =
            this.loadProgramsAndCourses(programTitle, workbook);
        this.saveProgramsAndCourses(programs, courses);
        const endTerms = this.loadEndTerms(workbook);
        this.importProgramsWithEndTermCoveragePerCourse(endTerms, programs, courses);
    }

    async process_assessments(
        seedDocumentCoverage: boolean,
        seedAssessmentDelivery: boolean,
        seedSelfEvaluation: boolean) {
        const courseRef = await admin.firestore().collection('courses').get();
        const courses = courseRef.docs.map(c => c.data() as Course);

        const updater = new UpdatesProcessor();
        for (const course of courses) {
            const courseDataRef = await admin.firestore().collection(`course_data`)
                .doc(course.code)
                .get();
            const courseData = courseDataRef.exists ? courseDataRef.data() as CourseData : null;
            if (seedSelfEvaluation) {
                await updater.updateSelfEvaluate(course.code, course.programCode, courseData)
            }
            if (seedDocumentCoverage) {
                await updater.updateDocumentCoverages(course.code, course.programCode, courseData)
            }
            if (seedAssessmentDelivery) {
                await updater.updateDeliveryData(course.code, course.programCode, courseData)
            }
        }

    }

    private saveProgramsAndCourses(programs: Program[], courses: Course[]) {
        // save courses
        courses.forEach(async (c) => {
            await admin.firestore().collection(this.collectionPrefix + 'courses').doc(c.code).set(c);
        });
        console.log(`saved courses in collection ${this.collectionPrefix + 'courses'}`);
        // save programs
        programs.forEach(async (p) => {
            await admin.firestore().collection(this.collectionPrefix + 'programs').doc(p.code).set(p);
        });
        console.log(`saved programs in collection ${this.collectionPrefix + 'programs'}`);

    }

    private loadEndTerms(workbook: Excel.Workbook) {
        const endTermSheet = workbook.getWorksheet('EndTerms');
        const endTerms: EndTerm[] = [];
        endTermSheet.eachRow((row, index) => {
            if (index === 1)
                return; // skip header row
            const endTermCode = row.getCell('A').text.trim();
            const endTermCategory = row.getCell('B').text.trim();
            const endTermTitle = row.getCell('C').text.trim();
            endTerms.push({
                code: endTermCode,
                category: endTermCategory,
                title: endTermTitle
            });
        });
        console.log('Loaded end terms.');
        return endTerms;
    }

    private loadProgramsAndCourses(programTitle: string, workbook: Excel.Workbook) {
        const sheet = workbook.getWorksheet('Assessments');
        const programs: Program[] = [];
        const courses: Course[] = [];
        let courseIndex = 0;
        let assessmentIndex = 0;
        let program: Program;
        let course: Course;
        sheet.eachRow(async (row, index) => {
            if (index === 1)
                return; // skip header row
            const programCode = row.getCell('A').text; //OPLEIDING
            if (!program || program.code !== programCode) {
                program = {
                    title: programTitle,
                    code: programCode,
                    courseReferences: [],
                    documentTypes: ['Blueprint', 'Assessment', 'Scoring system',
                        'Analysis', 'Assessment evaluation']
                };
                programs.push(program);
                courseIndex = 0;
            }
            const courseLeerjaar = row.getCell('B').value as number; // Leerjaar
            const courseSemester = row.getCell('C').value as number; // SEMESTER
            const courseBlok = row.getCell('D').value as number; // Blok
            const courseCode = row.getCell('E').text.trim(); // CURSUSCODE
            const courseTitle = row.getCell('F').text.trim(); // Cursusnaam (VAKNAAM)
            const assessmentTitle = row.getCell('G').text.trim(); // Toetsnaam (~OMSCHRIJVING)
            const assessmentForm = row.getCell('H').text.toUpperCase().trim() as AssessmentForm; // Toetsvorm (~TOETS)
            const assessmentEndTerms = row.getCell('I').text.toUpperCase().trim().split(',').filter(s => s !== ''); // Eindtermen
            if (!course || course.code !== courseCode) {
                course = {
                    programCode: program.code,
                    programTitle: program.title,
                    sequenceNumber: courseIndex,
                    code: courseCode,
                    title: courseTitle,
                    leerjaar: courseLeerjaar,
                    semester: courseSemester,
                    blok: courseBlok,
                    assessmentForms: [],
                    endTerms: [],
                    assessments: []
                };
                const courseReference: CourseReference = {
                    code: courseCode,
                    title: courseTitle,
                    sequenceNumber: courseIndex,
                    leerjaar: courseLeerjaar,
                    semester: courseSemester,
                    blok: courseBlok
                };
                program.courseReferences.push(courseReference);
                courses.push(course);
                courseIndex++;
                assessmentIndex = 0;
            }
            if (!course.assessmentForms.includes(assessmentForm)) {
                course.assessmentForms.push(assessmentForm);
            }
            course.endTerms = course.endTerms.concat(assessmentEndTerms).filter(onlyUnique);
            const assessment: Assessment = {
                id: `${course.code}-${assessmentIndex}`, //  Math.random().toString(36).substring(2),
                sequenceNumber: assessmentIndex,
                title: assessmentTitle,
                form: assessmentForm,
                endTerms: assessmentEndTerms
            };
            course.assessments.push(assessment);
            assessmentIndex++;
        });

        return { programs, courses };
    }


    public async fixOwkbEindterms() {
        const ref = admin.firestore().collection('programs_with_endterm_coverages').doc('OWKB');
        const getDoc = await ref.get();
        const programWithEndTermCoverages = getDoc.data() as ProgramWithEndTermCoverage;
        // const programWithEndTermCoverages = p.docs.map(c => c.data() as ProgramWithEndTermCoverage).filter(p => p.programCode === 'OWKB');


        const courses = (await admin.firestore().collection(this.collectionPrefix + 'courses').get())
            .docs.map(c => (c.data() as Course));
        programWithEndTermCoverages.coursesWithEndTermCoverages.forEach(courseWithCoverage => {
            const course = courses.find(c => c.code === courseWithCoverage.code) as Course;
            courseWithCoverage.endTermCoverages.forEach(endtermCoverage => {
                endtermCoverage.covered = course.endTerms.map(e => e.toLowerCase()).includes(endtermCoverage.code.toLowerCase());
            })
        });
        await admin.firestore().collection(this.collectionPrefix + 'programs_with_endterm_coverages').doc('OWKB').set(programWithEndTermCoverages);
    }

    private importProgramsWithEndTermCoveragePerCourse(endTerms: EndTerm[], programs: Program[], courses: Course[]) {
        const programsWithEndTermCoverages: ProgramWithEndTermCoverage[] = [];
        // assume the end terms apply to all the programs in the file
        programs.forEach(p => {
            const coursesWithEndTermCoverages: CourseWithEndTermCoverage[] = p.courseReferences.map(cr => {
                const course = courses.find(c => c.code === cr.code);
                if (course === undefined)
                    throw Error('course not found.');
                const endTermCoverages: EndTermCoverage[] = endTerms.map(et => {
                    return {
                        code: et.code,
                        category: et.category,
                        covered: course.endTerms.map(e => e.toLowerCase()).includes(et.code.toLowerCase()),
                        assessmentForms: course.assessments
                            .filter(a => a.endTerms.map(e => e.toLowerCase())
                                .includes(et.code.toLowerCase())).map(a => a.form).filter(onlyUnique)
                    };
                });
                const assessmentFormCoverage: number[] =
                    Array.from(AssessmentFormsToIcons.keys()).map(af => course.assessments.filter(a => a.form === af).length);
                return {
                    code: course.code,
                    title: course.title,
                    sequenceNumber: course.sequenceNumber,
                    leerjaar: course.leerjaar,
                    semester: course.semester,
                    blok: course.blok,
                    endTermCoverages,
                    assessmentFormCoverage
                } as CourseWithEndTermCoverage;
            });
            programsWithEndTermCoverages.push({
                programCode: p.code,
                endTerms,
                coursesWithEndTermCoverages
            });
        });
        // save programs with end term coverages
        programsWithEndTermCoverages.forEach(async (p) => {
            await admin.firestore().collection(this.collectionPrefix + 'programs_with_endterm_coverages').doc(p.programCode).set(p);
        });
        console.log(`saved programs with end term coverages in collection ${this.collectionPrefix + 'programs_with_endterm_coverages'}`);
    }

    async process_self_eval_phases(filepath: string) {
        try {
            console.log('processing self eval phases excel..');
            const selfEvalPhases: SelfEvalPhase[] = []
            const workbook = new Excel.Workbook();
            await workbook.xlsx.readFile(filepath);
            const sheet = workbook.getWorksheet('Importable');
            let phase: SelfEvalPhase;
            let step: SelfEvalStep;
            let stepIndex = 0;
            try {
                sheet.eachRow((row, index) => {
                    const phaseName = row.getCell('A').text.trim()
                    const phaseDescription = row.getCell('B').text.trim(); // uitleg
                    const qualityAbbreviation = row.getCell('C').text.trim(); // fase
                    if (index === 1 || !qualityAbbreviation) return;
                    if (!phase || phase.title !== phaseName) {
                        const phaseEvidenceHelp = row.getCell('I').text.trim(); // leeswijzer onderbouwing fase
                        phase = {
                            sequenceNumber: selfEvalPhases.length + 1,
                            title: phaseName,
                            description: phaseDescription,
                            evidenceHelp: phaseEvidenceHelp,
                            steps: []
                        };
                        selfEvalPhases.push(phase);
                        stepIndex = 0;
                    }

                    const stepTitle = row.getCell('G').text.trim(); // stap
                    if (!step || step.title !== stepTitle) {
                        step = {
                            sequenceNumber: stepIndex,
                            title: stepTitle,
                            selfEval: []
                        };
                        stepIndex++;
                        phase.steps.push(step);
                    }
                    const selfEval: SelfEval = {
                        category: row.getCell('D').text.trim(), // kwaliteitscategorie,
                        categorySequence: +row.getCell('E').text.trim(), // volgorde,
                        code: row.getCell('F').text.trim(),
                        title: row.getCell('H').text.trim(),  // zelfevaluatie                        
                    }
                    step.selfEval.push(selfEval);
                });
                // tslint:disable-next-line: no-void-expression
                await selfEvalPhases.forEach(async p => {
                    console.log('saving ' + p.title);
                    try {
                        await admin.firestore().collection('selfevalphases').doc(p.title).set(p);
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
            catch (error) {
                console.error(error);
            }
        }
        catch (error) {
            console.error(error);
        }
    }

    async deleteProgram(programId: string) {
        // remove courses
        const programRef = await admin.firestore().collection('programs').doc(programId).get();
        const program = programRef.data() as Program;
        program.courseReferences.forEach(async c => {
            await admin.firestore().collection('courses').doc(c.code).delete();
            await admin.firestore().collection('course_data').doc(c.code).delete();
        });

        await admin.firestore().collection('programs').doc(programId).delete();
        await admin.firestore().collection('program_data').doc(programId).delete();
        await admin.firestore().collection('programs_with_assessment_delivery_data').doc(programId).delete();
        await admin.firestore().collection('programs_with_document_coverage').doc(programId).delete();
        await admin.firestore().collection('programs_with_endterm_coverages').doc(programId).delete();
        await admin.firestore().collection('programs_with_selfeval_counts').doc(programId).delete();
    }
}

