# Aplikasi Referensi 2D / 3D / 4D / 5D / 6D

Skrip ini membaca `sample.ods` yang berisi data 2D dan menghasilkan:

- `reference_table.csv` — tabel referensi 2D dengan atribut derivatif
- `reference_patterns.json` — pola 3D/4D/5D/6D yang dapat digunakan untuk analisis dan prediksi

## Cara pakai

Jalankan dari folder proyek:

```bash
python3 app.py
```

Jika ingin menentukan file input atau output lain:

```bash
python3 app.py --input sample.ods --csv reference_table.csv --json reference_patterns.json
```

## Output

`reference_table.csv` berisi kolom seperti:

- `2D`
- `atas/bawah`
- `jalur`
- `digit1`, `digit2`
- `sum`
- `parity`
- `reverse`
- `3D_candidates`
- `3D_patterns`
- `4D_patterns`
- `5D_patterns`
- `6D_patterns`

`reference_patterns.json` berisi pola yang siap dipakai sebagai referensi untuk menghasilkan kandidat angka 3D/4D/5D/6D.

## Antarmuka Web Premium

Jalankan server web lokal untuk membuka UI premium:

```bash
python3 webapp.py
```

Lalu buka browser ke:

```bash
http://localhost:8500
```

Di UI premium Anda dapat:

- melihat ringkasan statistik 2D
- memilih nilai 2D untuk melihat pola 3D/4D/5D/6D
- mencari dan menelusuri tabel referensi data
