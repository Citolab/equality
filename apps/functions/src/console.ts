import Excelprocessor from './excelprocessor';
import * as admin from 'firebase-admin';

(async () => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(process.cwd() + '/equality-opensource-firebase-adminsdk.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: 'https://equality-opensource.firebaseio.com'
        });
        const excelprocessor = new Excelprocessor('');
        await excelprocessor.process_self_eval_phases(process.cwd() +
            '/apps/functions/files/phases.xlsx');


        await excelprocessor.process_programs_courses_endTerms('Course1', process.cwd() +
            '/apps/functions/files/Equality-importtemplate_per_course.xlsx');
        await excelprocessor.addUsers(process.cwd() +
            '/apps/functions/files/Equality-importtemplate_per_course.xlsx');
        await excelprocessor.process_assessments(true, true, true);
        console.log("done seeding stuff");
    } catch (e) {
        // Deal with the fact the chain failed
        console.error(e);
    }
})();
