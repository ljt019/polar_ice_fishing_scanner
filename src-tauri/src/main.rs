// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;

#[cfg(target_os = "linux")]
use std::thread;
#[cfg(target_os = "linux")]
use std::time::Duration;

#[cfg(target_os = "linux")]
mod pn532;

// ###########################################
//              Fish Data
// ###########################################

#[derive(serde::Serialize, Debug, Clone)]
struct FishInfo {
    id: u32,
    name: &'static str,
    average_size: &'static str,
    average_weight: &'static str,
    average_lifespan: &'static str,
    habitat: &'static str,
    diet: &'static str,
    endangered_status: &'static str,
    blurb: &'static str,
    image_path: &'static str,
    fun_fact: &'static str,
}

const FISH_DATA: &[FishInfo] = &[
    FishInfo {
        id: 1,
        name: "Salmon",
        average_size: "2 to 5 feet",
        average_weight: "5 to 30 pounds",
        average_lifespan: "3 to 8 years",
        habitat: "North Atlantic and Pacific Oceans",
        diet: "Carnivorous, feeding on insects, zooplankton, crustaceans, and smaller fish",
        endangered_status: "Least Concern",
        blurb: "Salmon are anadromous fish, meaning they live in both fresh and saltwater at different stages of their lives. Born in freshwater rivers and streams, they migrate to the ocean to mature before returning to their birthplace to spawn. Known for their rich flavor and high nutritional value, salmon are popular in both commercial and recreational fishing industries. They play a vital role in their ecosystems, supporting other species such as bears, eagles, and humans. Some salmon species can travel hundreds of miles and overcome significant obstacles to reach their spawning grounds, demonstrating remarkable endurance and navigational skills.",
        image_path: "/salmon.jpg",
        fun_fact: "Salmon are capable of leaping up to 12 feet in the air to overcome obstacles while migrating upstream to spawn.",
    },
    FishInfo {
        id: 2,
        name: "Greenland Halibut",
        average_size: "2 to 3 feet",
        average_weight: "5 to 40 pounds",
        average_lifespan: "25 to 30 years",
        habitat: "Arctic and North Atlantic Oceans",
        diet: "Carnivorous, feeding on fish, squid, and crustaceans",
        endangered_status: "Endangered",
        blurb: "The Greenland halibut, also known as the Greenland turbot, is a deep-sea flatfish found in the frigid waters of the Arctic and North Atlantic. Unlike the Pacific halibut, this species lives at great depths, often between 600 and 2,000 feet. Its diet consists primarily of fish, squid, and crustaceans. Greenland halibut have a distinctive appearance, with their top side being dark and their underside pale, blending well with the ocean floor. They are a significant commercial species in Arctic fisheries and play a vital role in the ecosystem as a predator.",
        image_path: "/greenland_halibut.jpg",
        fun_fact: "Greenland halibut are known for their slow growth rate and long lifespan, with some individuals living up to 30 years.",
    },
    FishInfo {
        id: 3,
        name: "Arctic Cod",
        average_size: "1 to 2 feet",
        average_weight: "1 to 3 pounds",
        average_lifespan: "8 to 12 years",
        habitat: "Arctic Ocean",
        diet: "Carnivorous, feeding on zooplankton, small fish, and invertebrates",
        endangered_status: "Not Evaluated",
        blurb: "The Arctic cod, also known as polar cod, is a small, silvery fish found in the cold, deep waters of the Arctic Ocean. They play a crucial role in the Arctic food web, serving as a primary food source for larger predators such as seals, whales, and seabirds. Arctic cod are known for their ability to survive in extreme cold temperatures and low light conditions. They have antifreeze proteins in their blood that prevent ice crystals from forming and damaging their cells. Arctic cod are an essential species in the Arctic ecosystem, supporting a diverse range of predators and contributing to the overall health of the marine environment.",
        image_path: "/polar_cod.jpg",
        fun_fact: "Arctic cod are capable of surviving in water temperatures as low as -2 degrees Celsius, thanks to their antifreeze proteins.",
    },
    FishInfo {
        id: 4,
        name: "Antarctic Toothfish",
        average_size: "4 to 6 feet",
        average_weight: "50 to 200 pounds",
        average_lifespan: "10 to 15 years",
        habitat: "Arctic Ocean",
        diet: "Carnivorous, feeding on fish, squid, and crustaceans",
        endangered_status: "Not Evaluated",
        blurb: "The Antarctic toothfish, also known as the Chilean sea bass, is a large predatory fish found in the cold waters of the Southern Ocean around Antarctica. They are known for their long lifespan, slow growth rate, and high oil content, making them a valuable commercial species. Antarctic toothfish have a unique adaptation called cryopelagic drift, where they release buoyant eggs that drift with the currents to hatch in more favorable conditions. This strategy allows them to reproduce in the harsh Antarctic environment. Antarctic toothfish play a vital role in the Antarctic ecosystem as top predators, controlling the populations of smaller fish and squid.",
        image_path: "/antarctic_toothfish.jpg",
        fun_fact: "Antarctic toothfish are known for their deep-sea habitat, living at depths of up to 6,600 feet in the Southern Ocean.",
    },
    FishInfo {
        id: 5,
        name: "Spiny Icefish",
        average_size: "6 to 10 inches",
        average_weight: "Less than 1 pound",
        average_lifespan: "2 to 3 years",
        habitat: "Arctic Ocean",
        diet: "Carnivorous, feeding on krill and small fish",
        endangered_status: "Not Evaluated",
        blurb: "The Antarctic spiny icefish is a small, translucent fish found in the cold waters of the Southern Ocean around Antarctica. They are known for their unique adaptation to the extreme cold temperatures of the Antarctic environment. Antarctic spiny icefish lack red blood cells and hemoglobin, which are typically used to transport oxygen in most vertebrates. Instead, they have a specialized protein that binds to oxygen and allows them to survive in oxygen-poor waters. Antarctic spiny icefish play a crucial role in the Antarctic food web, serving as prey for larger predators such as seals, whales, and seabirds.",
        image_path: "/spiny_icefish.jpg",
        fun_fact: "Antarctic spiny icefish lack red blood cells and hemoglobin, relying on a specialized protein to transport oxygen in their blood.",
    },
];

// ###########################################
//    NFC Reader (Linux/Raspberry Pi only)
// ###########################################

// Both real implementatinos for the actual raspberry pi with the reader
// and the stubs used for debug and development.
// This only works since I'm developing on a windows machine not a linux
// machine lol. If you try to develop this from linux the it will try to use a
// non-existent NFC reader and crash, no such thing as target_os = "raspberry_pi" sadly

#[cfg(target_os = "linux")]
const TAG_DETECT_TIMEOUT_MS: u64 = 500;
#[cfg(target_os = "linux")]
const TAG_REMOVAL_CHECK_MS: u64 = 200;
#[cfg(target_os = "linux")]
const TAG_REMOVAL_POLL_MS: u64 = 100;
#[cfg(target_os = "linux")]
const MAIN_LOOP_INTERVAL_MS: u64 = 50;

#[cfg(target_os = "linux")]
fn wait_for_tag_removal(pn532: &mut pn532::Pn532) {
    while pn532.read_passive_target(TAG_REMOVAL_CHECK_MS).is_some() {
        thread::sleep(Duration::from_millis(TAG_REMOVAL_POLL_MS));
    }
    println!("Tag removed, ready for next scan.");
}

#[cfg(target_os = "linux")]
fn start_nfc_thread(app_handle: tauri::AppHandle) {
    thread::spawn(move || {
        println!("Scanner: Initializing PN532 NFC reader...");

        let mut pn532 = match pn532::Pn532::new() {
            Ok(pn532) => pn532,
            Err(e) => {
                eprintln!("Scanner: Failed to initialize PN532 - {}", e);
                return;
            }
        };

        if !pn532.sam_config() {
            eprintln!("Scanner: Failed to configure PN532 SAM");
            return;
        }

        println!("Scanner: PN532 initialized successfully. Scanning for tags...");

        loop {
            if pn532.read_passive_target(TAG_DETECT_TIMEOUT_MS).is_none() {
                thread::sleep(Duration::from_millis(MAIN_LOOP_INTERVAL_MS));
                continue;
            }

            let Some(fish_id) = pn532.read_fish_id() else {
                wait_for_tag_removal(&mut pn532);
                continue;
            };

            let Some(fish) = FISH_DATA.iter().find(|f| f.id == fish_id) else {
                eprintln!("Scanner: Fish ID '{}' - Not Found", fish_id);
                wait_for_tag_removal(&mut pn532);
                continue;
            };

            if let Err(error) = app_handle.emit("fishData", fish) {
                eprintln!("Scanner: Fish ID '{}' - Failed to Emit {}", fish_id, error);
                return;
            }

            println!("Scanner: {} ({})", fish.name, fish_id);

            wait_for_tag_removal(&mut pn532);
        }
    });
}

/// Stub for debug builds without NFC hardware :D
#[cfg(not(target_os = "linux"))]
fn start_nfc_thread(_app_handle: tauri::AppHandle) {
    println!("Scanner: NFC reader not available on this platform");
    println!("Scanner: Running in development mode without NFC hardware.");
}

// ###########################################
//              Debug Commands
// ###########################################

#[tauri::command]
fn debug_scan_random_fish(app_handle: tauri::AppHandle) {
    let random_fish_id = (rand::random::<u32>() % FISH_DATA.len() as u32) + 1;

    let Some(fish) = FISH_DATA.iter().find(|f| f.id == random_fish_id) else {
        unreachable!("Scanner: Fish ID '{}' - Not Found", random_fish_id);
    };

    if let Err(error) = app_handle.emit("fishData", fish) {
        eprintln!(
            "Scanner: Fish ID '{}' - Failed to Emit {}",
            random_fish_id, error
        );
        return;
    }

    println!("Scanner: {} ({})", fish.name, random_fish_id);
}

// ###########################################
//               Entry Point
// ###########################################

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![debug_scan_random_fish])
        .setup(|app| {
            start_nfc_thread(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
