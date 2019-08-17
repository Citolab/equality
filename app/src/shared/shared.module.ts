
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

@NgModule({
    imports: [CommonModule, ReactiveFormsModule, RouterModule, AngularFirestoreModule,
        FormsModule,
        AngularFireAuthModule,
        AngularFireStorageModule,
        NgbModule],
    providers: [],
    declarations: [
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
        TextareaFormComponent,
        FiletypeIconComponent
    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: SharedModule,
            providers: [UserService, NgbModal]
        };
    }
}
