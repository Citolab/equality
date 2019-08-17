import { Component, OnDestroy } from '@angular/core';
import { PhaseStage, AssessmentPhase, ClaimResponse } from 'src/shared/model/model';
import { Store } from '@ngxs/store';
import {
  CourseState, AddEvidenceFileAction, DeleteEvidenceFileAction, UpdateStageEvidenceTextAction,
  SelectPhaseAction, UpdateClaimResponseAction, SelectStageAction
} from 'src/shared/store/course.state';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TextChangedEvent } from 'src/shared/components/textarea-form/textarea-form.component';
import { PhaseType } from 'src/shared/model/enums';
import { ClaimResponseEvent } from '../claimresponse/claimresponse.component';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-phase-component',
  styleUrls: ['./phase-component.component.scss'],
  templateUrl: './phase-component.component.html',
})
export class PhaseComponent implements OnDestroy {
  selectedClaim$: Observable<any>;
  stageSelected$: Observable<boolean>;
  phaseSelected$: Observable<boolean>;
  isUploading$: Observable<boolean>;

  selectedPhase: AssessmentPhase;
  selectedStage: PhaseStage;
  uploadProgress$: Observable<number>;
  private routeSubscription: Subscription;

  constructor(private store: Store, route: ActivatedRoute,
    private modalService: NgbModal) {
    this.routeSubscription = route.params.subscribe(param => {
      this.store.dispatch(new SelectPhaseAction(+param.type));
    });
    this.selectedClaim$ = route.queryParams.pipe(
      map(q => ({ claimId : q.claimId }))
    );

    this.phaseSelected$ = this.store.select(CourseState.selectedPhase).pipe(
      map(selectedPhase => {
        this.selectedPhase = selectedPhase;
        return !!selectedPhase;
      })
    );
    this.isUploading$ = this.store.select(CourseState.uploadProgress).pipe(
      map(progess => {
        this.uploadProgress$ = progess.progress;
        return progess.isUploading;
      })
    );
    this.stageSelected$ = this.store.select(CourseState.selectedStage).pipe(
      map(selectedStage => {
        this.selectedStage = selectedStage;
        return !!selectedStage;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  trackSelectionsByStage(index: number, phase: PhaseStage): any {
    return phase.sequenceNumber;
  }

  trackSelectionsByClaim(index: number, claim: ClaimResponse): any {
    return claim.id;
  }
  openStage(content: any, stage: PhaseStage) {
    this.store.dispatch(new SelectStageAction(stage.sequenceNumber));
    this.modalService.open(content).result.then(_ => {
      this.store.dispatch(new SelectStageAction(null));
    }).catch(_ => {
      // ignore
    });
  }
  upload = (event: any, sequenceNumber: number) =>
    this.store.dispatch(new AddEvidenceFileAction(event.target.files[0], sequenceNumber))
  removeFile = (fileId: string, sequenceNumber: number) =>
    this.store.dispatch(new DeleteEvidenceFileAction(fileId, sequenceNumber))
  saveEvidenceText = (e: TextChangedEvent, sequenceNumber: number) =>
    this.store.dispatch(new UpdateStageEvidenceTextAction(e.text, sequenceNumber))
  claimChanged = (e: ClaimResponseEvent, claimId: string) =>
    this.store.dispatch(new UpdateClaimResponseAction(claimId, e.claimResponseType, e.satisfactionLevel))

}
