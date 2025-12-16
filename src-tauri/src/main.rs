// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::io::BufReader;
use tauri::{Emitter, Manager};

#[cfg(target_os = "linux")]
use std::sync::Arc;
#[cfg(target_os = "linux")]
use std::thread;
#[cfg(target_os = "linux")]
use std::time::Duration;

#[cfg(target_os = "linux")]
mod pn532;

// ###########################################
//                   Types
// ###########################################

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct FishInfo {
    id: u32,
    name: String,
    average_size: String,
    average_weight: String,
    average_lifespan: String,
    habitat: String,
    diet: String,
    endangered_status: String,
    blurb: String,
    image_path: String,
    fun_fact: String,
}

// ###########################################
//          Shared Functions
// ###########################################

fn load_fish_data(app_handle: &tauri::AppHandle) -> Vec<FishInfo> {
    let resource_path = app_handle
        .path()
        .resolve(
            "assets/fish_data.json",
            tauri::path::BaseDirectory::Resource,
        )
        .expect("Failed to resolve resource path");

    let file = File::open(resource_path).expect("Failed to open fish_data.json");
    let reader = BufReader::new(file);
    serde_json::from_reader(reader).expect("Failed to parse fish data JSON")
}

// ###########################################
//    NFC Reader (Linux/Raspberry Pi only)
// ###########################################

#[cfg(target_os = "linux")]
fn start_nfc_thread(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        println!("Initializing PN532 NFC reader...");

        let mut pn532 = match pn532::Pn532::new() {
            Ok(pn532) => pn532,
            Err(e) => {
                eprintln!("Failed to initialize PN532: {}", e);
                return;
            }
        };

        if !pn532.sam_config() {
            eprintln!("Failed to configure PN532 SAM");
            return;
        }

        println!("PN532 initialized successfully. Scanning for tags...");

        let fish_data = Arc::new(load_fish_data(&app_handle));

        loop {
            if pn532.read_passive_target(500).is_some() {
                if let Some(fish_id) = pn532.read_fish_id() {
                    println!("Scanned fish ID: {}", fish_id);

                    if let Some(fish) = fish_data.iter().find(|f| f.id == fish_id) {
                        if let Err(e) = app_handle.emit("fishData", fish) {
                            eprintln!("Failed to emit fish data: {}", e);
                        } else {
                            println!("Emitted fish data: {}", fish.name);
                        }
                    } else {
                        eprintln!("No fish found with ID: {}", fish_id);
                    }
                }

                while pn532.read_passive_target(200).is_some() {
                    thread::sleep(Duration::from_millis(100));
                }
                println!("Tag removed, ready for next scan.");
            }

            thread::sleep(Duration::from_millis(75));
        }
    });
}

#[cfg(not(target_os = "linux"))]
fn start_nfc_thread(_app_handle: tauri::AppHandle) {
    println!("NFC reader not available on this platform (non-Linux)");
    println!("Running in development mode without NFC hardware.");
}

// ###########################################
//              Debug Commands
// ###########################################

#[cfg(not(target_os = "linux"))]
#[tauri::command]
fn debug_scan_random_fish(app_handle: tauri::AppHandle) {
    let fish_data = load_fish_data(&app_handle);
    let random_id = (rand::random::<u32>() % fish_data.len() as u32) + 1;

    if let Some(fish) = fish_data.iter().find(|f| f.id == random_id) {
        if let Err(e) = app_handle.emit("fishData", fish) {
            eprintln!("Failed to emit fish data: {}", e);
        } else {
            println!("Debug: Emitted fish data: {}", fish.name);
        }
    }
}

#[cfg(target_os = "linux")]
#[tauri::command]
fn debug_scan_random_fish(_app_handle: tauri::AppHandle) {
    // No-op on Linux - real NFC reader is used
}

// ###########################################
//               Entry Point
// ###########################################

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![debug_scan_random_fish])
        .setup(|app| {
            start_nfc_thread(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
