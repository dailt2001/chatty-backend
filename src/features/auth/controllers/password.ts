import { Request, Response } from 'express';
import { config } from '@root/config';
import HTTP_STATUS from 'http-status-codes';
import { BadRequestError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import crypto from 'crypto'; //generate random character
import { forgotPasswordTemplate } from '@service/emails/template/forgot-password/forgot-password';
import { emailQueue } from '@service/queues/email.queue';
import { resetPasswordTemplate } from '@service/emails/template/reset-password/reset-password';
import moment from 'moment';
import publicIP from 'ip';
import { IResetPasswordParams } from '@user/interfaces/user.interface';

export class Password{
    @joiValidation(emailSchema)
    public async create(req: Request, res: Response): Promise<void>{
        const { email } = req.body;
        const existingUser: IAuthDocument = await authService.getAuthUserByEmail(email);
        if(!existingUser){
            throw new BadRequestError('Invalid credentials');
        }

        const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
        const randomCharacters: string = randomBytes.toString('hex'); // buffer => string
        await authService.updatePasswordToken(`${existingUser._id!}`, randomCharacters, Date.now()*60*60*1000);

        const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
        const template: string = forgotPasswordTemplate.passwordResetTemplate(existingUser.username!, resetLink);
        emailQueue.addEmailJob('forgotPasswordEmail', {receiverEmail: email, template, subject: 'Reset your password'});
        res.status(HTTP_STATUS.OK).json({
            mes: 'Password reset email sent!',
            existingUser,
            randomCharacters
        });
    }

    @joiValidation(passwordSchema)
    public async update(req: Request, res: Response): Promise<void>{
        const { password, confirmPassword } = req.body;
        const { token } = req.params;
        //check token is till valid
        if(password !== confirmPassword){
            throw new BadRequestError('Password do not match');
        }
        const existingUser: IAuthDocument = await authService.getAuthUserByPasswordToken(token);
        if(!existingUser){
            throw new BadRequestError('Reset token has expired');
        }

        existingUser.password = password;
        existingUser.passwordResetExpires = undefined;
        existingUser.passwordResetToken = undefined;
        await existingUser.save();

        const templateParams: IResetPasswordParams  = {
            username: existingUser.username!,
            email: existingUser.email!,
            ipaddress: publicIP.address(),
            date: moment().format('DD/MM/YYYY HH:mm') 
        };
 
        const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
        emailQueue.addEmailJob('forgotPasswordEmail', {receiverEmail: existingUser.email, template, subject: 'Password reset confirmation'});
        res.status(HTTP_STATUS.OK).json({
            mes: 'Password successfully updated!',
            existingUser
        });
    }
}