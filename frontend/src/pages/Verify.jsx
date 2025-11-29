import React, { useEffect } from 'react';
import { useShop } from '../context/ShopContex';
import { useSearchParams } from 'react-router';
import axios from 'axios';
import { toast } from 'react-toastify';

const Verify = () => {
    const { navigate, backendUrl, setCartItems } = useShop();
    const [searchParams, setSearchParams] = useSearchParams();

    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');
    const merchant_id = searchParams.get('merchant_id');
    const checkout_id = searchParams.get('checkout_id'); // Clover might return this

    const verifyPayment = async () => {
        try {
            if (!orderId) {
                navigate('/cart');
                return;
            }

            const response = await axios.post(`${backendUrl}/api/order/verify-clover`, {
                success,
                orderId,
                merchant_id,
                checkout_id
            }, { withCredentials: true });

            if (response.data.success) {
                setCartItems({});
                navigate('/orders');
                toast.success("Payment Successful!");
            } else {
                navigate('/cart');
                toast.error("Payment Failed or Cancelled");
            }

        } catch (error) {
            console.error(error);
            navigate('/cart');
            toast.error("An error occurred during verification");
        }
    };

    useEffect(() => {
        verifyPayment();
    }, [orderId, success]);

    return (
        <div className='min-h-[60vh] flex items-center justify-center'>
            <div className='w-20 h-20 border-4 border-gray-300 border-t-4 border-t-black rounded-full animate-spin'></div>
        </div>
    );
};

export default Verify;
