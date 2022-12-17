import { ObjectId } from 'mongodb';   
import { Request, Response } from 'express';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { signupSchema } from '@auth/schemes/signup';
import { authService } from '@service/db/auth.service';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@global/helpers/error-handler';
import { Helpers } from '@global/helpers/helpers';
import { UploadApiResponse } from 'cloudinary';
import HTTP_STATUS from 'http-status-codes';
import { uploads } from '@global/helpers/cloudinary-upload';
 
export class Signup{
    @joiValidation(signupSchema)
    public async create(req: Request, res: Response): Promise<void>{
        const {username, email, password, avatarColor, avatarImage} = req.body;
        const checkIfUserExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
        if(checkIfUserExist) {
            throw new BadRequestError('Invalid credentials');
        }
        const authObjectId: ObjectId = new ObjectId(); //id dc tao cho user
        const userObjectId: ObjectId = new ObjectId(); //id cho user de generate ra
        const uId = `${Helpers.generateRandomIntegers(12)}`;

        const authData: IAuthDocument = Signup.prototype.signupData({
            _id: authObjectId,
            uId,
            username,
            email,
            password,
            avatarColor
        });
        const result: UploadApiResponse = await uploads(avatarImage, `${userObjectId}`, true, true) as UploadApiResponse;
        if(!result?.public_id){
            throw new BadRequestError('File upload: Error occurred. Try again');
        }

        res.status(HTTP_STATUS.CREATED).json({
            message: 'User created successfully',
            authData
        });
    }

    private signupData(data: ISignUpData): IAuthDocument{
        const { _id, username, email, uId, password, avatarColor } = data;
        return {
            _id,
            uId,
            username: Helpers.firstLetterUppercase(username),
            email: Helpers.lowerCase(email),
            password,
            avatarColor,
            createdAt: new Date()
        } as IAuthDocument;
    }
}