<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;

class CartItemController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'nullable|integer|min:1'
        ]);

        $quantity = $request->input('quantity', 1);
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        $existingItem = CartItem::where('cart_id', $cart->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($existingItem) {
            $existingItem->increment('quantity', $quantity);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $request->product_id,
                'quantity' => $quantity
            ]);
        }

        return response()->json(['message' => 'Item added to cart'], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate(['quantity' => 'required|integer|min:1']);

        $cartItem = CartItem::whereHas('cart', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->find($id);

        if (!$cartItem) return response()->json(['message' => 'Item not found'], 404);

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json(['message' => 'Cart updated']);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $cartItem = CartItem::whereHas('cart', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->find($id);

        if (!$cartItem) return response()->json(['message' => 'Item not found'], 404);

        $cartItem->delete();

        return response()->json(['message' => 'Item removed']);
    }
}