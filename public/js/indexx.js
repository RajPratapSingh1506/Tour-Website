import '@babel/polyfill';//to polyfill some of the features of javascript on all browsers
import {login,logoutUser, signup} from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM Elements
const loginForm = document.querySelector('.form--login');
const signupForm=document.querySelector('.form--signup');
const logOutBtn=document.querySelector('.nav__el--logout');
const userDataForm=document.querySelector('.form-user-data');
const userPasswordForm=document.querySelector('.form-user-password');
const bookBtn=document.getElementById('book-tour');

if(loginForm){
loginForm.addEventListener('submit',e=>{
    e.preventDefault();
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    login(email,password);
})};

if(logOutBtn)
{
    logOutBtn.addEventListener('click',logoutUser);
}

if(userDataForm)
{
    userDataForm.addEventListener('submit',e=>{
        e.preventDefault();
        const form=new FormData();
        form.append('name',document.getElementById('name').value)
        form.append('email',document.getElementById('email').value)
        form.append('photo',document.getElementById('photo').files[0])
        console.log(form);
        

        //const email=document.getElementById('email').value;
        //const name=document.getElementById('name').value;
        updateSettings(form,'data');
    });
}

if(userPasswordForm)
    {
        userPasswordForm.addEventListener('submit',async e=>{
            e.preventDefault();
            document.querySelector('.btn--save-password').textContent='Updating...';
            const passwordCurrent=document.getElementById('password-current').value;
            const password=document.getElementById('password').value;
            const passwordConfirm=document.getElementById('password-confirm').value;
            await updateSettings({passwordCurrent,password,passwordConfirm},'password');

            
            document.querySelector('.btn--save-password').textContent='Save Password';
            document.getElementById('password-current').value='';
            document.getElementById('password').value='';
            document.getElementById('password-confirm').value='';

        });
    }

    if(bookBtn)
    {
        bookBtn.addEventListener('click', e =>{
            console.log(e.target.dataset);
            
            e.target.textContent='Processing...';
            const {tourId}=e.target.dataset;
            bookTour(tourId);
        })
    }

    if(signupForm){
        signupForm.addEventListener('submit',e=>{
            e.preventDefault();
            const name=document.getElementById('name').value;
            const email=document.getElementById('email').value;
            const password=document.getElementById('password').value;
            const passwordConfirm=document.getElementById('passwordConfirm').value;
            signup(name,email,password,passwordConfirm);
        })
    }