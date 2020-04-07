export interface User {
    email: string;
    name: string;
    type: 'student' | 'supervisor';
    isStudentMiddle: boolean;
}
