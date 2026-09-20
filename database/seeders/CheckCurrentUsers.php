<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Order;

class CheckCurrentUsers extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "=== CURRENT USERS IN DATABASE ===\n\n";

        $users = User::all(['id', 'username', 'full_name', 'email', 'role']);

        foreach ($users as $user) {
            echo "ID: {$user->id}\n";
            echo "Username: {$user->username}\n";
            echo "Full Name: {$user->full_name}\n";
            echo "Email: {$user->email}\n";
            echo "Role: {$user->role}\n";
            echo "Is Active: " . ($user->is_active ? 'Yes' : 'No') . "\n";
            echo "─────────────────────────────\n";
        }

        echo "\n=== TOTAL USERS: {$users->count()} ===\n\n";

        echo "=== ORDERS IN DATABASE ===\n\n";
        $orders = Order::all(['order_id', 'user_id', 'customer_id', 'total_amount', 'status']);
        echo "Total Orders: {$orders->count()}\n\n";

        foreach ($orders as $order) {
            echo "Order ID: {$order->order_id}\n";
            echo "User ID: {$order->user_id}\n";
            echo "Customer ID: {$order->customer_id}\n";
            echo "Total Amount: ₱{$order->total_amount}\n";
            echo "Status: {$order->status}\n";
            echo "─────────────────────────────\n";
        }
    }
}
