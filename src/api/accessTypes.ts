import { apiGet } from './apiConfig';

export interface AccessType {
    id: number;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
}