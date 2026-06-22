/*
 * AAMVA test fixtures for the DLScanner plugin.
 *
 * NO REAL DATA. These fixtures are entirely fabricated. The "v10" fixtures
 * reproduce the STRUCTURE of a real Virginia v10 scan from the support ticket
 * (AAMVA version, element IDs, field order, fixed-width padding, control-char
 * placement) but every value - personal AND jurisdiction (name, DOB, address,
 * license number, document discriminator, inventory control number, city,
 * state, ZIP, IIN) - has been replaced and shares nothing with the real scan.
 * The rest are synthetic too.
 *
 * Control characters are written literally:
 *   \n   = LF (0x0A)  -- scanner sends this as Ctrl+J
 *   \x1e = RS (0x1E)  -- scanner sends this as Ctrl+6 (per the ticket)
 *   \r   = CR (0x0D)  -- scanner sends this as Enter
 *
 * Each fixture's `raw` is what the parser should receive once the keystroke
 * burst has been reconstructed. The harness converts each character back into
 * the key event a keyboard-wedge scanner would emit (see toKeystrokes()).
 */

const FIXTURES = [
  {
    name: 'v10 (synthetic jurisdiction, fixed-width / no LF between fields)',
    note: 'Reproduces a real-world Datalogic QD2430 capture shape: header ' +
          'control chars, then all elements concatenated and space-padded with ' +
          'no LF between fields. All values fabricated.',
    raw: '@\n\x1e\rANSI 700000100202' +
         'DL00410260ZV03000050' +
         'DL' +
         'DCAD   ' +
         'DCBC         ' +
         'DCDNONE ' +
         'DBA01012032' +
         'DCSPUBLIC PATRON                        ' +
         'DACALEX                                     ' +
         'DADJORDAN                                   ' +
         'DBD01012024' +
         'DBB01011990' +
         'DBC1' +
         'DAYBLK' +
         'DAU069 in' +
         'DAG100 LIBRARY WAY APT 2                 ' +
         'DAIFAIRVIEW            ' +
         'DAJOH' +
         'DAK441000000' +
         'DAQT12345678   ' +
         'DCF012345678   ' +
         'DCGUSA' +
         'DDENDDFNDDGN' +
         'DCK0000000000000000' +
         'DCU     ' +
         'DDANDDB01012020DDC00000000DDD0' +
         '\rZVZVTESTONLYDATA000000000000000000\r',
    expect: {
      surname: 'PUBLIC PATRON',
      firstname: 'ALEX',
      address: '100 LIBRARY WAY APT 2',
      city: 'FAIRVIEW',
      state: 'OH',
      zipcode: '44100',
    },
  },

  {
    name: 'v10 (synthetic jurisdiction, spec-compliant LF between every element)',
    note: 'Same data as above but with a real LF (Ctrl+J) between each element, ' +
          'as a fully spec-compliant scanner emits. Exercises many Ctrl+J events.',
    raw: '@\n\x1e\rANSI 700000100201' +
         'DL00410260DL' +
         'DCAD\nDCBNONE\nDCDNONE\n' +
         'DBA01012032\nDCSPUBLIC PATRON\nDACALEX\nDADJORDAN\n' +
         'DBD01012024\nDBB01011990\nDBC1\nDAYBLK\nDAU069 in\n' +
         'DAG100 LIBRARY WAY APT 2\nDAIFAIRVIEW\nDAJOH\nDAK441000000\n' +
         'DAQT12345678\nDCFNONE\nDCGUSA\nDDEN\nDDFN\nDDGN\r',
    expect: {
      surname: 'PUBLIC PATRON',
      firstname: 'ALEX',
      address: '100 LIBRARY WAY APT 2',
      city: 'FAIRVIEW',
      state: 'OH',
      zipcode: '44100',
    },
  },

  {
    name: 'CA v09 (synthetic, LF between elements)',
    note: 'Synthetic California license, AAMVA version 09.',
    raw: '@\n\x1e\rANSI 636014090002' +
         'DL00410280DL' +
         'DCADAMC\nDCBNONE\nDCDNONE\n' +
         'DBA12152029\nDCSDOE\nDACJANE\nDADQUINN\n' +
         'DBD12152021\nDBB07151988\nDBC2\nDAYBRO\nDAU065 in\n' +
         'DAG500 SUNSET BLVD\nDAILOS ANGELES\nDAJCA\nDAK900010000\n' +
         'DAQD1234567\nDCFNONE\nDCGUSA\nDDEN\nDDFN\nDDGN\r',
    expect: {
      surname: 'DOE',
      firstname: 'JANE',
      address: '500 SUNSET BLVD',
      city: 'LOS ANGELES',
      state: 'CA',
      zipcode: '90001',
    },
  },

  {
    name: 'FL v01 (synthetic, name concatenated in DAA)',
    note: 'Synthetic Florida license, AAMVA version 01 (2000). Name is a single ' +
          'DAA element "LAST,FIRST,MIDDLE"; exercises the non-default v1 code path.',
    raw: '@\n\x1e\rANSI 636010010001' +
         'DL00410230DL' +
         'DAQS123456789\nDAASMITH,ROBERT,LEE\n' +
         'DAG742 EVERGREEN TER\nDAIMIAMI\nDAJFL\nDAK331010000\n' +
         'DARE\nDAS \nDAT \nDBA01012030\nDBB19850704\nDBC1\n\r',
    expect: {
      surname: 'SMITH',
      firstname: 'ROBERT',
      address: '742 EVERGREEN TER',
      city: 'MIAMI',
      state: 'FL',
      zipcode: '33101',
    },
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIXTURES };
}
