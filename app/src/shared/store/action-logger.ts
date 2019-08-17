import { Injectable, NgModule, ModuleWithProviders } from '@angular/core';
import { NgxsPlugin, getActionTypeFromInstance } from '@ngxs/store';
import { NGXS_PLUGINS } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { interval } from 'rxjs';
import { UserAction } from '../model/model';

@Injectable()
export class NgxsActionLoggerBackendPlugin implements NgxsPlugin {

    constructor(private userService: UserService) {
        interval(10000).pipe(tap(_ => {
            if (!!userService.user) {
                const storedActions = localStorage.getItem('actions');
                const userActions = storedActions ? <UserAction[]>JSON.parse(storedActions) : [];
                if (userActions && userActions.length > 0) {
                    this.userService.logActions(userActions).subscribe(_1 => {
                        localStorage.removeItem('actions');
                    });
                }
            }
        }))
            .subscribe();
    }

    handle(state, event, next) {
        const actionName = getActionTypeFromInstance(event);
        return next(state, event).pipe(
            tap(_ => {
                const storedActions = localStorage.getItem('actions');
                const userActions = storedActions ? <UserAction[]>JSON.parse(storedActions) : [];
                userActions.push(<UserAction>{
                    userId: this.userService.user ? this.userService.user.id : '',
                    action: actionName,
                    trucatedPayload: JSON.stringify(event).slice(0, 100),
                    date: new Date()
                });
                localStorage.setItem('actions', JSON.stringify(userActions));
            }));
    }
}

@NgModule()
export class NgxsActionLoggerToBackendPluginModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: NgxsActionLoggerToBackendPluginModule,
            providers: [
                {
                    provide: NGXS_PLUGINS,
                    useClass: NgxsActionLoggerBackendPlugin,
                    multi: true
                }
            ]
        };
    }
}
