import fs from 'fs';
import ejs from 'ejs';
import { IResetPasswordParams } from '@user/interfaces/user.interface';

class ResetPasswordTemplate{
    public passwordResetConfirmationTemplate(templateParams: IResetPasswordParams): string{
        const {username, email, ipaddress, date } = templateParams;
        return ejs.render(fs.readFileSync(__dirname + '/reset-password-template.ejs', 'utf8'), {
            username,
            email,
            ipaddress,
            date,
            image_url: 'https://www.razlee.com/wp-content/uploads/2017/08/Password-Reset-1-768x768-1.png'
        }); 
    }
}

export const resetPasswordTemplate: ResetPasswordTemplate = new ResetPasswordTemplate();