import { User } from "../typings/user";

export function checkPermission(user: User, requestedEmail: string): boolean {
    return user.email === requestedEmail || user.type === 'supervisor';
}