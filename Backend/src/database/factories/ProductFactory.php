<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Category;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        // Default placeholder (overridden by sequence below)
        return [
            'product_name' => 'Default Product',
            'slug' => 'default-product',
            'price' => 10.00,
            'is_active' => true,
            'description' => 'Default description',
            'category_id' => 1,
            'image_url' => '/img/products/default.png',
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure()
    {
        return $this->sequence(function ($sequence) {
            // Your specific list of products
            $products = [
                [
                    "name" => "Kopiko 3-in-1 Coffee (10 sachets)",
                    "price" => 85.00,
                    "imageUrl" => "https://i.ibb.co/cSS1BvxY/Kopiko-Brown-Coffee.png",
                    "description" => "Instant 3-in-1 coffee mix, a popular and convenient choice for a quick coffee break.",
                    "categoryId" => 1,
                    "stock" => 10
                ],
                [
                    "name" => "C2 Apple Green Tea (500ml)",
                    "price" => 25.00,
                    "imageUrl" => "https://i.ibb.co/8g0nYTpF/C2.png",
                    "description" => "A refreshing ready-to-drink green tea beverage with a crisp apple flavor.",
                    "categoryId" => 1,
                    "stock" => 10
                ],
                [
                    "name" => "Bear Brand Sterilized Milk (1L)",
                    "price" => 90.00,
                    "imageUrl" => "https://i.ibb.co/Z1BmpM0M/Bear-Brand.png",
                    "description" => "Fortified ready-to-drink sterilized milk, a staple in many Filipino households.",
                    "categoryId" => 2,
                    "stock" => 10
                ],
                [
                    "name" => "Eden Processed Cheese Block (165g)",
                    "price" => 60.00,
                    "imageUrl" => "https://i.ibb.co/1tCYyqC8/Eden.png",
                    "description" => "The classic creamy and salty processed cheese, perfect for sandwiches and pandesal.",
                    "categoryId" => 2,
                    "stock" => 10
                ],
                [
                    "name" => "Oishi Prawn Crackers (Spicy Flavor)",
                    "price" => 20.00,
                    "imageUrl" => "https://i.ibb.co/Vcj4fyM7/Oishi.png",
                    "description" => "A favorite Filipino snack, these crackers are crunchy, savory, and have a spicy kick.",
                    "categoryId" => 3, 
                    "stock" => 10
                ],
                [
                    "name" => "Piattos Potato Crisps (Cheese Flavor)",
                    "price" => 22.00,
                    "imageUrl" => "https://i.ibb.co/RGH57Nft/Piattos.png",
                    "description" => "Thin, hexagonal potato crisps with a rich cheese flavor.",
                    "categoryId" => 3, 
                    "stock" => 10
                ],
                [
                    "name" => "Pandesal",
                    "price" => 100.00,
                    "imageUrl" => "https://i.ibb.co/vC76XNP2/Pandesal.png",
                    "description" => "A classic Filipino bread roll, soft and slightly sweet, perfect for breakfast.",
                    "categoryId" => 4, 
                    "stock" => 10
                ],
                [
                    "name" => "Cheese Ensaymada",
                    "price" => 99.00,
                    "imageUrl" => "https://i.ibb.co/Xfmz7fw9/Ensaymada.png",
                    "description" => "A soft, sweet bread topped with butter, sugar, and grated cheese.",
                    "categoryId" => 4, 
                    "stock" => 10
                ],
                [
                    "name" => "San Miguel Pale Pilsen (320ml Bottle)",
                    "price" => 45.00,
                    "imageUrl" => "https://i.ibb.co/4nPBHT4t/San-Miguel.png",
                    "description" => "The iconic Filipino pale lager, known for its balanced taste and refreshing finish.",
                    "categoryId" => 1, 
                    "stock" => 10
                ]
            ];

            // Cycle through products
            $item = $products[$sequence->index % count($products)];

            return [
                'product_name' => $item['name'],
                'slug' => Str::slug($item['name']) . '-' . ($sequence->index + 1), 
                'price' => $item['price'],
                'stock' => fake()->numberBetween(1, 100),                
                 'is_active' => true,
                'description' => $item['description'],
                'category_id' => $item['categoryId'], 
                'image_url' => $item['imageUrl'],
            ];
        });
    }
}