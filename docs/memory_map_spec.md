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
| `resetValue` | `0` | Reset value for the complete register |
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
| `resetValue` | Unset | Field reset value |
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
| `write-1-to-clear` | Writing one clears the selected bit |
| `read-write-1-to-clear` | Readable stored value with write-one-to-clear behavior |
| `write-self-clearing` | A write creates a pulse and the stored bit clears itself |
| `read-write-self-clearing` | Readable value that clears itself after a write |

A field can override the access inherited from its register.

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
      access: write-1-to-clear
      monitorChangeOf: TEMP_VALUE
      description: Set when TEMP_VALUE changes
```

The generator stores the previous value of `TEMP_VALUE`, compares it with the
live value, and sets `TEMP_UPDATED` when they differ. Software clears the sticky
bit by writing one.

`monitorChangeOf` is valid only on `write-1-to-clear` or
`read-write-1-to-clear` fields. The named field must exist in the same register.

## Continue with an example

- `templates/minimal.mm.yml` for an empty map
- `templates/basic.mm.yml` for a small register bank
- `templates/array.mm.yml` for repeated registers
- `templates/multi_block.mm.yml` for several address blocks
- `examples/comprehensive_axi/comprehensive_axi.mm.yml` for broad coverage
- `examples/comprehensive_avalon/comprehensive_avalon.mm.yml` for an Avalon map
