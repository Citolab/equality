import { Injectable } from '@angular/core';
import { User, UserAction } from '../model/model';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { of, from } from 'rxjs';
import { AuthenticationResultType } from '../model/enums';

@Injectable()
export class UserService {
    user: User;
    constructor(private afAuth: AngularFireAuth) { }

    isAuthenticated = () => this.afAuth.authState.pipe(
        map(user => {
            this.user = user ? ({ id: user.uid, email: user.email, displayName: user.displayName }) : null;
            return !!user;
        }))

    login = (email: string, password: string): Promise<AuthenticationResultType> =>
        new Promise(resolve => this.afAuth.auth.signInWithEmailAndPassword(email, password).then(u => {
            this.user = u && u.user ? ({ id: u.user.uid, email: u.user.email, displayName: u.user.displayName }) : null;
            return resolve(AuthenticationResultType.LoginSuccess);
        }, _ => resolve(AuthenticationResultType.UnknownCredentials)))
    sendPasswordResetMail = (mail: string) => this.afAuth.auth.sendPasswordResetEmail(mail);
    logout = (forceRefresh = true) => this.afAuth.auth.signOut().then(_ => {
        if (forceRefresh) {
            window.location.href = `${getbaseUrl()}/`;
        }
    }
    )
    logActions = (actions: UserAction[]) => of(null); // from(this.afs.collection(`user_actions`).add(actions));
}
export const getbaseUrl = (): string => {
    const pathArray = window.location.href.split('/');
    const protocol = pathArray[0];
    const host = pathArray[2];
    return protocol + '//' + host;
};
