import { Component, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { Store } from '@ngxs/store';
import {
    CourseState, AddEvidenceFilesAction, DeleteEvidenceFileAction,
    LoadCourseAction, UpdateActieplanTextAction
} from '../../../shared/store/course.state';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { User, DeliveryData, CourseWithUserData, SelfEvalPhaseWithResponse, SelfEvalWithResponse } from '@equality/data';
import { flatten } from '@angular/compiler';
import { TextChangedEvent } from '../../../shared/components/textarea-form/textarea-form.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'equality-assessment',
    templateUrl: './course.page.html',
    styleUrls: ['./course.page.scss']
})
export class CourseComponent { 
    loaded$: Observable<boolean>;
    courseData: CourseWithUserData;
    user: User;
    selectedEmptyStatePhase: any;
    readonlyMode = false;

    constructor(private store: Store, private activeRoute: ActivatedRoute, private router: Router, public userService: UserService) {
        this.user = this.userService.user;
        this.readonlyMode = this.userService.isExamencommissie;
        this.loaded$ = this.store.select(CourseState.selectedCourse).pipe(
            map(data => {
                const isLoaded = !!data;
                if (isLoaded) {
                    this.courseData = data; // work-around to get auto-completion from language service
                }
                return isLoaded;
            })
        );

        this.activeRoute.params.subscribe(routeParams => {
            this.store.dispatch(new LoadCourseAction(routeParams.coursecode || this.user.courses[0].code));
        });

        if (!this.activeRoute.snapshot.params.coursecode) {
            this.router.navigate(['course', this.user.courses[0].code]);
        }

    }

    isComplete(data: DeliveryData) {
        let isComplete = false;
        if (data != null) {
            isComplete =
                (data.alpha && (data.alpha.applicable && !!data.alpha.value) || !data.alpha.applicable) &&
                (data.average && (data.average.applicable && !!data.average.value) || !data.average.applicable) &&
                (data.itemCount && (data.itemCount.applicable && !!data.itemCount.value) || !data.itemCount.applicable) &&
                (data.percentagePassed && (data.percentagePassed.applicable && !!data.percentagePassed.value)
                    || !data.percentagePassed.applicable) &&
                (data.standardDeviation && (data.standardDeviation.applicable && !!data.standardDeviation.value)
                    || !data.standardDeviation.applicable) &&
                (data.studentCount && (data.studentCount.applicable && !!data.studentCount.value)
                    || !data.studentCount.applicable);

        }
        return isComplete;

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    saveActiepuntenLastYear(e: TextChangedEvent) {
        // this.store.dispatch(new UpdateActieplanTextAction(e.text));
    }

    saveActiepuntenNextYear(e: TextChangedEvent) {
        this.store.dispatch(new UpdateActieplanTextAction(e.text));
    }

    getResponses = (selfEvalWithResponse: SelfEvalPhaseWithResponse): SelfEvalWithResponse[] => {
        return flatten(selfEvalWithResponse.stepWithResponses.map(r => r.selfEvalWithResponses));
    }
    navigateToAssessment = (id: string, phase: string, evalCode?: number) =>
        this.router.navigate(['course', this.courseData.code, 'assessment', id, 'phase', phase]
            , evalCode ? {
                queryParams: { evalCode }
            } : {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trackSelectionsByResponse(index: number, response: SelfEvalWithResponse) {
        return response.code;
    }
   
    trackSelectionsByassessmentPhases: TrackByFunction<any> = (index: number, item: SelfEvalPhaseWithResponse) => item.title;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upload(event: any, type: string) {
        this.store.dispatch(new AddEvidenceFilesAction(event.target.files, type));
    }
    removeFile(fileId: string, type: string) {
        this.store.dispatch(new DeleteEvidenceFileAction(fileId, type));
    }

}
