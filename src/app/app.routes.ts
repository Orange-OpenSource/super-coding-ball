import { Routes } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { BlocklyComponent } from './components/blockly/blockly.component';
import { GameComponent } from './components/game/game.component';
import { HomeComponent } from './components/home/home.component';
import { HowtoComponent } from './components/howto/howto.component';
import { LegalComponent } from './components/legal/legal.component';
import { OfflineOpponentsComponent } from './components/offline-opponents/offline-opponents.component';
import { OnlineOpponentsComponent } from './components/online-opponents/online-opponents.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { TermsComponent } from './components/terms/terms.component';
import { isStrongGuard } from './services/is-strong-guard';

export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  {path: 'howto', component: HowtoComponent},
  {path: 'about', component: AboutComponent},
  {path: 'privacy', component: PrivacyComponent},
  {path: 'terms', component: TermsComponent},
  {path: 'legal', component: LegalComponent},
  {path: 'offline-opponents', component: OfflineOpponentsComponent},
  {path: 'online-opponents', component: OnlineOpponentsComponent, canActivate: [isStrongGuard]},
  {path: 'code/offline/:id', component: BlocklyComponent},
  {path: 'code/online/:id', component: BlocklyComponent, canActivate: [isStrongGuard]},
  {path: 'play/offline/:id', component: GameComponent},
  {path: 'play/online/:id', component: GameComponent, canActivate: [isStrongGuard]},
  {path: '**', redirectTo: '/home', pathMatch: 'full'},
];
