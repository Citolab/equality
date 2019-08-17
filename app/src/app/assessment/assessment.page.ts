import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { UserService } from 'src/shared/services/user.service';
import { User } from 'src/shared/model/model';
import { Store } from '@ngxs/store';
import {
    CourseState, LoadCourseAction,
    SelectAssessmentAction,
} from 'src/shared/store/course.state';
import { Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AssessmentViewModel } from './assessment.model';
import { Router, ActivatedRoute } from '@angular/router';
import { PhaseType } from 'src/shared/model/enums';
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-assessment',
    templateUrl: './assessment.page.html',
    styleUrls: []
})
export class AssessmentComponent implements OnDestroy {
    user: User;
    courseData: AssessmentViewModel;
    loaded$: Observable<boolean>;
    private routeSubscription: Subscription;

    constructor(private store: Store, private userService: UserService,
        private router: Router, private route: ActivatedRoute) {
        this.routeSubscription = route.params.pipe(tap(param => {
            const id = param['id'];
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
        this.store.dispatch(new LoadCourseAction());
    }
    ngOnDestroy(): void {
        if (this.routeSubscription) {
            this.routeSubscription.unsubscribe();
        }
    }

    get selectedPhase() { return this.courseData.phases.find(a => a.type === this.courseData.selectedPhaseType); }

    selectPhase = (phase: PhaseType) => this.router.navigate(['phase/' + phase], { relativeTo: this.route });
    logout = () => this.userService.logout().then(_ => this.router.navigate(['/login']));
}
