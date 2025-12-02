<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $items = OrderItem::whereHas('order', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['product', 'order'])->get();

        return response()->json($items);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $item = OrderItem::whereHas('order', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['product', 'order'])->find($id);

        if (!$item) return response()->json(['message' => 'Order item not found'], 404);

        return response()->json($item);
    }
}