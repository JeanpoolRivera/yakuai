<?php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FarmerController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\IrrigationController;
use App\Http\Controllers\MeasurementController;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\PlotController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\SoilTextureController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ValidationController;
use App\Http\Controllers\WeatherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::post('/auth/login', [AuthController::class, 'unified'])->middleware('throttle:10,1');
Route::post('/auth/recover-pin', [AuthController::class, 'recoverPin'])->middleware('throttle:5,1');
Route::post('/auth/activate-farmer', [AuthController::class, 'activateFarmer'])->middleware('throttle:5,1');
Route::post('/auth/reset-pin', [AuthController::class, 'resetPin'])->middleware('throttle:5,1');

Route::middleware(['auth:sanctum', 'yakuai'])->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::patch('/users/{user}', [UserController::class, 'update']);

    Route::get('/crops', [CropController::class, 'index']);
    Route::get('/crops/{crop}', [CropController::class, 'show']);
    Route::get('/soil-textures', [SoilTextureController::class, 'index']);
    Route::get('/soil-textures/{soilTexture}', [SoilTextureController::class, 'show']);

    Route::get('/farmers', [FarmerController::class, 'index']);
    Route::post('/farmers', [FarmerController::class, 'store']);
    Route::get('/farmers/{farmer}', [FarmerController::class, 'show']);
    Route::patch('/farmers/{farmer}', [FarmerController::class, 'update']);
    Route::post('/farmers/{farmer}/invitation', [FarmerController::class, 'resendInvitation'])->middleware('throttle:3,1');

    Route::get('/plots', [PlotController::class, 'index']);
    Route::post('/plots', [PlotController::class, 'store']);
    Route::get('/plots/{plot}', [PlotController::class, 'show']);
    Route::patch('/plots/{plot}', [PlotController::class, 'update']);

    Route::get('/sensors', [SensorController::class, 'index']);
    Route::post('/sensors', [SensorController::class, 'store']);
    Route::get('/sensors/{sensor}', [SensorController::class, 'show']);
    Route::patch('/sensors/{sensor}', [SensorController::class, 'update']);
    Route::post('/sensors/{sensor}/simular', [SensorController::class, 'simular']);

    Route::get('/measurements', [MeasurementController::class, 'index']);
    Route::post('/measurements', [MeasurementController::class, 'store'])->name('measurements.store');

    Route::get('/plots/{plot}/weather', [WeatherController::class, 'latest']);
    Route::post('/plots/{plot}/weather/refresh', [WeatherController::class, 'refresh']);

    Route::post('/plots/{plot}/evaluate', [EvaluationController::class, 'evaluate']);
    Route::get('/evaluations', [EvaluationController::class, 'index']);
    Route::get('/evaluations/{evaluation}', [EvaluationController::class, 'show']);
    Route::get('/evaluations/{evaluation}/mensaje', [EvaluationController::class, 'mensaje']);

    Route::get('/irrigations', [IrrigationController::class, 'index']);
    Route::post('/irrigations', [IrrigationController::class, 'store']);
    Route::post('/irrigations/{riego}/corregir', [IrrigationController::class, 'corregir']);
    Route::post('/irrigations/{riego}/anular', [IrrigationController::class, 'anular']);

    Route::get('/alerts', [AlertController::class, 'index']);

    Route::get('/validation', [ValidationController::class, 'index']);

    Route::get('/metrics/summary', [MetricsController::class, 'summary']);
    Route::get('/metrics/evaluations', [MetricsController::class, 'evaluationsByDay']);
    Route::get('/metrics/sensors', [MetricsController::class, 'sensorHealth']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:sanctum', 'yakuai']);
