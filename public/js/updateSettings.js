import { showAlert } from "./alert";
import axios from "axios";
//type is either data or password
export const updateSettings=async(data,type)=>{
    try {
        
    const url= type === 'password'? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword':'http://127.0.0.1:3000/api/v1/users/updateMe';
    const res= await axios({
            method:'PATCH',
            url,
            data
        });
       if(res.data.status === 'success'){
        showAlert('success',`${type} Updated Successfully!!`)
       }
        
    } catch (error) {
        showAlert('error',error.response.data.message);
    }
}