import { Role } from '../../../../common/enums';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    timezone: string;
  };
}
