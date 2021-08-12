import { Component, OnDestroy } from '@angular/core';
import { UserService } from '../../shared/services/user.service';
import { Observable, Subscription } from 'rxjs';
import { User, Program } from '@equality/data';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from '../../shared/services/firebase.service';

@Component({
  selector: 'equality-backoffice',
  templateUrl: './backoffice.component.html',
  styleUrls: ['./backoffice.component.scss']
})
export class BackofficeComponent implements OnDestroy {

  public users$: Observable<User[]>;
  public closeResult = '';
  public programs: Program[];
  public selectedUser?: User;
  public selectedPassword: string;
  public selectedRole: 'cursusleider' | 'examencommissie';
  public selectedProgramCode = 'DGKB';
  public selectedProgram?: Program;
  public selectedCourses: string[] = [];

  public isNew = false;

  public modalAction: string;
  private programSubscription: Subscription;

  constructor(private userService: UserService, firebaseService: FirebaseService, private modalService: NgbModal) {
    this.users$ = userService.getAll();
    this.programSubscription = firebaseService.getPrograms().subscribe(p => {
      this.programs = p;
      this.selectedProgram = this.programs.find(program => program.code === this.selectedProgramCode);
    });
  }

  ngOnDestroy(): void {
    if (this.programSubscription) {
      this.programSubscription.unsubscribe();
    }
  }

  editUser(content: any, user?: User) {
    this.isNew = !user;
    if (!user) {
      this.modalAction = 'toevoegen';
      const newUser: User = { id: '', email: '', role: 'cursusleider', isAdmin: false, programs: [], courses: [] };
      this.selectedPassword = '';
      this.selectedCourses = [];
      this.selectProgram(this.programs[0].code);
      this.selectedUser = newUser;
      this.selectedRole = 'cursusleider';
    } else {
      this.modalAction = 'bewerken';
      this.selectedProgram = this.programs.find(p => p.code === user.programs[0].code);
      this.selectedProgramCode = this.selectedProgram?.code || '';
      this.selectedCourses = user.courses.map(c => c.code);
      this.selectedRole = user.role as 'cursusleider' | 'examencommissie';
      this.selectedUser = user;
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      if (result === 'Save') {
        this.saveSelectedUser();
      }
    });
  }

  saveSelectedUser() {
    console.table(this.selectedUser);
    const courses = this.selectedRole === 'examencommissie' ? [] : this.selectedProgram?.courseReferences
      .filter(cr => this.selectedCourses.includes(cr.code))
      .map(cr => ({
        code: cr.code,
        title: cr.title
      }));
    if (courses && this.selectedProgram && this.selectedUser && !this.selectedUser.id) {
      this.userService.createUser(this.selectedUser.email, this.selectedPassword, this.selectedProgram, courses, this.selectedRole);
    } else {
      if ( this.selectedProgram && courses) {
        this.userService.updateUser(this.selectedUser, this.selectedProgram, courses, this.selectedRole);
      }
    }
  }

  selectProgram(programCode: string) {
    if (this.selectedProgramCode !== programCode) {
      this.selectedCourses = [];
    }
    this.selectedProgramCode = programCode;
    this.selectedProgram = this.programs.find(p => p.code === programCode);
  }

  toggleCourse(courseCode: string, event: any) {
    console.log(`toggled course ${courseCode}`);
    if (event?.target?.checked) {
      this.selectedCourses.push(courseCode);
    } else {
      this.selectedCourses = this.selectedCourses.filter(c => c !== courseCode);
    }
  }
}
