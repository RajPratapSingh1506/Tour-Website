const nodemailer = require('nodemailer');
const pug=require('pug');
const htmlToText=require('html-to-text');
//const sendinBlue=require('')

//new Email(user,url).sendWelcome();

module.exports= class Email{
  constructor(user,url){
      this.to=user.email;
      this.firstName=user.name.split(' ')[0];
      this.url=url;
      this.from= `Raj Pratap <${process.env.EMAIL_FROM}>`;
  }

    newTransport(){
    if(process.env.NODE_ENV === 'production'){
      //Sendblue
      // return nodemailer.createTransport({
      //   service:'SendinBlue',
      //   host:'smtp-relay.sendinblue.com',
      //   port:process.env.BREVO_PORT,
      //   auth:{
      //     user:process.env.BREVO_LOGIN,
      //     pass:process.env.BREVO_PASS
      //   }
      // });
      return 1;
    }
    // This is for development
    return  nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure:false,
            auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
            }
        });
      }


      // This will send the actual mail
      async send(template,subject){
        // 1 ) Render HTML based Pug template
        const html=pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
          firstName:this.firstName,
          url:this.url,
          subject
        });

        // 2 ) Define the email options
        const mailOptions = {
          from: this.from,
          to: this.to,
          subject,
          html,
          text: htmlToText.convert(html)
          // html:
        };

        // Create a transport and send email
        await this.newTransport().sendMail(mailOptions);

      }

      async sendWelcome(){
        await this.send('Welcome','Welcome to the Natours Family')
      }

      async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (Valid for only 10 Mins')
      };

}

