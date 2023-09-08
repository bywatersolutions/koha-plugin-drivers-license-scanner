# Koha Drivers License Scanner plugin

This plugin adds a box on the patron editor page into which one may scan the PDF417 formatted barcode found on driver's licenses in the United States.

Scanning a driver's license will populate the address for the patron from the data stored in the barcode.

## Usage

Just install the plugin. There is no configuration for this plugin.

Your barcode scanner must be programmed to output scans of PDF417 with one segement per line.

### Example
```
@
∖u001e∖rANSI 636004080002DL00410266ZN03070017DLDAQ123456789123∖nDCSDOE
DDEN
DACJANE
DDFN
DAD
DDGN
DCAC
DCBNONE
DCDNONE
DBD08152015
DBB08151987
DBA08152020
DBC2
DAU070 in
DAYBRO
DAG1100 NEW BERN AVENUE
DAIRALEIGH
DAJNC
DAK276970001
DCF0123456789
DCGUSA
DAZBRO
DCLU
DCK000012345678NCSVTL01
DDB10242014
DDK1
DDL1
ZNZNADUP
ZNB
ZNC0
```
