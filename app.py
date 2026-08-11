#!/usr/bin/env python3
import argparse
import csv
import json
import zipfile
from xml.etree import ElementTree as ET

NAMESPACES = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
}


def read_ods_rows(path):
    with zipfile.ZipFile(path, 'r') as archive:
        content = archive.read('content.xml')
    root = ET.fromstring(content)
    table = root.find('.//table:table', NAMESPACES)
    rows = []

    if table is None:
        raise ValueError('File tidak berisi sheet ODS yang valid.')

    for row_el in table.findall('table:table-row', NAMESPACES):
        row_values = []
        for cell in row_el.findall('table:table-cell', NAMESPACES):
            repeats = int(cell.attrib.get('{%s}number-columns-repeated' % NAMESPACES['table'], '1'))
            text = ''.join(''.join(p.itertext()) for p in cell.findall('text:p', NAMESPACES))
            row_values.extend([text] * repeats)
        rows.append(row_values)

    return rows


def normalize_two_digits(value):
    item = value.strip()
    if item == '':
        return ''
    if len(item) == 1:
        item = item.zfill(2)
    return item


def classify_size(digit):
    return 'besar' if int(digit) >= 5 else 'kecil'


def classify_parity(digit):
    return 'genap' if int(digit) % 2 == 0 else 'ganjil'


def classify_prime(digit):
    value = int(digit)
    if value in {2, 3, 5, 7}:
        return 'prima'
    return 'bukan prima'


def make_3d_candidates(two):
    return sorted({f'{prefix:01d}{two}' for prefix in range(10)} | {f'{two}{suffix:01d}' for suffix in range(10)})


def make_pattern_templates(two):
    return {
        '3D': [f'X{two}', f'{two}X'],
        '4D': [f'XX{two}', f'X{two}X', f'{two}XX'],
        '5D': [f'XXX{two}', f'XX{two}X', f'X{two}XX', f'{two}XXX'],
        '6D': [f'XXXX{two}', f'XXX{two}X', f'XX{two}XX', f'X{two}XXX', f'{two}XXXX'],
    }


def build_reference_rows(rows):
    if not rows:
        return []

    header = rows[0]
    reference = []

    for row in rows[1:]:
        if len(row) < 3:
            continue
        two = normalize_two_digits(row[0])
        if len(two) != 2 or not two.isdigit():
            continue

        category = row[1].strip()
        jalur = row[2].strip()
        d1 = int(two[0])
        d2 = int(two[1])
        digit_sum = (d1 + d2) % 10
        parity = 'genap' if digit_sum % 2 == 0 else 'ganjil'
        reverse = two[::-1]

        reference.append({
            '2D': two,
            'atas/bawah': category,
            'jalur': jalur,
            'digit1': d1,
            'digit2': d2,
            'sum': digit_sum,
            'parity': parity,
            'reverse': reverse,
            'kepala besar/kecil': classify_size(d1),
            'ekor besar/kecil': classify_size(d2),
            'kepala genap/ganjil': classify_parity(d1),
            'ekor genap/ganjil': classify_parity(d2),
            'kepala prima': classify_prime(d1),
            'ekor prima': classify_prime(d2),
            '3D_candidates': ';'.join(make_3d_candidates(two)),
            '3D_patterns': ';'.join(make_pattern_templates(two)['3D']),
            '4D_patterns': ';'.join(make_pattern_templates(two)['4D']),
            '5D_patterns': ';'.join(make_pattern_templates(two)['5D']),
            '6D_patterns': ';'.join(make_pattern_templates(two)['6D']),
        })

    return reference


def write_csv(path, rows):
    if not rows:
        raise ValueError('Tidak ada data untuk ditulis ke CSV.')

    fieldnames = list(rows[0].keys())
    with open(path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_json(path, data):
    with open(path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, indent=2, ensure_ascii=False)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Aplikasi referensi 2D/3D/4D/5D/6D dari sample.ods'
    )
    parser.add_argument('--input', '-i', default='sample.ods', help='File ODS sumber data')
    parser.add_argument('--csv', default='reference_table.csv', help='File CSV keluaran untuk tabel referensi')
    parser.add_argument('--json', default='reference_patterns.json', help='File JSON keluaran dengan pola 3D/4D/5D/6D')
    return parser.parse_args()


def main():
    args = parse_args()
    rows = read_ods_rows(args.input)
    reference = build_reference_rows(rows)

    if not reference:
        raise SystemExit('Tidak ada baris 2D valid yang ditemukan di input.')

    write_csv(args.csv, reference)
    print(f'File referensi CSV dibuat: {args.csv}')

    patterns = {item['2D']: {
        '3D_patterns': item['3D_patterns'].split(';'),
        '4D_patterns': item['4D_patterns'].split(';'),
        '5D_patterns': item['5D_patterns'].split(';'),
        '6D_patterns': item['6D_patterns'].split(';'),
    } for item in reference}
    write_json(args.json, patterns)
    print(f'File pola JSON dibuat: {args.json}')


if __name__ == '__main__':
    main()
