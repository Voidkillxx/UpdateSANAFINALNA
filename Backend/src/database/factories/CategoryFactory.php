<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str; 

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        // Placeholder definition - actual data comes from sequence()
        return [
            'category_name' => 'Placeholder',
            'slug' => 'placeholder',
            'image_url' => 'https://via.placeholder.com/640x480.png/000000?text=DEFAULT'
        ];
    }

    /**
     * Configure the model factory with sequential, fixed data.
     */
    public function configure()
    {
        return $this->sequence(function ($sequence) {
            
            // Define the fixed data array with specific URLs
            $categoriesData = [
                [
                    'name' => 'Beverage',
                    // PASTE BEVERAGE LINK HERE
                    'url' => 'https://i.ibb.co/8g0nYTpF/C2.png', 
                ],
                [
                    'name' => 'Dairy',
                    // PASTE DAIRY LINK HERE
                    'url' => 'https://i.ibb.co/Z1BmpM0M/Bear-Brand.png', 
                ],
                [
                    'name' => 'Snacks',
                    // PASTE SNACKS LINK HERE
                    'url' => 'https://i.ibb.co/Vcj4fyM7/Oishi.png',
                ],
                [
                    'name' => 'Pastries',
                    // PASTE PASTRIES LINK HERE
                    'url' => 'https://i.ibb.co/vC76XNP2/Pandesal.png',
                ]
            ];

            // Use the sequence index to pick the data object
            $index = $sequence->index % count($categoriesData);
            $data = $categoriesData[$index];

            return [
                'category_name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'image_url' => $data['url'],
            ];
        });
    }
}