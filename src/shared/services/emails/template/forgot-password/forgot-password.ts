import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate{
    public passwordResetTemplate(username: string, resetLink: string): string{
        return ejs.render(fs.readFileSync(__dirname + '/forgot-password-template.ejs', 'utf8'), {
            username,
            resetLink,
            image_url: 'https://www.razlee.com/wp-content/uploads/2017/08/Password-Reset-1-768x768-1.png'
        });
    }
}

export const forgotPasswordTemplate: ForgotPasswordTemplate = new ForgotPasswordTemplate();