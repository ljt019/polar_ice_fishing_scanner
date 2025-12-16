//! PN532 NFC HAT driver for Raspberry Pi
//! Based on Waveshare's official implementation
//! Local copy at time of writing saved to this repo at './pnc_hat_docs.pdf',
//! the same page can be located at: https://www.waveshare.com/wiki/PN532_NFC_HAT

use gpio_cdev::{Chip, LineHandle, LineRequestFlags};
use spidev::{SpiModeFlags, Spidev, SpidevOptions, SpidevTransfer};
use std::thread::sleep;
use std::time::{Duration, Instant};

const PN532_PREAMBLE: u8 = 0x00;
const PN532_STARTCODE1: u8 = 0x00;
const PN532_STARTCODE2: u8 = 0xFF;
const PN532_POSTAMBLE: u8 = 0x00;
const PN532_HOSTTOPN532: u8 = 0xD4;
const PN532_PN532TOHOST: u8 = 0xD5;

const CMD_SAMCONFIGURATION: u8 = 0x14;
const CMD_INLISTPASSIVETARGET: u8 = 0x4A;
const CMD_INDATAEXCHANGE: u8 = 0x40;

const NTAG_CMD_READ: u8 = 0x30;

const SPI_DATAWRITE: u8 = 0x01;
const SPI_STATREAD: u8 = 0x02;
const SPI_DATAREAD: u8 = 0x03;
const SPI_READY: u8 = 0x01;

const ACK: [u8; 6] = [0x00, 0x00, 0xFF, 0x00, 0xFF, 0x00];

const RESET_PIN: u32 = 20;
const NSS_PIN: u32 = 4;

fn reverse_bit(b: u8) -> u8 {
    let mut result: u8 = 0;
    let mut num = b;
    for _ in 0..8 {
        result <<= 1;
        result += num & 1;
        num >>= 1;
    }
    result
}

pub struct Pn532 {
    spi: Spidev,
    cs: LineHandle,
    reset: LineHandle,
}

impl Pn532 {
    pub fn new() -> Result<Self, String> {
        let mut spi =
            Spidev::open("/dev/spidev0.0").map_err(|e| format!("Failed to open SPI: {}", e))?;

        spi.configure(
            &SpidevOptions::new()
                .bits_per_word(8)
                .max_speed_hz(1_000_000)
                .mode(SpiModeFlags::SPI_MODE_0)
                .build(),
        )
        .map_err(|e| format!("Failed to configure SPI: {}", e))?;

        let mut chip =
            Chip::new("/dev/gpiochip0").map_err(|e| format!("Failed to open GPIO: {}", e))?;

        let cs = chip
            .get_line(NSS_PIN)
            .map_err(|e| format!("Failed to get NSS pin: {}", e))?
            .request(LineRequestFlags::OUTPUT, 1, "pn532-cs")
            .map_err(|e| format!("Failed to request CS: {}", e))?;

        let reset = chip
            .get_line(RESET_PIN)
            .map_err(|e| format!("Failed to get reset pin: {}", e))?
            .request(LineRequestFlags::OUTPUT, 1, "pn532-reset")
            .map_err(|e| format!("Failed to request reset: {}", e))?;

        let mut pn532 = Self { spi, cs, reset };
        pn532.hardware_reset();
        pn532.wakeup();
        Ok(pn532)
    }

    fn hardware_reset(&mut self) {
        self.reset.set_value(1).ok();
        sleep(Duration::from_millis(100));
        self.reset.set_value(0).ok();
        sleep(Duration::from_millis(500));
        self.reset.set_value(1).ok();
        sleep(Duration::from_millis(100));
    }

    fn cs_low(&self) {
        self.cs.set_value(0).ok();
    }

    fn cs_high(&self) {
        self.cs.set_value(1).ok();
    }

    fn spi_rw(&mut self, data: &mut [u8]) {
        self.cs_low();
        sleep(Duration::from_millis(1));

        for b in data.iter_mut() {
            *b = reverse_bit(*b);
        }

        let tx = data.to_vec();
        let mut transfer = SpidevTransfer::read_write(&tx, data);
        self.spi.transfer(&mut transfer).ok();

        for b in data.iter_mut() {
            *b = reverse_bit(*b);
        }

        sleep(Duration::from_millis(1));
        self.cs_high();
    }

    fn wakeup(&mut self) {
        sleep(Duration::from_millis(1000));
        self.cs_low();
        sleep(Duration::from_millis(2));
        let mut data = [0x00u8];
        data[0] = reverse_bit(data[0]);
        let tx = data.to_vec();
        let mut transfer = SpidevTransfer::read_write(&tx, &mut data);
        self.spi.transfer(&mut transfer).ok();
        sleep(Duration::from_millis(1000));
        self.cs_high();
    }

    fn read_data(&mut self, count: usize) -> Vec<u8> {
        let mut frame = vec![0u8; count + 1];
        frame[0] = SPI_DATAREAD;
        sleep(Duration::from_millis(5));
        self.spi_rw(&mut frame);
        frame[1..].to_vec()
    }

    fn write_data(&mut self, data: &[u8]) {
        let mut frame = vec![0u8; data.len() + 1];
        frame[0] = SPI_DATAWRITE;
        frame[1..].copy_from_slice(data);
        self.spi_rw(&mut frame);
    }

    fn wait_ready(&mut self, timeout_ms: u64) -> bool {
        let start = Instant::now();
        while start.elapsed().as_millis() < timeout_ms as u128 {
            sleep(Duration::from_millis(10));
            let mut status = [SPI_STATREAD, 0x00];
            self.spi_rw(&mut status);
            if status[1] == SPI_READY {
                return true;
            }
            sleep(Duration::from_millis(5));
        }
        false
    }

    fn write_frame(&mut self, data: &[u8]) {
        let len = data.len() as u8;
        let lcs = (!len).wrapping_add(1);
        let checksum: u8 = data.iter().fold(0u8, |acc, &b| acc.wrapping_add(b));
        let dcs = (!checksum).wrapping_add(1);

        let mut frame = vec![PN532_PREAMBLE, PN532_STARTCODE1, PN532_STARTCODE2, len, lcs];
        frame.extend_from_slice(data);
        frame.push(dcs);
        frame.push(PN532_POSTAMBLE);

        self.write_data(&frame);
    }

    fn read_frame(&mut self, length: usize) -> Option<Vec<u8>> {
        let buf = self.read_data(length + 7);

        let mut offset = 0;
        while offset < buf.len() && buf[offset] == 0x00 {
            offset += 1;
        }
        if offset >= buf.len() || buf[offset] != 0xFF {
            return None;
        }
        offset += 1;

        if offset >= buf.len() {
            return None;
        }

        let frame_len = buf[offset] as usize;
        if ((frame_len as u8).wrapping_add(buf[offset + 1])) != 0 {
            return None;
        }

        let checksum: u8 = buf[offset + 2..offset + 2 + frame_len + 1]
            .iter()
            .fold(0u8, |acc, &b| acc.wrapping_add(b));
        if checksum != 0 {
            return None;
        }

        Some(buf[offset + 2..offset + 2 + frame_len].to_vec())
    }

    fn read_ack(&mut self) -> bool {
        let buf = self.read_data(6);
        buf == ACK
    }

    fn call(
        &mut self,
        cmd: u8,
        params: &[u8],
        response_len: usize,
        timeout_ms: u64,
    ) -> Option<Vec<u8>> {
        let mut data = vec![PN532_HOSTTOPN532, cmd];
        data.extend_from_slice(params);

        self.write_frame(&data);

        if !self.wait_ready(timeout_ms) {
            return None;
        }

        if !self.read_ack() {
            return None;
        }

        if !self.wait_ready(timeout_ms) {
            return None;
        }

        let resp = self.read_frame(response_len + 2)?;

        if resp.len() < 2 || resp[0] != PN532_PN532TOHOST || resp[1] != cmd + 1 {
            return None;
        }

        Some(resp[2..].to_vec())
    }

    pub fn sam_config(&mut self) -> bool {
        self.call(CMD_SAMCONFIGURATION, &[0x01, 0x14, 0x01], 0, 1000)
            .is_some()
    }

    pub fn read_passive_target(&mut self, timeout_ms: u64) -> Option<Vec<u8>> {
        let resp = self.call(CMD_INLISTPASSIVETARGET, &[0x01, 0x00], 19, timeout_ms)?;

        if resp.is_empty() || resp[0] != 0x01 {
            return None;
        }

        if resp.len() > 5 {
            let uid_len = resp[5] as usize;
            if resp.len() >= 6 + uid_len {
                return Some(resp[6..6 + uid_len].to_vec());
            }
        }
        None
    }

    /// Read an NTAG2xx block (4 bytes per page, returns 16 bytes = 4 pages)
    pub fn ntag_read_block(&mut self, page: u8) -> Option<Vec<u8>> {
        let params = [0x01, NTAG_CMD_READ, page];
        let resp = self.call(CMD_INDATAEXCHANGE, &params, 17, 500)?;

        if resp.is_empty() || resp[0] != 0x00 {
            return None;
        }

        Some(resp[1..].to_vec())
    }

    /// looks for "en" followed by digits to find fish id entries
    pub fn read_fish_id(&mut self) -> Option<u32> {
        let mut all_data = Vec::new();

        // read returns 16 bytes, we are using NTAG213 so 45 pages (0-44)
        for page in (0..45).step_by(4) {
            if let Some(data) = self.ntag_read_block(page as u8) {
                all_data.extend_from_slice(&data);
            } else {
                break;
            }
        }

        if let Some(pos) = all_data.windows(2).position(|w| w == b"en") {
            let start = pos + 2;
            if start < all_data.len() {
                let mut num_str = String::new();
                for &b in &all_data[start..] {
                    if b.is_ascii_digit() {
                        num_str.push(b as char);
                    } else {
                        break;
                    }
                }
                if !num_str.is_empty() {
                    return num_str.parse().ok();
                }
            }
        }

        None
    }
}
