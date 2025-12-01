<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     */
    public function index()
    {
        return response()->json(Category::all(), 200);
    }

    /**
     * Display the specified category by ID or SLUG.
     */
    public function show($key)
    {
        // Try finding by Slug first (common for URLs)
        $category = Category::where('slug', $key)->first();

        // Fallback to ID
        if (!$category) {
            $category = Category::find($key);
        }

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json($category, 200);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255|unique:categories,category_name', // FIX: Matches DB
            'image_url'     => 'nullable|string', // FIX: Matches DB
            // 'description' => 'nullable|string' // Add if you have this column
        ]);

        // Auto-generate slug
        $validated['slug'] = Str::slug($validated['category_name']);

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully',
            'category' => $category
        ], 201);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $validated = $request->validate([
            'category_name' => 'sometimes|string|max:255|unique:categories,category_name,' . $category->id,
            'image_url'     => 'sometimes|string',
        ]);

        // Regenerate slug if name changes
        if (isset($validated['category_name'])) {
            $validated['slug'] = Str::slug($validated['category_name']);
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully',
            'category' => $category
        ], 200);
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully'], 200);
    }
}