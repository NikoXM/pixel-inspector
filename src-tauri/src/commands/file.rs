use crate::error::AppError;
use crate::image::decoder;
use crate::state::AppState;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct ImageInfo {
    pub width: u32,
    pub height: u32,
    pub is_hdr: bool,
    pub format_name: String,
    pub file_path: String,
    pub pixel_count: usize,
}

/// Open an image file and load it into memory.
/// Returns image metadata (dimensions, format, etc.)
#[tauri::command]
pub fn open_image(path: String, state: State<AppState>) -> Result<ImageInfo, AppError> {
    let buffer = decoder::decode_image(&path)?;

    let info = ImageInfo {
        width: buffer.width,
        height: buffer.height,
        is_hdr: buffer.is_hdr,
        format_name: buffer.format_name.clone(),
        file_path: buffer.file_path.clone(),
        pixel_count: buffer.pixel_count(),
    };

    let mut image_guard = state.image.lock().map_err(|_| AppError::LockError)?;
    *image_guard = Some(buffer);

    Ok(info)
}
