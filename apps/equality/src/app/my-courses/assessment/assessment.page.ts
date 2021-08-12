import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { UserService } from '../../../shared/services/user.service';
import { User, AssessmentViewModel } from '@equality/data';
import { Store } from '@ngxs/store';
import {
    CourseState, LoadCourseAction,
    SelectAssessmentAction,
    UpdateActieplanTextAction
} from '../../../shared/store/course.state';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { TextChangedEvent } from '../../../shared/components/textarea-form/textarea-form.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'equality-assessment',
    templateUrl: './assessment.page.html',
    styleUrls: []
})
export class AssessmentComponent implements OnDestroy {
    user: User;
    courseData: AssessmentViewModel;
    loaded$: Observable<boolean>;
    private routeSubscription: Subscription;

    constructor(private store: Store, private userService: UserService, route: ActivatedRoute) {
        this.routeSubscription = route.params.pipe(tap(param => {
            this.store.dispatch(new LoadCourseAction(param.coursecode));
            const id = param.id;
            this.store.dispatch(new SelectAssessmentAction(id));
        })).subscribe();
        this.user = this.userService.user;
        this.loaded$ = this.store.select(CourseState.getAssessmentViewModel).pipe(
            map(data => {
                const isLoaded = data && !data.loading;
                if (isLoaded) {
                    this.courseData = data; // work-around to get auto-completion from language service
                }
                return isLoaded;
            })
        );
    }
    ngOnDestroy(): void {
        if (this.routeSubscription) {
            this.routeSubscription.unsubscribe();
        }
    }

    saveEvidenceText = (e: TextChangedEvent) =>
        this.store.dispatch(new UpdateActieplanTextAction(e.text))
}
