
import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymentStart] = useState(false);

  const navigate = useNavigate()

  const totalCartAmount =
    cartItems?.items?.length > 0
      ? cartItems.items.reduce(
        (sum, item) =>
          sum +
          (item.salePrice > 0 ? item.salePrice : item.price) *
          item.quantity,
        0
      )
      : 0;

  async function handleInitiateRazorpayPayment() {
    if (!cartItems || cartItems.items.length === 0) {
      toast({
        title: "Your cart is empty.",
        variant: "destructive",
      });
      return;
    }

    if (!currentSelectedAddress) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItems.items.map((singleCartItem) => ({
        productId: singleCartItem?.productId,
        title: singleCartItem?.title,
        image: singleCartItem?.image,
        price:
          singleCartItem?.salePrice > 0
            ? singleCartItem?.salePrice
            : singleCartItem?.price,
        quantity: singleCartItem?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: "pending",
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      totalAmount: totalCartAmount,
    };

    // 🔹 Step 1: Create Order in backend + get razorpayOrderId
    const response = await dispatch(createRazorpayOrder(orderData));

    if (!response?.payload?.success) {
      toast({
        title: "Error creating order",
        variant: "destructive",
      });
      return;
    }

    const { razorpayOrderId, amount, orderId } = response.payload;
    console.log(response.payload)
    setIsPaymentStart(true);

    // 🔹 Step 2: Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v2/checkout.js";
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "My Shop",
        description: "Order Payment",
        order_id: razorpayOrderId,

        handler: async function(paymentRes) {
          // 🔹 Step 3: Verify payment backend
          const verifyRes = await fetch(
            `${import.meta.env.VITE_API_URL}/shop/order/capture`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_signature: paymentRes.razorpay_signature,
                orderId: orderId,
              }),
            }
          );

          const verified = await verifyRes.json();

          if (verified.success) {
            toast({
              title: "Payment Successful!",
              description: "Your order has been placed.",
            });

            navigate('/')
          } else {
            toast({
              title: "Payment Verification Failed",
              variant: "destructive",
            });
          }
        },

        theme: { color: "#3399cc" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    };
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />

        <div className="flex flex-col gap-4">
          {cartItems?.items?.map((item) => (
            <UserCartItemsContent key={item.productId} cartItem={item} />
          ))}

          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₹{totalCartAmount}</span>
            </div>
          </div>

          <Button
            onClick={handleInitiateRazorpayPayment}
            className="w-full mt-4"
          >
            {isPaymentStart
              ? "Processing Razorpay Payment..."
              : "Checkout with Razorpay"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;

