import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngxs/store';
import {
    LoadCourseAction, CourseState, DeleteAssessmentAction,
    AddAssessmentAction, UpdateAssessmentNameAction
} from 'src/shared/store/course.state';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CourseDashboardViewModel, AssessmentSummary } from './course.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { UserService } from 'src/shared/services/user.service';
import { User, Assessment, AssessmentPhase } from 'src/shared/model/model';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-assessment',
    templateUrl: './course.page.html',
    styleUrls: ['./course.page.scss']
})
export class CourseComponent {
    loaded$: Observable<boolean>;
    courseData: CourseDashboardViewModel;
    user: User;
    assessmentEdited: AssessmentSummary;
    selectedEmptyStatePhase: any;


    constructor(private store: Store, private modalService: NgbModal, private router: Router, private userService: UserService) {
        this.store.dispatch(new LoadCourseAction());
        this.user = this.userService.user;

        this.loaded$ = this.store.select(CourseState.getCourseDashboardViewModel).pipe(
            map(data => {
                const isLoaded = data && !data.isLoading;
                if (isLoaded) {
                    this.courseData = data; // work-around to get auto-completion from language service
                }
                return isLoaded;
            })
        );
    }

    onSubmit() {
        if (this.assessmentEdited.title) {
            this.store.dispatch(new UpdateAssessmentNameAction(this.assessmentEdited.id, this.assessmentEdited.title));
            this.modalService.dismissAll();
        }
    }

    navigateToAssessment = (id: string, phase: number = 0, claimId = null) => this.router.navigate(['assessment', id, 'phase', phase]
        , claimId ? {
            queryParams: { 'claimId': claimId }
        } : {})

    deleteAssessment(content: any, assessment: AssessmentSummary) {
        this.assessmentEdited = assessment;
        this.modalService.open(content).result.then(r => {
            if (r === 'Ok click') {
                this.store.dispatch(new DeleteAssessmentAction(assessment.id));
            }
        }).catch(_ => {
            // ignore
        });
    }

    trackSelectionsByResponse(index: number, claim: any): any {
        return claim.id;
    }

    trackSelectionsByassessmentPhases(index: number, phase: AssessmentPhase): any {
        return phase.type;
    }


    editTitle(content: any, assessment: AssessmentSummary) {
        this.assessmentEdited = assessment;
        const title = assessment.title;
        this.modalService.open(content, { backdrop: 'static', keyboard : false }).result.then(r => {
            if (r !== 'Ok click') {
                assessment.title = title; // not ok? then revert to old value;
            }
        }).catch(_ => {
            // ignore
            assessment.title = title;
        });
    }

    logout = () => this.userService.logout().then(_ => this.router.navigate(['/login']));

    addAssessment(count: number) {
        this.store.dispatch(new AddAssessmentAction('Toets ' + (count + 1)));
    }
}
