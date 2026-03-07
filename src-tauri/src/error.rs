use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Image decode error: {0}")]
    ImageDecode(String),

    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),

    #[error("No image loaded")]
    NoImageLoaded,

    #[error("Pixel out of bounds: ({x}, {y}) for image {width}x{height}")]
    PixelOutOfBounds {
        x: u32,
        y: u32,
        width: u32,
        height: u32,
    },

    #[error("Lock error")]
    LockError,
}

// Implement serialization for Tauri command error responses
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
