<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use Carbon\Carbon;

class AutoCompleteOrders extends Command
{
    protected $signature = 'orders:autocomplete';
    protected $description = 'Automatically mark Delivered orders as Completed after 3 days';

    public function handle()
    {
        // Find orders that are 'Delivered' and updated more than 3 days ago
        $orders = Order::where('status', 'Delivered')
                       ->where('updated_at', '<=', Carbon::now()->subDays(3))
                       ->get();

        foreach ($orders as $order) {
            $order->update(['status' => 'Completed']);
            $this->info("Order ID {$order->id} auto-completed.");
        }

        $this->info('Auto-complete check finished.');
    }
}