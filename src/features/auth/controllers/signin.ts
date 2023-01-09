import { Request, Response } from 'express';
import { config } from '@root/config';
import JWT from 'jsonwebtoken';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import HTTP_STATUS from 'http-status-codes';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { loginSchema } from '@auth/schemes/signin';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { IUserDocument } from '@user/interfaces/user.interface';
import { userService } from '@service/db/user.service';

export class SignIn {
    @joiValidation(loginSchema)
    public async read(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;
        const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
        if (!existingUser) {
            throw new BadRequestError('User has not existed');
        }
        const passwordMatch: boolean = await existingUser.comparePassword(password);
        if (!passwordMatch) {
            throw new BadRequestError('Password is incorrect');
        }

        const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);
        const userJwt: string = JWT.sign(
            {
                userId: existingUser._id,
                uId: existingUser.uId,
                email: existingUser.email,
                username: existingUser.username,
                avatarColor: existingUser.avatarColor
            },
            config.JWT_TOKEN!
        );
        req.session = { jwt: userJwt };

        const userDocument: IUserDocument = {
            ...user,
            authId: existingUser!._id,
            uId: existingUser!.uId,
            email: existingUser!.email,
            username: existingUser!.username,
            avatarColor: existingUser!.avatarColor,
            createdAt: existingUser!.createdAt
        } as IUserDocument;

        res.status(HTTP_STATUS.OK).json({
            message: 'Login successfully',
            user: userDocument,
            token: userJwt
        });
    }
}
