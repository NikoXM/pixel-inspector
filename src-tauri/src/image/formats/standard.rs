use crate::error::AppError;
use crate::image::buffer::RawImageBuffer;
use image::io::Reader as ImageReader;
use image::DynamicImage;

/// Decode standard image formats (PNG, JPG, BMP, GIF, TGA, TIFF, WebP) via the `image` crate.
pub fn decode(path: &str) -> Result<RawImageBuffer, AppError> {
    let img = ImageReader::open(path)
        .map_err(|e| AppError::ImageDecode(format!("Failed to open: {e}")))?
        .decode()
        .map_err(|e| AppError::ImageDecode(format!("Failed to decode: {e}")))?;

    Ok(dynamic_image_to_buffer(img))
}

/// Convert a DynamicImage to our f32 RGBA buffer.
pub fn dynamic_image_to_buffer(img: DynamicImage) -> RawImageBuffer {
    let rgba = img.to_rgba32f();
    let (width, height) = rgba.dimensions();
    let data: Vec<f32> = rgba.into_raw();

    RawImageBuffer::new(width, height, data, false)
}
