<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log; 

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        $user = $request->user('sanctum');

        if (!$user || !$user->is_admin) {
            $query->where('is_active', true);
        }

        if ($request->filled('category')) {
            $slugs = explode(',', $request->category);
            $query->whereHas('category', function (Builder $q) use ($slugs) {
                $q->whereIn('slug', $slugs);
            });
        }

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('product_name', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->filled('sort')) {
            switch ($request->sort) {
                case 'price_low': $query->orderBy('price', 'asc'); break;
                case 'price_high': $query->orderBy('price', 'desc'); break;
                case 'newest': $query->orderBy('created_at', 'desc'); break;
                default: $query->orderBy('product_name', 'asc');
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return response()->json($query->with('category')->paginate(20));
    }

    public function show($slug)
    {
        // FIX: Do not reuse a modified builder variable ($query) across fallback checks.
        // Try finding by slug first
        $product = Product::with('category')->where('slug', $slug)->first();
        
        // If not found by slug, try finding by ID
        if (!$product) {
            $product = Product::with('category')->find($slug);
        }

        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $user = request()->user('sanctum');
        if ((!$user || !$user->is_admin) && !$product->is_active) {
           return response()->json(['message' => 'Product not available'], 404);
        }

        return response()->json($product);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:255',
            'price'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'category_id'  => 'required|exists:categories,id',
            'description'  => 'nullable|string',
            'image_url'    => 'nullable|string',
            'is_active'    => 'boolean',
            'discount'     => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['slug'] = Str::slug($validated['product_name']) . '-' . uniqid();
        
        $validated['is_active'] = $validated['is_active'] ?? true;

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        if ($request->has('is_visible')) {
            $request->merge(['is_active' => $request->boolean('is_visible')]);
        }

        $validated = $request->validate([
            'product_name' => 'sometimes|string|max:255',
            'price'        => 'sometimes|numeric|min:0',
            'stock'        => 'sometimes|integer|min:0',
            'category_id'  => 'sometimes|exists:categories,id',
            'description'  => 'sometimes|string',
            'image_url'    => 'sometimes|string',
            'is_active'    => 'sometimes|boolean',
            'discount'     => 'nullable|numeric|min:0|max:100',
        ]);

        if (isset($validated['product_name'])) {
            $validated['slug'] = Str::slug($validated['product_name']) . '-' . uniqid();
        }

        $product->update($validated);

        return response()->json($product, 200);
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        try {
            $product->delete();
            return response()->json(['message' => 'Product deleted successfully']);
        } catch (\Exception $e) {
            Log::error("Product Deletion Failed: " . $e->getMessage());
            return response()->json(['message' => 'Failed to delete product', 'error' => $e->getMessage()], 500);
        }
    }
}