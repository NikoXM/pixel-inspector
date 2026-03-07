mod commands;
mod error;
mod image;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::file::open_image,
            commands::pixels::get_pixel,
            commands::pixels::get_all_pixels,
            commands::pixels::get_tile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
