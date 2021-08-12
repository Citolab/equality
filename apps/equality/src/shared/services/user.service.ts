import { Injectable } from '@angular/core';
import { User, AuthenticationResultType } from '@equality/data';
import { AngularFireAuth } from '@angular/fire/auth';
import { map, take, flatMap, tap, filter } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import {  Router, NavigationEnd } from '@angular/router';


export const getbaseUrl = (): string => {
    const pathArray = window.location.href.split('/');
    const protocol = pathArray[0];
    const host = pathArray[2];
    return protocol + '//' + host;
};

@Injectable()
export class UserService {
    user: User;
    storedDashboardTab = '';
    isExamencommissie = false;
    constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, router: Router) {

        router.events.pipe(
            filter(e => e instanceof NavigationEnd)).subscribe((e) => {
                const navEvent = e as NavigationEnd;
                const splittedUrl = navEvent.url.split('/');
                if (this.user && splittedUrl.length > 2 && splittedUrl[1].toLowerCase() === 'dashboard') {
                    this.storedDashboardTab = splittedUrl[2];
                    localStorage.setItem(`${this.user.id}-dashboard`, splittedUrl[2]);
                }
            });
    }

    getAll = () => this.afs.collection<User>('users').valueChanges();

    updateUser = async (currentUser: User,
        // tslint:disable-next-line:align
        programCode: { code: string, title: string },
        // tslint:disable-next-line:align
        courses: { code: string, title: string }[], role: 'cursusleider' | 'examencommissie') => {
        const newUser: User = {
            ...currentUser,
            role,
            programs: [programCode],
            courses
        };
        await this.afs.collection('users').doc(newUser.email).set(newUser);
    }

    createUser = async (email: string, password: string,
        // tslint:disable-next-line:align
        programCode: { code: string, title: string },
        // tslint:disable-next-line:align
        courses: { code: string, title: string }[], role: 'cursusleider' | 'examencommissie') => {
        email = email.trim().toLowerCase();
        const currentUser = await this.afs.doc<User>(`users/${email}`).get().toPromise();
        if (currentUser.exists) {
            return 'gebruiker bestaat al.';
        }
        // const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // add user to be able to authenticate
        try {

            const authUser = await this.afAuth.createUserWithEmailAndPassword(email, password);
            if (authUser && authUser.user) {
                const user = {
                    id: authUser.user.uid,
                    email
                } as User;
                this.updateUser(user, programCode, courses, role);
            } else {
                throw new Error('authUser.user is null');
            }

            return 'gebruiker toegevoegd.';
        } catch {
            return 'er is een fout opgetreden tijdens het maken van een firebase account.';
        }
    }

    isAuthenticated = () => this.afAuth.authState.pipe(
        filter(u => !!u),
        take(1),
        flatMap(user => {
            if (!this.user && user) {
                return this.afs.doc<User>(`users/${user.email}`).valueChanges().pipe(
                    take(1),
                    map(customUser => {
                        this.user = customUser; // TODO seed right program;
                        this.storedDashboardTab = localStorage.getItem(`${customUser.id}-dashboard`) || '';
                        this.isExamencommissie = customUser.role === 'examencommissie';
                        return true;
                    }));
            } else if (this.user) {
                return of(true);

            } else {
                this.user = null;
                return of(false);
            }
        })
    )

    login = (email: string, password: string): Promise<AuthenticationResultType> =>
        new Promise(resolve => this.afAuth.signInWithEmailAndPassword(email, password).then(u => {
            if (u && u.user) {
                this.afs.doc<User>(`users/${u.user.email}`).valueChanges().pipe(
                    take(1),
                    tap(customUser => {
                        this.user = customUser; // TODO seed right program
                        this.isExamencommissie = customUser.role === 'examencommissie';
                        return resolve(AuthenticationResultType.LoginSuccess);
                    })).subscribe();
            } else {
                this.user = null;
                resolve(AuthenticationResultType.UnknownCredentials);
            }
        }, _ => resolve(AuthenticationResultType.UnknownCredentials)))

    sendPasswordResetMail = (mail: string) => this.afAuth.sendPasswordResetEmail(mail);
    logout = (forceRefresh = true) => this.afAuth.signOut().then(() => {
        if (forceRefresh) {
            window.location.href = `${getbaseUrl()}/`;
        }
    }
    )
}
