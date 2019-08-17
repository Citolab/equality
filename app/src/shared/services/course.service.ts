import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Course, Assessment, Phase, ClaimResponse } from '../model/model';
import { take, map, flatMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { flatten } from '@angular/compiler';


@Injectable()
export class CourseService {

    constructor(private userService: UserService,
        private afstg: AngularFireStorage, private afs: AngularFirestore) {
    }

    get = () => this.afs.doc<Course>(`user_courses/${this.userService.user.id}`)
        .valueChanges()
        .pipe(take(1))

    update = (course: Course) => from(this.afs.doc<Course>(`user_courses/${this.userService.user.id}`).update(course));

    phases = () => this.afs.collection<Phase>(`phases`).valueChanges()
        .pipe(take(1))



    addAssessment = (title: string) =>
        this.afs.collection<Phase>(`phases`).valueChanges()
            .pipe(take(1),
                flatMap(phases => {
                    const assessment: Assessment = {
                        'id': Math.random().toString(36).substring(2),
                        'title': title,
                        'phases': phases.map(phase => ({
                            'id': phase.id,
                            'title': phase.title,
                            'type': phase.type,
                            'description': phase.description,
                            'help': phase.help,
                            'stages': phase.stages.map(stage => ({
                                'id': Math.random().toString(36).substring(2),
                                'title': stage.title,
                                'sequenceNumber': stage.sequenceNumber,
                                'category': stage.category,
                                'evidenceDescription': stage.evidenceDescription,
                                'evidenceFiles': [],
                                'evidenceText': '',
                                'claimResponses': stage.claims.map(claim => (({
                                    'id': claim.id,
                                    'claimTitle': claim.title,
                                    'category': claim.category,
                                    'satisfactionLevel': null,
                                    'response': null
                                }) as ClaimResponse))
                            }))
                        }))
                    };
                    return this.get().pipe(
                        flatMap((course: Course) => {
                            const newCourse: Course = { ...course, assessments: [...course.assessments, assessment] };
                            return this.update(newCourse).pipe(map(_ => newCourse));
                        }));
                }))

    uploadEvidence = (file: File, id: string) => {
        const ref = this.afstg.ref(id);
        const uploadTask = ref.put(file);
        return {
            progress: uploadTask.percentageChanges(), // return observable with progress changes
            downloadUrl: from(uploadTask).pipe(flatMap(_ => ref.getDownloadURL()))
            // when the download is finished, the download url can be retrieved.
            // if this is done before the upload task resolves it will result in an error
        };
    }
}
