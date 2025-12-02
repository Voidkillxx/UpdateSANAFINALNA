<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // ... (Keep checkout method as is) ...
    public function checkout(Request $request) 
    { 
        // ... (Your existing checkout logic goes here - kept strictly as you provided) ...
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'shipping_address' => 'required|string',
            'payment_type'     => 'required|in:Card,Cash On Delivery',
            'selected_items'   => 'required|array',
            'selected_items.*' => 'integer'
        ]);

        $cart = Cart::where('user_id', $user->id)->with('cartItems.product')->first();

        if (!$cart || $cart->cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        $selectedItemIds = $request->selected_items;
        $checkoutItems = $cart->cartItems->whereIn('id', $selectedItemIds);

        if ($checkoutItems->isEmpty()) {
            return response()->json(['message' => 'No valid items selected for checkout'], 400);
        }

        foreach ($checkoutItems as $item) {
            if (!$item->product) continue;
            if ($item->product->stock < $item->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for product: {$item->product->product_name}"
                ], 400);
            }
        }

        $subtotal = 0;
        foreach ($checkoutItems as $item) {
            if ($item->product) {
                $price = $item->product->price;
                if (isset($item->product->discount) && $item->product->discount > 0) {
                    $discountedPrice = $price * (1 - ($item->product->discount / 100));
                    $price = $discountedPrice;
                }
                $subtotal += $price * $item->quantity;
            }
        }

        $shippingFee = 50; 
        $grandTotal = $subtotal + $shippingFee;

        return DB::transaction(function () use ($user, $cart, $checkoutItems, $selectedItemIds, $subtotal, $shippingFee, $grandTotal, $request) {
            $order = Order::create([
                'user_id'          => $user->id,
                'subtotal'         => $subtotal,      
                'shipping_fee'     => $shippingFee,   
                'total_amount'     => $grandTotal,    
                'status'           => 'Pending',
                'payment_type'     => $request->payment_type,
                'shipping_address' => $request->shipping_address
            ]);

            foreach ($checkoutItems as $item) {
                if ($item->product) {
                    $finalItemPrice = $item->product->price;
                    if (isset($item->product->discount) && $item->product->discount > 0) {
                        $finalItemPrice = $item->product->price * (1 - ($item->product->discount / 100));
                    }

                    OrderItem::create([
                        'order_id'          => $order->id,
                        'product_id'        => $item->product_id,
                        'quantity'          => $item->quantity,
                        'price_at_purchase' => $finalItemPrice
                    ]);

                    $item->product->decrement('stock', $item->quantity);
                }
            }

            CartItem::whereIn('id', $selectedItemIds)->delete();

            return response()->json([
                'message'  => 'Order placed successfully!',
                'order_id' => $order->id
            ], 201);
        });
    }

    // Updated Index to return all orders (Frontend handles pagination for now)
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->is_admin) {
             $orders = Order::orderBy('created_at', 'desc')->with(['orderItems.product', 'user'])->get();
        } else {
             $orders = Order::where('user_id', $user->id)->orderBy('created_at', 'desc')->with('orderItems.product')->get();
        }
        return response()->json($orders);
    }

    // 1. Direct Cancel (Only for Pending/Processing)
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::where('id', $id)->where('user_id', $user->id)->first();

        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        if (!in_array($order->status, ['Pending', 'Processing'])) {
            return response()->json(['message' => 'Order cannot be cancelled directly at this stage.'], 400);
        }

        // Restore Stock
        foreach($order->orderItems as $item) {
           if($item->product) $item->product->increment('stock', $item->quantity);
        }

        $order->update(['status' => 'Cancelled']);
        return response()->json(['message' => 'Order cancelled successfully']);
    }

    // 2. Request Cancellation (For Shipped Orders)
    public function requestCancel(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::where('id', $id)->where('user_id', $user->id)->first();

        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        if ($order->status !== 'Shipped') {
            return response()->json(['message' => 'Cancellation request is only for Shipped orders.'], 400);
        }

        $order->update(['status' => 'Return Requested']);
        return response()->json(['message' => 'Cancellation request sent to Admin.']);
    }

    // 3. Mark as Received (For Shipped/Delivered Orders)
    public function markAsReceived(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::where('id', $id)->where('user_id', $user->id)->first();

        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        if (!in_array($order->status, ['Shipped', 'Delivered'])) {
            return response()->json(['message' => 'Action not allowed for this status.'], 400);
        }

        $order->update(['status' => 'Completed', 'updated_at' => now()]);
        return response()->json(['message' => 'Order marked as Completed. Thank you!']);
    }

    // ... (Keep updateStatus for Admin) ...
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);
        if (!$user->is_admin) return response()->json(['message' => 'Forbidden: Admins only'], 403);

        $order = Order::find($id);
        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        $request->validate(['status' => 'required']);
        
        if ($request->status === 'Cancelled' && $order->status !== 'Cancelled') {
           foreach($order->orderItems as $item) {
              $item->product->increment('stock', $item->quantity);
           }
        }

        $order->update(['status' => $request->status]);
        return response()->json(['message' => 'Order status updated', 'order' => $order]);
    }
}