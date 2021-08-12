
import { AngularFireAuthModule } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from './services/user.service';

import { SatisfactionIndicatorComponent } from './components/satisfaction-indicator/satisfaction-indicator.component';
import { TextareaFormComponent } from './components/textarea-form/textarea-form.component';
import { FiletypeIconComponent } from './components/filetype-icon/filetype-icon.component';
import { FirebaseService } from './services/firebase.service';
import { FileSaverModule } from 'ngx-filesaver';
import { AbbrevPipe } from './utilities/abbrev.pipe';
import { FilterPipe } from './utilities/filter.pipe';
import { FakeSaveButtonComponent } from './components/fake-save-button/fake-save-button.component';
import { ArraySortPipe } from './utilities/arraySort';
@NgModule({
    imports: [CommonModule, ReactiveFormsModule, RouterModule, AngularFirestoreModule,
        FormsModule,
        AngularFireAuthModule,
        AngularFireStorageModule,
        NgbModule,
        FileSaverModule],
    providers: [],
    declarations: [
        AbbrevPipe,
        FilterPipe,
        ArraySortPipe,
        FakeSaveButtonComponent,
        SatisfactionIndicatorComponent,
        TextareaFormComponent,
        FiletypeIconComponent
    ],
    exports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule, AngularFirestoreModule,
        AngularFireAuthModule,
        AngularFireStorageModule,
        NgbModule,
        SatisfactionIndicatorComponent,
        FakeSaveButtonComponent,
        FilterPipe,
        AbbrevPipe,
        ArraySortPipe,
        TextareaFormComponent,
        FiletypeIconComponent,
        FileSaverModule
    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders<SharedModule> {
        return {
            ngModule: SharedModule,
            providers: [UserService, FirebaseService, NgbModal]
        };
    }
}
