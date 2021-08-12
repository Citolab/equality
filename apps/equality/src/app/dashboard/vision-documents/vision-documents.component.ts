import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngxs/store';
import { Document } from '@equality/data';
import { AddVisionFilesAction, DeleteVisionFileAction, DashboardState } from '../../../shared/store/dashboard.state';
import { UserService } from '../../../shared/services/user.service';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'equality-vision-documents',
  templateUrl: './vision-documents.component.html',
  styleUrls: ['./vision-documents.component.css']
})
export class VisionDocumentsComponent {
  loaded$ = of(false);
  visiondocs: Document[] = [];
  readonlyMode = false;
  isProcessing = false;

  constructor(public activeModal: NgbActiveModal, private store: Store, userService: UserService) {
    this.readonlyMode = !userService.isExamencommissie;
    this.loaded$ = this.store.select(DashboardState.visionDocumentsData).pipe(
      map(data => {
        this.visiondocs = data.documents;
        this.isProcessing = data.isUploading;
        return true;
      }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload(event: any) {
    this.store.dispatch(new AddVisionFilesAction(event.target.files));
  }

  removeFile(fileId: string) {
    this.store.dispatch(new DeleteVisionFileAction(fileId));
  }
}
