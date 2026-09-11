import { useMemo } from "react";

import useAppData from "../../context/useAppData";
import AddressSelectorModal from "../../components/AddressSelectorModal";

import CartHeader from "./components/CartHeader";
import CartEmptyState from "./components/CartEmptyState";
import DeliveryAddressBanner from "./components/DeliveryAddressBanner";
import RestaurantCart from "./components/RestaurantCart";
import CartSummary from "./components/CartSummary";

import useDeliveryAddress from "./hooks/useDeliveryAddress";
import useCartActions from "./hooks/useCartActions";
import useCheckout from "./hooks/useCheckout";

import { calculateCartFees } from "../../utils/feeCalculator";
import { getValidRestaurants } from "./utils/cartValidation";

const CartPage = () => {
    const {
        cart = [],
        allTotalQty = 0,
        loadingCart,
    } = useAppData();

    const {
        selectedAddress,
        addressLoading,
        addressError,
        isAddressModalOpen,
        openAddressSelector,
        closeAddressSelector,
        selectAddress,
    } = useDeliveryAddress();

    const {
        pendingItemId,
        pendingAction,
        isClearingCart,
        updateItemQuantity,
        removeItem,
        removeRestaurant,
        clearCart,
    } = useCartActions();

    const {
        checkingOutRestaurantId,
        isCheckingOutAll,
        checkoutSingle,
        checkoutAll,
    } = useCheckout({
        selectedAddress,
        onRequireAddress: openAddressSelector,
    });

    const validRestaurants = useMemo(
        () => getValidRestaurants(cart),
        [cart]
    );

    const globalFees = useMemo(
        () => calculateCartFees(validRestaurants),
        [validRestaurants]
    );

    const hasBlockedRestaurants =
        cart.length > validRestaurants.length;

    if (loadingCart) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-gray-500 font-medium">Loading cart...</p>
            </div>
        );
    }

    if (!cart.length) {
        return <CartEmptyState />;
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <CartHeader
                totalQty={allTotalQty}
                restaurantCount={cart.length}
            />

            <DeliveryAddressBanner
                address={selectedAddress}
                loading={addressLoading}
                error={addressError}
                onChange={openAddressSelector}
            />

            <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <div className="space-y-6">
                    {cart.map((restaurantCart) => (
                        <RestaurantCart
                            key={
                                restaurantCart.restaurant?.id ??
                                restaurantCart.restaurant?._id
                            }
                            restaurantCart={restaurantCart}
                            pendingItemId={pendingItemId}
                            pendingAction={pendingAction}
                            checkingOutRestaurantId={checkingOutRestaurantId}
                            onUpdateQuantity={updateItemQuantity}
                            onRemoveItem={removeItem}
                            onRemoveRestaurant={removeRestaurant}
                            onCheckout={checkoutSingle}
                        />
                    ))}
                </div>

                <CartSummary
                    fees={globalFees}
                    validRestaurantCount={validRestaurants.length}
                    totalRestaurantCount={cart.length}
                    hasBlockedRestaurants={hasBlockedRestaurants}
                    isCheckingOut={isCheckingOutAll}
                    isClearingCart={isClearingCart}
                    onCheckout={checkoutAll}
                    onClear={clearCart}
                />
            </div>

            <AddressSelectorModal
                isOpen={isAddressModalOpen}
                onClose={closeAddressSelector}
                selectedAddressId={
                    selectedAddress?.id ?? selectedAddress?._id
                }
                onSelectAddress={selectAddress}
            />
        </div>
    );
};

export default CartPage;