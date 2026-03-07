use crate::error::AppError;
use crate::image::buffer::RawImageBuffer;

/// Decode PSD files using the `psd` crate.
pub fn decode(path: &str) -> Result<RawImageBuffer, AppError> {
    let bytes =
        std::fs::read(path).map_err(|e| AppError::ImageDecode(format!("PSD read error: {e}")))?;

    let psd = psd::Psd::from_bytes(&bytes)
        .map_err(|e| AppError::ImageDecode(format!("PSD parse error: {e}")))?;

    let width = psd.width();
    let height = psd.height();

    // Get the final composited RGBA image
    let rgba_u8 = psd.rgba();

    // Convert u8 RGBA to f32 RGBA
    let data: Vec<f32> = rgba_u8.iter().map(|&b| b as f32 / 255.0).collect();

    Ok(RawImageBuffer::new(width, height, data, false))
}
