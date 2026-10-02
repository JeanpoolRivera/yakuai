<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        return response()->json(User::query()->latest('id')->paginate(20));
    }

    public function store(UserRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (($data['role'] ?? null) === 'agricultor' && empty($data['farmer_id'])) {
            return response()->json(['error' => ['message' => 'Agricultor requiere farmer_id.', 'fields' => ['farmer_id' => ['El agricultor debe estar vinculado a un agricultor.']]]], 422);
        }

        $user = User::create($data);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'farmer_id'])], 201);
    }

    public function show(User $user): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['error' => ['message' => 'Sin permiso para esta acción.']], 403);
        }

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'farmer_id'])]);
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('role', $data) && $data['role'] === 'agricultor' && empty($data['farmer_id']) && empty($user->farmer_id)) {
            return response()->json(['error' => ['message' => 'Agricultor requiere farmer_id.', 'fields' => ['farmer_id' => ['El agricultor debe estar vinculado a un agricultor.']]]], 422);
        }

        if (array_key_exists('password', $data) && $data['password'] === null) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'farmer_id'])]);
    }
}
