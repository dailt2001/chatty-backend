import { userService } from '@service/db/user.service';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache(); 
//check user trong cache => return xong check user trong database
export class CurrentUser {
    public async read(req: Request, res: Response): Promise<void>{
        let isUser = false;
        let token = null;
        let user = null;
        const cachedUser: IUserDocument = await userCache.getUserFromCache(`${req.currentUser!.userId}`) as IUserDocument;
        const existingUser: IUserDocument = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.userId}`);

        if(Object.keys(existingUser).length){
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            isUser = true;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            token =  req.session?.jwt; //get token  from session
            user = existingUser;
        }
        res.status(HTTP_STATUS.OK).json({isUser, token, user});
    }   
}