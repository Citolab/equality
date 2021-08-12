import { Component, OnDestroy, TrackByFunction } from '@angular/core';
import { Store } from '@ngxs/store';
import {
  CourseState, UpdateSelfEvalEvidenceTextAction, UpdateStepResponseAction, SelectPhaseAction
} from '../../../../../shared/store/course.state';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TextChangedEvent } from '../../../../../shared/components/textarea-form/textarea-form.component';
import { SelfEvalResponseEvent } from '../selfevalresponse/selfevalresponse.component';
import { ActivatedRoute } from '@angular/router';
import { SelfEvalPhaseWithResponse, SelfEvalStepResponse } from '@equality/data';
import { UserService } from '../../../../../shared/services/user.service';

@Component({
  selector: 'equality-phase-component',
  styleUrls: ['./phase-component.component.scss'],
  templateUrl: './phase-component.component.html',
})
export class PhaseComponent implements OnDestroy {
  selectedEval: string;
  // stageSelected$: Observable<boolean>;
  phaseSelected$: Observable<boolean>;
  isFakeSaving = false;
  readonlyMode = false;
  selectedPhase: SelfEvalPhaseWithResponse;
  private routeSubscription: Subscription;

  constructor(private store: Store, route: ActivatedRoute,
    // tslint:disable-next-line:align
    userService: UserService) {
    this.readonlyMode = userService.isExamencommissie;
    this.routeSubscription = route.params.subscribe(param => {
      this.store.dispatch(new SelectPhaseAction(param.title));
    });
    this.selectedEval = route.snapshot.queryParams.evalCode;
    this.phaseSelected$ = this.store.select(CourseState.selectedPhase).pipe(
      map(selectedPhase => {
        this.selectedPhase = selectedPhase;
        return !!selectedPhase;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  trackSelectionsByStage: TrackByFunction<any> = (index: number, phase: SelfEvalPhaseWithResponse) => phase.sequenceNumber|| index;


  trackSelectionsByClaim: TrackByFunction<any>  = (index: number, step: SelfEvalStepResponse) => {
    return step.selfEvalCode || index;
  }


  saveEvidenceText = (e: TextChangedEvent) =>
    this.store.dispatch(new UpdateSelfEvalEvidenceTextAction(e.text))
  evalChanged = (e: SelfEvalResponseEvent, stepSeqNr: number) =>
    this.store.dispatch(new UpdateStepResponseAction(e.selfEvalCode, stepSeqNr, e.selfEvalResponseType, e.satisfactionLevel))

}
