use std::sync::Mutex;
use crate::image::buffer::RawImageBuffer;

#[derive(Default)]
pub struct AppState {
    pub image: Mutex<Option<RawImageBuffer>>,
}
