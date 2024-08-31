import axios from 'axios';
import { showAlert } from './alert';

export const login = async(email,password)=>{  
    try {
        const res = await axios({
            method:'POST',
            url:'http://127.0.0.1:3000/api/v1/users/login',
            data:{
                email,
                password
            }
        })

        if(res.data.status === 'success')
        {
            showAlert('success','Logged in Successfully!');
            window.setTimeout(()=>{
                location.assign('/'); // To Load another page
            },1500);//1500 miliseconds
        }   
        //console.log(res);    
    } catch (error) {
        showAlert('error',error.response.data.message);   
    }
}

export const logoutUser = async() =>{
    try {
        const res=await axios({
            method:'GET',
            url:'http://127.0.0.1:3000/api/v1/users/logout'
        });
        //To reload the page
        if(res.data.status ==='success')
        {
            //location.reload(true);
            location.assign('/');

        }
        
    } catch (error) {
        showAlert('error','Cannot Logout at the moment. Please try again later!')
    }
}

export const signup = async(name,email,password,passwordConfirm)=>{  
    try {
        const res = await axios({
            method:'POST',
            url:'http://127.0.0.1:3000/api/v1/users/signup',
            data:{
                name,
                email,
                password,
                passwordConfirm
            }
        })

        if(res.data.status === 'success')
        {
            showAlert('success','Signed up Successfully!');
            window.setTimeout(()=>{
                location.assign('/'); // To Load another page
            },1500);//1500 miliseconds
        }   
        //console.log(res);    
    } catch (error) {
        showAlert('error',error.response.data.message);   
    }
}
