import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { IUserDocument } from '@user/interfaces/user.interface';
//import { IUserDocument } from '@user/interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      currentUser?: AuthPayload;
    }
  }
}

export interface AuthPayload {
  userId: string;
  uId: string;
  email: string;
  username: string;
  avatarColor: string;
  iat?: number;
}

export interface IAuthDocument extends Document {
  _id: string | ObjectId; // cho phep mongodb tao id hoac user tao id roi cho phep mongodb luu
  uId: string;
  username: string;
  email: string;
  password?: string;
  avatarColor: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

export interface ISignUpData {
  _id: ObjectId;
  uId: string;
  email: string;
  username: string;
  password: string;
  avatarColor: string;
}

export interface IAuthJob {
  value?: string | IAuthDocument | IUserDocument;
}