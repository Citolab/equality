import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CourseData } from '@equality/data';
import UpdatesProcessor from './updatesprocessor';

admin.initializeApp();


export const processCourseDataChanges = functions
  .region('europe-west1')
  .firestore.document('/course_data/{courseCode}')
  .onWrite(async (change, context) => {
    const updatesProcessor = new UpdatesProcessor();
    const courseCode = context.params.courseCode;
    const oldCourse = change.before.data() as CourseData;
    const newCourse = change.after.data() as CourseData;
    const programCode = newCourse ? newCourse.programCode :
      oldCourse ? oldCourse.programCode : '';
    await Promise.all(
      [
        updatesProcessor.updateDocumentCoverages(courseCode, programCode, newCourse),
        updatesProcessor.updateDeliveryData(courseCode, programCode, newCourse),
        updatesProcessor.updateSelfEvaluate(courseCode, programCode, newCourse)
      ])
  });
