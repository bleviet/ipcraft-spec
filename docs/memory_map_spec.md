<!-- editorconfig-checker-disable-file -->
<!-- YAML examples use two-space indentation. -->

# Define a Memory Map

An `*.mm.yml` file describes one or more memory maps. Each map contains address
blocks, registers, and optional bit fields. The file root is always a YAML list.

## Start with a small map

```yaml
- name: CSR
  description: Control and status registers
  addressBlocks:
    - name: REGS
      baseAddress: 0
      range: 4K
      defaultRegWidth: 32
      registers:
        - name: CONTROL
          offset: 0
          access: read-write
          fields:
            - name: ENABLE
              bits: '[0:0]'
              resetValue: 0
        - name: STATUS
          offset: 4
          access: read-only
          fields:
            - name: BUSY
              bits: '[0:0]'
```

## Understand the hierarchy

```text
memory map
└── address block
    ├── register
    │   └── bit field
    └── register group or array
        └── child register
```

A single file may contain several top-level memory maps.

## Define a memory map

| Field | Purpose |
|---|---|
| `name` | Required map name; bus interfaces use this value in `memoryMapRef` |
| `description` | Short explanation of the map |
| `addressBlocks` | Ordered list of address blocks |
| `versionHistory` | Optional record of released register layouts; see [Record released versions](#record-released-versions) |

## Add address blocks

An address block is one contiguous region.

```yaml
addressBlocks:
  - name: REGS
    baseAddress: 0
    range: 4096
    usage: register
    access: read-write
    defaultRegWidth: 32
    description: Main register bank
```

| Field | Default | Purpose |
|---|---|---|
| `name` | Required | Block name |
| `baseAddress` | `0` | Start address in the memory map |
| `range` | Unset | Size as bytes or text such as `4K` or `1M` |
| `usage` | `register` | `register`, `memory`, or `reserved` |
| `access` | `read-write` | Default access for registers in the block |
| `defaultRegWidth` | `32` | Default register width in bits |
| `description` | Empty | Human-readable purpose |
| `registers` | Empty | Registers and register groups |

Memory and reserved blocks may omit `registers`.

## Add registers

```yaml
registers:
  - name: CONTROL
    offset: 0x10
    size: 32
    access: read-write
    resetValue: 0
    description: Main control register
```

| Field | Default | Purpose |
|---|---|---|
| `name` | Required | Register name |
| `offset` | Auto-assigned when omitted | Byte offset from the block base |
| `size` | `32` | Register width in bits |
| `access` | `read-write` | Default field access |
| `resetValue` | `0` | Reset value for the complete register. A register without fields may use a [`$version` reference](#refer-to-the-ip-version) |
| `description` | Empty | Human-readable purpose |
| `fields` | Empty | Named bit ranges |
| `count` | `1` | Number of array elements |
| `stride` | Unset | Bytes between array elements |
| `registers` | Empty | Child registers in a group |

Use explicit offsets when software compatibility matters. Omitting an offset
lets IPCraft place the register after the preceding item.

## Add bit fields

Define a field with either a range string or an offset and width.

```yaml
fields:
  - name: MODE
    bits: '[2:1]'
    access: read-write
    resetValue: 0
    enumeratedValues:
      0: IDLE
      1: RUN
      2: PAUSE
    description: Operating mode

  - name: PRESCALE
    offset: 4
    width: 8
    access: read-write
```

| Field | Default | Purpose |
|---|---|---|
| `name` | Required | Field name |
| `bits` | Unset | Inclusive range such as `'[7:0]'` |
| `offset`, `width` | Unset | Equivalent LSB position and number of bits |
| `access` | `read-write` | Hardware and software access behavior |
| `resetValue` | Unset | Field reset value, or a [`$version` reference](#refer-to-the-ip-version) |
| `enumeratedValues` | Unset | Map numeric values to names |
| `monitorChangeOf` | Unset | Name of a field to watch for changes |
| `description` | Empty | Human-readable purpose |

Do not use both range styles on the same field. Keep every field inside the
register width and avoid overlapping fields unless a consumer explicitly
supports overlays.

## Choose an access type

| Access | Meaning |
|---|---|
| `read-only` | Software can read the value but cannot write it |
| `write-only` | Software can write the value but does not read it back |
| `read-write` | Normal stored value |
| `write-1-to-clear` | Hardware sets the bit, writing one clears it, and reads return zero |
| `read-write-1-to-clear` | Hardware sets the bit, software reads it, and writing one clears it |
| `write-self-clearing` | A write creates a pulse and the stored bit clears itself |
| `read-write-self-clearing` | Readable value that clears itself after a write |

A field can override the access inherited from its register.

The two write-one-to-clear types differ only in what a read returns. Use
`read-write-1-to-clear` for a sticky flag that software polls, reads, and then
clears, such as an interrupt status or change flag. Use `write-1-to-clear` when
software only acknowledges an event and never needs to read it, for example
because an interrupt line already signals it.

## Create a register array

Use `count` and `stride` to repeat one register.

```yaml
registers:
  - name: CHANNEL_GAIN
    offset: 0x20
    count: 4
    stride: 4
    access: read-write
    fields:
      - name: VALUE
        bits: '[11:0]'
```

This describes four register instances separated by four bytes. Choose a stride
large enough for the register width.

## Create an array of register groups

A register can contain child registers. Add `count` and `stride` to repeat the
whole group.

```yaml
registers:
  - name: DMA
    offset: 0x100
    count: 2
    stride: 32
    registers:
      - name: SOURCE
        offset: 0
      - name: DESTINATION
        offset: 4
      - name: LENGTH
        offset: 8
```

Child offsets are relative to the group instance.

## Detect a field change

`monitorChangeOf` creates a sticky change flag without requiring an external
pulse input.

```yaml
- name: SENSOR_STATUS
  offset: 0x40
  access: read-write-1-to-clear
  fields:
    - name: TEMP_VALUE
      bits: '[15:4]'
      access: read-only
      description: Live temperature sample

    - name: TEMP_UPDATED
      bits: '[16:16]'
      access: read-write-1-to-clear
      monitorChangeOf: TEMP_VALUE
      description: Set when TEMP_VALUE changes
```

The generator stores the previous value of `TEMP_VALUE`, compares it with the
live value, and sets `TEMP_UPDATED` when they differ. Software reads the sticky
bit and clears it by writing one.

`monitorChangeOf` is valid only on `write-1-to-clear` or
`read-write-1-to-clear` fields. Use `read-write-1-to-clear` when software must
read the flag; a `write-1-to-clear` flag always reads as zero. The named field must exist in the same register.

## Refer to the IP version

A `resetValue` can be a reference to the `vlnv.version` of the IP core that
imports this map. The reference stays in the file. The generator replaces it
with the current version, so the register always holds it.

```yaml
registers:
  - name: VERSION
    offset: 0x0
    fields:
      - name: MAJOR
        bits: '[23:16]'
        resetValue: $version.major
      - name: MINOR
        bits: '[15:8]'
        resetValue: $version.minor
      - name: PATCH
        bits: '[7:0]'
        resetValue: $version.patch
```

| Reference | Meaning |
|---|---|
| `$version` | The whole version, packed with the major component in the most significant byte, 8 bits per component |
| `$version.major` | The major component |
| `$version.feature` | The feature component (`major.feature.minor.patch` only) |
| `$version.minor` | The minor component |
| `$version.patch` | The patch component (not in `major.minor`) |
| `$version.crc8` | CRC-8 of the version bytes (8 bits) |
| `$version.crc16` | CRC-16 of the version bytes (16 bits) |

The version bytes are the components, most significant first, one byte each
(`1.4.2` is `01 04 02`). With a `free` version they are the UTF-8 bytes of the
trimmed `vlnv.version` text. A driver recomputes the CRC over the version it
reads and compares it with the CRC register to check the version register.

| Reference | Algorithm | Parameters | Check value for `123456789` |
|---|---|---|---|
| `$version.crc8` | CRC-8/I-432-1 | polynomial `0x07`, initial `0x00`, no reflection, final XOR `0x55` | `0xA1` |
| `$version.crc16` | CRC-16/IBM-3740 (CCITT-FALSE) | polynomial `0x1021`, initial `0xFFFF`, no reflection, final XOR `0x0000` | `0x29B1` |

The parameters are chosen so that version `0.0` (and `0.0.0`, `0.0.0.0`) never
gives a CRC of 0: an unprogrammed, all-zero register is not a valid CRC.

Rules:

- The IP core must set a numeric `vlnv.versionScheme`; see
  [Choose a version scheme](ip_spec.md#choose-a-version-scheme). The CRC
  references also work with a `free` version.
- A field with a component reference is exactly 8 bits wide. A field with
  `$version` is exactly `8 * n` bits wide, where `n` is the number of components.
  A field with `$version.crc8` is exactly 8 bits wide, and one with
  `$version.crc16` exactly 16 bits wide.
- A register without fields may use any reference. It must be at least as wide
  as the reference needs; a wider register holds the value zero-extended.
- A register with fields uses references on its fields, not on the register.
- A memory map has one register that holds references, and register arrays do
  not support them.

A field or register with a reference is a read-only constant in generated
hardware, whatever its `access` says.

## Record released versions

`versionHistory` records which register layout each released version of the IP
core used, so a driver can find the layout that matches the hardware it reads.
It is valid in `*.mm.yml` files only. An inline memory map in an `*.ip.yml` does
not accept it.

```yaml
- name: CSR
  addressBlocks:
    - name: REGS
      baseAddress: 0
      range: 4K
      registers:
        - name: VERSION
          offset: 0
          resetValue: $version
  versionHistory:
    registerSets:
      rs1-cfcf5f65555a5b01:
        addressBlocks:
          - name: REGS
            baseAddress: 0
            range: 4K
            registers:
              - name: VERSION
                offset: 0
                resetValue: $version
    versions:
      - version: 1.4.1
        registerSet: rs1-cfcf5f65555a5b01
        crc8: 109
        crc16: 10057
```

| Field | Purpose |
|---|---|
| `registerSets` | Frozen copies of `addressBlocks`, keyed by `rs1-` and 16 lowercase hex digits |
| `versions` | Released versions in release order; each has a non-empty `version`, the `registerSet` key it used, and optionally `crc8` and `crc16` |

`crc8` (0 to 255) and `crc16` (0 to 65535) are the [version CRCs](#refer-to-the-ip-version)
of that version under the version scheme of the IP core when the entry was
written. Entries written by earlier versions of the extension have no CRCs.

The key is the first 16 hex digits of a SHA-256 hash of the layout that a driver
depends on: names, offsets, sizes, bit ranges, access, reset values, and
`$version` references. Descriptions, comments, and formatting do not change it.
`rs1` names the version of that hash definition. The last entry of `versions` is
the latest version. Versions that share a layout share one register set.

The extension writes this block. Edit it by hand only to repair it.

## Continue with an example

- `templates/minimal.mm.yml` for an empty map
- `templates/basic.mm.yml` for a small register bank
- `templates/array.mm.yml` for repeated registers
- `templates/multi_block.mm.yml` for several address blocks
- `examples/comprehensive_axi/comprehensive_axi.mm.yml` for broad coverage
- `examples/comprehensive_avalon/comprehensive_avalon.mm.yml` for an Avalon map
