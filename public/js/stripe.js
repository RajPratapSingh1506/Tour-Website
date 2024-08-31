const Stripe = require('stripe');
const stripe=Stripe(process.env.STRIPE_PUBLISHABLE_KEY)
import axios from "axios";
import { showAlert } from "./alert";

export const bookTour =  async (tourId) =>{
    // 1 ) Get the checkout session from API
    try{
    const session= await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

        // 2 ) Create checkout form + charge credit card

        // await stripe.redirectToCheckout({
        //     sessionId: session.data.session.id
        //   });

        window.location.assign(session.data.session.url);

    }catch(err){
        console.log(err);
        showAlert('error',err);
    }
    
}