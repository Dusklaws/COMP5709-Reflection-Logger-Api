export interface User {
    email: string;
    name: string;
    type: 'student' | 'supervisor';
    isStudentMiddle: boolean;
    history: User.History[]
}

export namespace User{
    export interface History {
        date: string;
        rating: number;
    }
}