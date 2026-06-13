"""One-off script to generate simple placeholder PWA icons (solid background + circle)."""
import struct
import zlib

BG = (24, 24, 27)  # zinc-900
FG = (249, 115, 22)  # orange-500


def make_png(size: int, path: str) -> None:
    cx = cy = size / 2
    radius = size * 0.32

    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                row.extend(FG)
            else:
                row.extend(BG)
        rows.append(bytes(row))

    raw = b"".join(b"\x00" + row for row in rows)
    compressed = zlib.compress(raw, 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")

    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    make_png(192, "public/icons/icon-192.png")
    make_png(512, "public/icons/icon-512.png")
    make_png(180, "public/icons/apple-touch-icon.png")
    print("done")
