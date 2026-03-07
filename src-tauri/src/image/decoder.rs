use crate::error::AppError;
use crate::image::buffer::RawImageBuffer;
use crate::image::formats;
use std::path::Path;

/// Decode an image file into a RawImageBuffer (f32 RGBA).
pub fn decode_image(path: &str) -> Result<RawImageBuffer, AppError> {
    let path_ref = Path::new(path);
    let ext = path_ref
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    let mut buffer = match ext.as_str() {
        "exr" => formats::exr::decode(path)?,
        "hdr" => formats::hdr::decode(path)?,
        "dds" => formats::dds::decode(path)?,
        "psd" | "psb" => formats::psd::decode(path)?,
        "png" | "jpg" | "jpeg" | "gif" | "bmp" | "tga" | "tiff" | "tif" | "webp" => {
            formats::standard::decode(path)?
        }
        _ => {
            // Try standard decoder as fallback
            formats::standard::decode(path).map_err(|_| {
                AppError::UnsupportedFormat(ext.clone())
            })?
        }
    };

    buffer.file_path = path.to_string();
    buffer.format_name = ext.to_uppercase();

    Ok(buffer)
}
