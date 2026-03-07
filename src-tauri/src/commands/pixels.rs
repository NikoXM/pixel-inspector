use crate::error::AppError;
use crate::state::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct PixelData {
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32,
}

#[derive(Serialize)]
pub struct TileData {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    /// f32 RGBA data encoded as Vec<f32>
    pub data: Vec<f32>,
}

/// Get a single pixel's RGBA values at coordinates (x, y).
#[tauri::command]
pub fn get_pixel(x: u32, y: u32, state: State<AppState>) -> Result<PixelData, AppError> {
    let image_guard = state.image.lock().map_err(|_| AppError::LockError)?;
    let buffer = image_guard.as_ref().ok_or(AppError::NoImageLoaded)?;

    let pixel = buffer.get_pixel(x, y).ok_or(AppError::PixelOutOfBounds {
        x,
        y,
        width: buffer.width,
        height: buffer.height,
    })?;

    Ok(PixelData {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
        a: pixel[3],
    })
}

/// Get all pixel data as a flat f32 array (for small images ≤16MP).
/// Returns the raw f32 RGBA data.
#[tauri::command]
pub fn get_all_pixels(state: State<AppState>) -> Result<Vec<f32>, AppError> {
    let image_guard = state.image.lock().map_err(|_| AppError::LockError)?;
    let buffer = image_guard.as_ref().ok_or(AppError::NoImageLoaded)?;

    Ok(buffer.data.clone())
}

/// Get a rectangular tile of pixel data.
#[tauri::command]
pub fn get_tile(
    x: u32,
    y: u32,
    width: u32,
    height: u32,
    state: State<AppState>,
) -> Result<TileData, AppError> {
    let image_guard = state.image.lock().map_err(|_| AppError::LockError)?;
    let buffer = image_guard.as_ref().ok_or(AppError::NoImageLoaded)?;

    let (tw, th, data) = buffer.get_tile(x, y, width, height);

    Ok(TileData {
        x,
        y,
        width: tw,
        height: th,
        data,
    })
}
