import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule(
    {
        imports: [RouterModule.forRoot([
            {
                path: 'course',
                loadChildren: () => import('./my-courses/my-courses.module').then(m => m.MyCoursesModule)
            },
            {
                path: 'dashboard',
                loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
            },
            {
                path: 'backoffice',
                loadChildren: () => import('./backoffice/backoffice.module').then(m => m.BackofficeModule)
            }
        ], { useHash: true })],
        exports: [RouterModule]
    })
export class AppRoutingModule { }
