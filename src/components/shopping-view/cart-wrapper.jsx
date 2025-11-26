import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import UserCartItemsContent from "./cart-items-content";

function UserCartWrapper({ cartItems, setOpenCartSheet }) {
  const navigate = useNavigate();

  // Calculate total amount using useMemo for optimization
  const totalCartAmount = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce(
      (sum, item) =>
        sum +
        ((item?.salePrice ?? 0) > 0 ? item.salePrice : item?.price ?? 0) *
        (item?.quantity ?? 1),
      0
    );
  }, [cartItems]);

  // Generate unique keys for cart items
  const getCartItemKey = (item, index) => {
    if (item?.id) return `cart-item-${item.id}`;
    if (item?._id) return `cart-item-${item._id}`;
    // Fallback to index + timestamp for uniqueness
    return `cart-item-${index}-${Date.now()}`;
  };

  return (
    <SheetContent className="sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Your Cart</SheetTitle>
      </SheetHeader>

      <div className="mt-8 space-y-4">
        {cartItems && cartItems.length > 0 ? (
          cartItems.map((item, index) => (
            <UserCartItemsContent
              key={getCartItemKey(item, index)}
              cartItem={item}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">Your cart is empty.</p>
        )}
      </div>

      {cartItems && cartItems.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold">${totalCartAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {cartItems && cartItems.length > 0 && (
        <Button
          onClick={() => {
            navigate("/shop/checkout");
            setOpenCartSheet(false);
          }}
          className="w-full mt-6"
        >
          Checkout
        </Button>
      )}
    </SheetContent>
  );
}

export default UserCartWrapper;
