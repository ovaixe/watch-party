import { Session } from '../../domain/Session';

export class SessionRepository {
  private session: Session;

  constructor() {
    this.session = new Session();
  }

  getSession(): Session {
    return this.session;
  }
}

