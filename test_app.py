import unittest
from app import build_reference_rows


class ReferenceLogicTests(unittest.TestCase):
    def test_sum_wraps_to_single_digit_and_adds_reference_flags(self):
        rows = [
            ['dummy', 'dummy', 'dummy'],
            ['91', 'atas', '1'],
            ['23', 'bawah', '2'],
        ]

        reference = build_reference_rows(rows)

        self.assertEqual(len(reference), 2)
        self.assertEqual(reference[0]['sum'], 0)
        self.assertEqual(reference[0]['kepala besar/kecil'], 'besar')
        self.assertEqual(reference[0]['ekor besar/kecil'], 'kecil')
        self.assertEqual(reference[0]['kepala genap/ganjil'], 'ganjil')
        self.assertEqual(reference[0]['ekor genap/ganjil'], 'ganjil')
        self.assertEqual(reference[0]['kepala prima'], 'bukan prima')
        self.assertEqual(reference[0]['ekor prima'], 'bukan prima')

        self.assertEqual(reference[1]['sum'], 5)
        self.assertEqual(reference[1]['kepala besar/kecil'], 'kecil')
        self.assertEqual(reference[1]['ekor besar/kecil'], 'kecil')
        self.assertEqual(reference[1]['kepala genap/ganjil'], 'genap')
        self.assertEqual(reference[1]['ekor genap/ganjil'], 'ganjil')
        self.assertEqual(reference[1]['kepala prima'], 'prima')
        self.assertEqual(reference[1]['ekor prima'], 'prima')


if __name__ == '__main__':
    unittest.main()
